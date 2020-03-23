import React, { Component } from 'react';
import axios from 'axios';
import { Nav } from '@alifd/next';

import Model from '../Model';
import Dataset from '../Dataset';
import Log from '../Log';
import Home from '../Home';
import './index.scss';

const { Item } = Nav;

const header = <span className="header">pipcook</span>;

export default class Dashboard extends Component {

  state = {
    selectedKeys: ['home'],
    pluginList: [],
  }

  async componentDidMount() {
    try {
      let response = await axios.get('/ui-plugin/list');
      response = response.data;
      if (response.status) {
        this.setState({pluginList: response.plugins});
      }
      
    } catch (err) {
      console.error(err);
    }
  }

  select = (selectedKeys) => {
    this.setState({ selectedKeys });
  }

  render() {
    const {selectedKeys, pluginList} = this.state;
    const selectedKey = selectedKeys[0];
    let customPluginPath = pluginList.find(e => e.pluginName === selectedKey);
    if (customPluginPath) {
      customPluginPath = customPluginPath.pluginPath;
    }
    return (
      <div className="dashboard">
        <Nav className="basic-nav" onSelect={this.select} direction="hoz" type="primary" header={header} selectedKeys={selectedKeys} triggerType="hover">
          <Item key="home">Home</Item>
          <Item key="jobs">Jobs</Item>
          <Item key="model">Models</Item>
          {/* <Item key="orchestration">Orchestration</Item>        */}
          {
            pluginList.map((plugin) => (
              <Item key={plugin.pluginName}>{plugin.pluginName}</Item>
            ))
          }
        </Nav>
        <div className="content">
          {!customPluginPath && selectedKey === 'home' && <Home />}
          {!customPluginPath && selectedKey === 'model' && <Model />}
          {!customPluginPath && selectedKey === 'dataset' && <Dataset />}
          {!customPluginPath && selectedKey === 'jobs' && <Log />}
          {!customPluginPath && selectedKey === 'orchestration' && <Orchestration />}
          {}
          {
            customPluginPath && <iframe src={customPluginPath} className="plugin-iframe" title={selectedKey} />
          }
        </div>
      </div>
      
    );
  }
  
}
