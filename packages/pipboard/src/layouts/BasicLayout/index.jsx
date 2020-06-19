
import React, { Component } from 'react';
import { Nav } from '@alifd/next';

import './index.scss';

const { Item } = Nav;

const header = <a href="/index.html" style={{ color: '#000' }}>
  <span className="header">PipBoard</span>
</a>;

export default class Dashboard extends Component {

  select = (selectedKeys) => {
    location.href = `/index.html#/${selectedKeys[0]}`;
  }
  
  render() {
    console.log(location.hash);

    return (
      <div className="dashboard">
        <Nav className="basic-nav"
          onSelect={this.select}
          direction="hoz"
          hozAlign="left"
          activeDirection="top"
          type="normal"
          header={header}
          selectedKeys={[location.hash.replace(/#\//, '') || 'home']}
          triggerType="hover">
          <Item key="pipeline">Pipelines</Item>
          <Item key="jobs">Jobs</Item>
        </Nav> 
        {this.props.children}
      </div>
    );
  }
}
