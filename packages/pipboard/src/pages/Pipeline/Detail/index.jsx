import React, { Component } from 'react';
import { Button, Divider, Timeline, Select, List, Loading, Icon, Form, Input, NumberPicker, Card, Grid } from '@alifd/next';
import queryString from 'query-string';
// import ReactJson from 'react-json-view';

import { messageError, messageSuccess } from '@/utils/message';
import { PLUGINS, pluginList, PIPELINE_STATUS } from '@/utils/config';
import { get, put } from '@/utils/request';
import './index.scss';

export default class PipelineDetail extends Component {

  state = {
    loading: true,
    plugins: {},
    choices: pluginList,
    jobs: [],
    currentSelect: 'dataCollect',
    pipelineId: null
  }

  async componentDidMount() {
    // get pipeline if and job id from url.
    const params = queryString.parse(location.hash.split('?')[1]);
    if (params && params.pipelineId) {
      const id = params.pipelineId;
      const pipeline = await get(`/pipeline/info/${id}`);
      if (!pipeline) {
        messageError('timeout to request the pipeline and plugins.');
        this.setState({ loading: false });
        return;
      }

      Object.keys(pipeline.plugins).forEach(
        key => pipeline.plugins[key].package = pipeline.plugins[key].name,
      );

      this.setState({
        loading: false,
        plugins: pipeline.plugins,
        pipelineId: params.pipelineId
      });

      // fetch the jobs data in async.
      this.fetchJobs(id);
    }
  }

