import React, { Component } from 'react';
import { Nav } from '@alifd/next';

import Pipeline from '../Pipeline';
import Log from '../Log';
import Home from '../Home';
import './index.scss';

const { Item } = Nav;

const header = <span className="header">pipcook</span>;

export default class Dashboard extends Component {

  state = {
    selectedKeys: ['home'],
  }

  select = (selectedKeys) => {
    this.setState({ selectedKeys });
  }

  render() {
    const {selectedKeys} = this.state;
    const selectedKey = selectedKeys[0];
    return (
      <div className="dashboard">
        <Nav className="basic-nav" onSelect={this.select} direction="hoz" type="primary" header={header} selectedKeys={selectedKeys} triggerType="hover">
          <Item key="home">Home</Item>
          <Item key="pipelines">Pipelines</Item>
          <Item key="jobs">Jobs</Item>
        </Nav>
        <div className="content">
          {selectedKey === 'home' && <Home />}
          {selectedKey === 'pipelines' && <Pipeline />}
          {selectedKey === 'jobs' && <Log />}
        </div>
      </div>
      
    );
  }
  
}
