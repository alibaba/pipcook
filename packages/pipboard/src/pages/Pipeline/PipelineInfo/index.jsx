import React, { Component } from 'react';
import { Select, Button } from '@alifd/next';
import axios from 'axios';
import { Table } from '@alifd/next';
import queryString from 'query-string';
import ReactJson from 'react-json-view'

import {messageError} from '@/utils/message';
import { formatPluginName } from '@/utils/format';
import { PLUGINS, pluginList } from '@/utils/config';
import ChooseItem from '@/pages/Pipeline/PipelineInfo/components/ChooseItem'
import { get } from '@/utils/request';

import './index.scss';

export default class Pipeline extends Component {

  state = {
    task: 'image-classification',
    isCreate: true,
    plugins: {},
    choices: {},
    currentSelect: 'dataCollect'
  }

  async componentDidMount() {
    let params = queryString.parse(location.hash.split('?')[1]);
    if (params && params.pipelineId) {
      const data = await get(`/pipeline/info/${params.pipelineId}`);
      this.setState({
        isCreate: false,
        plugins: data.plugins
      })
    }
    this.setState({
      choices: pluginList
    })
  }

  selectTask = (task) => {
    this.setState({
      task
    })
  };

  changeSelectPlugin = (itemName, value) => {
    const { plugins } = this.state;
    plugins[itemName] = {
      name: value,
      params: {}
    };
    this.setState({plugins});
  }

  render() {
    const { plugins, choices, currentSelect } = this.state;
    console.log(plugins);
    return (
      <div className="pipeline-info">
        <div className="title-wrapper" >
          <span className="title">Pipeline Configuration</span>
        </div>
        {/* {
          isCreate && <Select onChange={this.selectTask} value={task} className="select-task">
            {
              TASKS.map(item => <Option value={item.id} key={item.id}>{item.content}</Option>)
            }
          </Select>
        } */}
        
        <div className="content-wrapper">
          <div className="plugin-choose">
            {
              PLUGINS.map(pluginId => choices[pluginId] && choices[pluginId].length > 0 
                && <div key={pluginId} onClick={() => this.setState({currentSelect: pluginId})}>
                  <ChooseItem itemName={pluginId} plugins={plugins}
                    choices={choices} changeSelectPlugin={this.changeSelectPlugin} currentSelect={currentSelect === pluginId} />
                </div>
              )
            }
          </div>
          <div className="plugin-config">
            <ReactJson onEdit={() => {}} onAdd={() => {}} onDelete={() => {}} src={{a: 1}} name={false} displayDataTypes={false} />
          </div>
          <div className="plugin-operate">
            <Button className="button" size="large" type="primary">Run Pipeline</Button>
            <Button className="button" size="large">View Samples</Button>
            <Button className="button" size="large">View Logs</Button>
            <Button className="button" size="large">Export</Button>
            <Button className="button" size="large">Save</Button>
            <Button className="button" size="large" type="primary" warning>Delete</Button>
          </div>
        </div>
      </div>
    );
  }
  
}
