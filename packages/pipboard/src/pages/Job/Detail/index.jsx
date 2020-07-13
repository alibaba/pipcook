import React, { Component } from 'react';
import { Button, Timeline, Select, Divider, Tab, Icon } from '@alifd/next';
import queryString from 'query-string';

import { messageError, messageSuccess } from '@/utils/message';
import { PLUGINS, pluginList, PIPELINE_STATUS } from '@/utils/config';
import { get } from '@/utils/request';
import { addUrlParams } from '@/utils/common';
import './index.scss';

function formatJSON(str) {
  return JSON.stringify(
    JSON.parse(str),
    null, 2
  );
}

export default class JobDetailPage extends Component {

  state = {
    plugins: {},
    choices: pluginList,
    currentSelect: 'dataCollect',
    pipelineId: null,
    jobId: null,
    job: {
      stdout: '',
      stderr: '',
      evaluate: {
        pass: null,
        maps: null
      }
    }
  };

  async componentWillMount() {
    const { jobId } = queryString.parse(location.hash.split('?')[1]);
    const job = await get(`/job/${jobId}`);
    const pipeline = await get(`/pipeline/info/${job.pipelineId}`);

    this.setState({
      plugins: pipeline.plugins,
      pipelineId: job.pipelineId,
      jobId
    });
    this.updateJobState();
  }

  updateJobState = async () => {
    const job = await get(`/job/${this.state.jobId}`);
    const logs = await get(`/job/${this.state.jobId}/log`);
    if (!logs) {
      return;
    }
    this.setState({
      job: {
        stdout: logs?.log[0],
        stderr: logs?.log[1],
        evaluate: {
          pass: job.evaluatePass,
          maps: formatJSON(job.evaluateMap)
        },
        dataset: formatJSON(job.dataset),
        status: job.status
      }
    });
    if (job.status < 2) {
      setTimeout(this.updateJobState, 1000);
    }
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

  downloadOutput = () => {
    location.href = `/job/${this.state.jobId}/output.tar.gz`;
  }

  restart = async () => {
    const { jobId } = this.state;
    const job = await get('/job/restart', {
      params: {
        jobId, 
        cwd: CWD,
      },
    });
    location.reload();
  }

  stop = async () => {
    const { jobId } = this.state;
    const job = await get('/job/stop', {
      params: { id: jobId }
    });
    messageSuccess('job is not running.');
  }

  render() {
    const { job, plugins, choices } = this.state;
    const renderTimelineItem = (title, extra) => {
      const titleNode = <span className="plugin-choose-title">{title}</span>;
      return <Timeline.Item  title={titleNode} {...extra}></Timeline.Item>;
    };
    const renderLogView = (logs) => {
      return <pre className="job-logview">
        {logs}
        {job?.status === 1 && <Icon type="loading" />}
      </pre>;
    };

    return (
      <div className="job-info">
        <div className="title-wrapper" >
          <span className="title">job({this.state.jobId})</span>
        </div>
        <div className="content-wrapper">
          <div className="plugin-choose">
            <Timeline className="plugin-choose-timeline">
              {
                PLUGINS.filter(({ id }) => {
                  return choices[id] && plugins[id];
                }).map(({ id, title }) => {
                  const plugin = plugins[id].plugin;
                  const selectNode = <Select className="plugin-choose-selector" value={plugin.name} disabled>
                    <Select.Option key={plugin.name} value={plugin.name}>{plugin.name}</Select.Option>
                  </Select>;
                  return renderTimelineItem(title, {
                    key: id,
                    state: 'done',
                    content: selectNode,
                  });
                })
              }
            </Timeline>
            <Divider />
            <div className="plugin-choose-actions">
              <Button size="medium"
                type="secondary"
                onClick={() => {
                  location.href = `#/pipeline/info?pipelineId=${this.state.pipelineId}`;
                }}>View Pipeline</Button>
              <Button size="medium" type="secondary"
                onClick={this.restart}>Restart</Button>
              <Button size="medium" warning
                disabled={!job || job.status > 1}
                onClick={this.stop}>Stop</Button>
            </div>
            <Divider />
            <div className="plugin-choose-actions">
              <Button size="medium" disabled={job?.evaluate.pass !== true} onClick={this.downloadOutput}>Download Output</Button>
            </div>
          </div>
          <div className="job-outputs">
            <Tab className="job-outputs-box">
              <Tab.Item title="stdout">{renderLogView(job?.stdout)}</Tab.Item>
              <Tab.Item title="stderr">{renderLogView(job?.stderr)}</Tab.Item>
              <Tab.Item title="dataset"><pre className="job-logview">{job?.dataset}</pre></Tab.Item>
              <Tab.Item title="summary"><pre className="job-logview">{job?.evaluate?.maps}</pre></Tab.Item>
            </Tab>
          </div>
        </div>
      </div>
    );
  }
  
}