  fetchJobs = async (id) => {
    let jobResp = await get(`/job/list?pipelineId=${id}`);
    let jobs = [];
    if (jobResp) {
      jobs = jobResp.rows;
    }
    this.setState({ jobs });
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

  savePipeline = async (showMessage = true) => {
    const { plugins, pipelineId } = this.state;
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

  startJob = async () => {
    const { pipelineId } = this.state;
    await this.savePipeline(false);
    const job = await get('/job/run', {
      params: {
        pipelineId,
        cwd: CWD,
      },
    });
    location.href = `#/job/info?jobId=${job.id}`;
  }

  deletePipeline = async () => {
    // TODO
  }

  setVisible = () => {
    const { logVisible } = this.state;
    this.setState({logVisible: !logVisible});
  }

  renderPluginEditor({ plugin, params }) {
    if (!plugin) {
      return;
    }
    const paramsConfig = plugin.pipcook.params || [];
    const { category } = plugin.pipcook;
    const { plugins } = this.state;

    const formItemLayout = {
      labelCol: {
        fixedSpan: 6
      },
      wrapperCol: {
        span: 16
      }
    };

    let author = plugin.author;
    if (author?.name) {
      author = author.name;
      if (author?.email) {
        author += `<${author.email}>`;
      }
    } else if (author?.email) {
      author = author.email;
    } else {
      author = 'no author';
    }

    return [
      <Card free>
        <Card.Header
          title={plugin.name}
          subTitle={author}
          extra={<Button text type="primary">Repository</Button>}
        />
        <Card.Content>{plugin.description || 'no description'}</Card.Content>
      </Card>,
      <Form style={{ marginTop: 20 }} {...formItemLayout}>
        {paramsConfig.map(({ name, type, description, defaultValue, ...config }) => {
          let input = null;
          const valueInState = plugins[category].params[name];
          const createChangeHandler = (key = false) => {
            return (val) => {
              if (key !== false) {
                plugins[category].params[name][key] = val;
              } else {
                plugins[category].params[name] = val;
              }
              this.setState({ plugins });
            };
          };

          if (type === 'string') {
            input = <Input
              name={name}
              placeholder="please enter a text"
              value={valueInState}
              defaultValue={defaultValue}
              onChange={createChangeHandler()}
            />;
          } else if (type === 'number') {
            input = <NumberPicker
              value={valueInState}
              defaultValue={defaultValue}
              onChange={createChangeHandler()}
            />;
          } else {
            const arrayMatch = type.match(/(number|string)\[(\d+)?\]/);
            if (arrayMatch != null) {
              if (arrayMatch[1] === 'number') {
                const cols = [];
                for (let i = 0; i < arrayMatch[2]; i++) {
                  cols.push(
                    <Grid.Col>
                      <Form.Item>
                        <NumberPicker
                          style={{ width: '95%' }}
                          value={valueInState[i]}
                          onChange={createChangeHandler(i)}
                        />
                      </Form.Item>
                    </Grid.Col>
                  );
                }
                input = <Grid.Row gutter={arrayMatch[2]}>{cols}</Grid.Row>;
              } else if (arrayMatch[1] === 'string') {
                console.log(defaultValue);
                const selectOpts = {
                  hasClear: true,
                  mode: 'multiple',
                  defaultValue,
                  value: valueInState,
                  onChange: createChangeHandler()
                };
                if (arrayMatch[2] === '1') {
                  selectOpts.mode = 'single';
                }
                const options = config.options.map((opt) => {
                  return <Select.Option key={opt} value={opt}>{opt}</Select.Option>;
                });
                input = <Select style={{width: '50%'}} {...selectOpts}>{options}</Select>;
              }
            }
          }
          const itemExtra = <span style={{ fontSize: 12, color: '#666' }}>{description}</span>;
          return <Form.Item label={name} extra={itemExtra}>{input}</Form.Item>
        })}
      </Form>
    ];
  }

  render() {
    const {
      plugins,
      choices,
      jobs,
      currentSelect,
      isCreate,
    } = this.state;

    return (
      <div className="pipeline-info">
        <div className="title-wrapper" >
          <span className="title">configuration</span>
        </div>
        <div className="content-wrapper">
          <div className="plugin-choose">
            {this.state.loading && <Loading className="plugin-choose-loading" tip="fetching pipeline..." ></Loading>}
            <Timeline>
              {
                PLUGINS.filter(({ id }) => {
                  return choices[id] && plugins[id];
                }).map(({ id, title }) => {
                  const plugin = plugins[id];
                  const selectPlugin = () => {
                    // TODO: render in right panel.
                    this.setState({ currentSelect: id });
                  };
                  const titleNode = <span className="plugin-choose-title" onClick={selectPlugin}>{title}</span>;
                  const selectNode = <Select className="plugin-choose-selector" defaultValue={plugin.package} hasClear>
                    {choices[id].map((value) => <Select.Option key={value} value={value}>{value}</Select.Option>)}
                    <Select.Option key={plugin.package} value={plugin.package}>{plugin.package}</Select.Option>
                  </Select>;
                  return <Timeline.Item
                    key={id}
                    title={titleNode}
                    content={selectNode}
                    state={currentSelect === id ? 'process' : 'done'}></Timeline.Item>;
                })
              }
            </Timeline>
            <Divider />
            <div className="plugin-choose-actions">
              <Button size="medium" type="secondary"
                onClick={this.savePipeline}>Save</Button>
              <Button size="medium" type="secondary"
                onClick={this.startJob}>Start</Button>
              <Button size="medium" warning
                onClick={this.deletePipeline}>Delete</Button>
            </div>
          </div>
          <div className="plugin-config">
            {plugins[currentSelect] && this.renderPluginEditor(plugins[currentSelect])}
          </div>
          <div className="plugin-operate">
            <List className="plugin-operate-jobs" size="small" header={
              <div className="plugin-operate-jobs-header">
                Jobs
                <Select defaultValue="all">
                  {PIPELINE_STATUS.map((status) => {
                    return <Select.Option key={status} value={status}>{status}</Select.Option>;
                  })}
                  <Select.Option value="all">Select All</Select.Option>
                </Select>
              </div>
            }>
              {jobs.map((job) => {
                let description = '';
                if (job.status === 0) {
                  description = 'initializing the dataset';
                } else if (job.status === 1) {
                  description = 'running this pipeline...';
                } else if (job.status === 2) {
                  description = <div>
                    <Icon type="success" size="small" />
                    <Button size="small">download output</Button>
                  </div>;
                } else if (job.status === 3) {
                  description = 'failed';
                }
                const titleNode = <a href={`#/job/info?jobId=${job.id}`}>{job.createdAt}</a>;
                return <List.Item title={titleNode} key={job.id}>{description}</List.Item>;
              })}
            </List>
          </div>
        </div>
      </div>
    );
  }
  
}
