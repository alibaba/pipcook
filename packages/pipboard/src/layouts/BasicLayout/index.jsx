
import React, { Component } from 'react';
import { Nav } from '@alifd/next';
import { observer, inject, Provider } from "mobx-react";

import pipelineStore from '@/stores/pipelineStore';

import './index.scss';

const { Item } = Nav;

const header = <span className="header">pipcook</span>;

export default class Dashboard extends Component {

  state = {
    selectedKeys: ['home'],
  }

  select = (selectedKeys) => {
    this.setState({ selectedKeys });
    location.href = `/#/${selectedKeys[0]}`;
  }

  render() {
    const {selectedKeys} = this.state;
    return (
      <div className="dashboard">
        <Nav className="basic-nav" onSelect={this.select} direction="hoz" type="primary" header={header} selectedKeys={selectedKeys} triggerType="hover">
          <Item key="home">Home</Item>
          <Item key="pipelines">Pipelines</Item>
          <Item key="jobs">Jobs</Item>
        </Nav> 
        <Provider pipelineData={pipelineStore} >
          {this.props.children}
        </Provider>
        
      </div>
      
    );
  }
}
