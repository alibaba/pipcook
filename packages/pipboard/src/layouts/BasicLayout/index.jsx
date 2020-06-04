
import React, { Component } from 'react';
import { Nav } from '@alifd/next';

import './index.scss';

const { Item } = Nav;

const header = <span className="header">pipcook</span>;

export default class Dashboard extends Component {

  select = (selectedKeys) => {
    location.href = `/#/${selectedKeys[0]}`;
  }
  
  render() {
    return (
      <div className="dashboard">
        <Nav className="basic-nav" onSelect={this.select} direction="hoz" type="primary" header={header} selectedKeys={[]} triggerType="hover">
          <Item key="home">Home</Item>
          <Item key="pipeline">Pipelines</Item>
          <Item key="jobs">Jobs</Item>
        </Nav> 
        {this.props.children}
      </div>
      
    );
  }
}
