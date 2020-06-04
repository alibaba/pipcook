import React, { Component } from 'react';
import { Button } from '@alifd/next';
import queryString from 'query-string';
import ReactJson from 'react-json-view';

import { messageError, messageSuccess } from '@/utils/message';
import { PLUGINS, pluginList, PIPELINE_STATUS } from '@/utils/config';
import ChooseItem from '@/pages/Pipeline/PipelineInfo/components/ChooseItem';
import LogView from '@/pages/Pipeline/PipelineInfo/components/LogView';
import { get, post, put } from '@/utils/request';
import { addUrlParams } from '@/utils/common';

import './index.scss';

export default class Pipeline extends Component {

  state = {
    isCreate: true,
    plugins: {},
    choices: {},
    currentSelect: 'dataCollect',
    pipelineId: null,
    jobId: null,
    jobStatus: 0,
    jobStdout: '',
    jobStderr: '',
    logVisible: false,
  }

  async componentDidMount() {
    // get pipeline if and job id from url.
    const params = queryString.parse(location.hash.split('?')[1]);
    if (params && params.pipelineId) {
      const data = await get(`/pipeline/info/${params.pipelineId}`);
      Object.keys(data.plugins).forEach(
        key => data.plugins[key].package = data.plugins[key].name,
      );
      this.setState({
        isCreate: false,
        plugins: data.plugins,
        pipelineId: params.pipelineId,
      });
    }
    if (params && params.jobId) {
      this.setState({
        jobId: params.jobId,
      });
      await this.fetchJob(params.jobId);
    }
    this.setState({
      choices: pluginList,
    });
  }

  // setinterval to fetch status of current running job.
  fetchJob = async (jobId) => {
    const fetchInterval = async () => {
      const jobInfo = await get(`/job/${jobId}`);
      const jobLog = await get(`/job/${jobId}/log`);
      this.setState({
        jobStatus: PIPELINE_STATUS[jobInfo.status],
        jobStdout: jobLog.log[0],
        jobStderr: jobLog.log[1],
      });
      if (jobInfo.status === 3 || jobInfo.status === 2) {
        return;
      }
      setTimeout(async () => {
        await fetchInterval();
      }, 1000);
    };
    await fetchInterval();
  }

  changeSelectPlugin = (itemName, value) => {
    const { plugins } = this.state;
    if (!value) {
      delete plugins[itemName];
    } else {
      plugins[itemName] = {
        package: value,
        params: {},
      };
    }
    
    this.setState({plugins});
  }

  updateParams = (event, selectType) => {
    const { plugins } = this.state;
    plugins[selectType].params = event.updated_src;
    this.setState({ plugins });
  }

  updatePipeline = async (showMessage=true) => {
    const { plugins, isCreate, pipelineId } = this.state;

    if (isCreate) {
      const pipelineRes = await post('/pipeline', {
        config: JSON.stringify({
          plugins,
        }),
        isFile: false,
      });
      this.setState({
        isCreate: false,
        pipelineId: pipelineRes.id,
      });
      messageSuccess('Create Pipeline Successfully');
      setTimeout(() => {
        addUrlParams(`pipelineId=${pipelineRes.id}`);
      }, 2000);
    } else {
      await put(`/pipeline/${pipelineId}`, {
        config: JSON.stringify({
          plugins,
        }),
        isFile: false,
      });
      if (showMessage) {
        messageSuccess('Update Pipeline Successfully');
      }
    }
  }

  runJob = async () => {
    const { isCreate, pipelineId } = this.state;
    if (isCreate) {
      messageError('Please Create Pipeline Firstly');
      return;
    }
    await this.updatePipeline(false);
    const job = await get('/job/run', {
      params: {
        pipelineId, 
        cwd: CWD,
      },
    });
    this.setState({
      jobId: job.id,
    });
    addUrlParams(`jobId=${job.id}`);
    await this.fetchJob(job.id);
  }

  setVisible = () => {
    const { logVisible } = this.state;
    this.setState({logVisible: !logVisible});
  }

  render() {
    const { 
      plugins, 
      choices, 
      currentSelect, 
      isCreate, 
      jobId,
      jobStatus,
      jobStdout,
      jobStderr,
      logVisible,
    } = this.state;
    return (
      <div className="pipeline-info">
        <LogView 
          visible={logVisible} 
          setVisible={this.setVisible} 
          stdout={jobStdout} 
          stderr={jobStderr} 
        />
        <div className="title-wrapper" >
          <span className="title">{isCreate ? 'Create a new Pipeline' : (jobId ? 'Job Detail' : 'Pipeline Configuration')}</span>
        </div>
         
        <div className="content-wrapper">
          <div className="plugin-choose">
            {
              PLUGINS.map(pluginId => choices[pluginId] && choices[pluginId].length > 0 
                && <div key={pluginId} onClick={() => this.setState({currentSelect: pluginId})}>
                  <ChooseItem 
                    itemName={pluginId} 
                    plugins={plugins}
                    choices={choices}
                    changeSelectPlugin={this.changeSelectPlugin}
                    currentSelect={currentSelect === pluginId}
                    jobId={jobId}
                  />
                </div>,
              )
            }
          </div>
          <div className="plugin-config">
            {
              plugins[currentSelect] ? <ReactJson 
                  onEdit={e => this.updateParams(e, currentSelect)}
                  onAdd={e => this.updateParams(e, currentSelect)}
                  onDelete={e => this.updateParams(e, currentSelect)}
                  src={plugins[currentSelect].params}
                  name={false}
                  displayDataTypes={false}
                /> : <span>Please choose a plugin</span>
            }
          </div>
          <div className="plugin-operate">
            {
                !jobId && <Button 
                  className="button" 
                  size="large" 
                  type="primary" 
                  onClick={this.updatePipeline}
                  >{isCreate ? 'Create Pipeline' : 'Update Pipeline'}
                </Button>
              }
            {
              !jobId && <Button 
                className="button" 
                size="large" 
                type="primary" 
                onClick={this.runJob}
                >Run Job
              </Button>
            }
            {!jobId && <Button className="button" size="large" type="primary" warning>Delete</Button> }
            {jobId && <Button className="button" size="large" onClick={() => this.setState({logVisible: true})}>View Logs</Button> }
            {jobId && <div className="job-info">Status: {jobStatus}</div>}
          </div>
        </div>
      </div>
    );
  }
  
}
