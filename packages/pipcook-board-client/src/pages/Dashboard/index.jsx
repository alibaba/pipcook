import React, { Component } from 'react';
import { Nav } from '@alifd/next';
import Home from '../Home';
import Model from '../Model';
import Dataset from '../Dataset';
import Log from '../Log';
import Status from '../Status';
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
        <Item key="status">Jobs</Item>
        <Item key="model">Models</Item>
        <Item key="dataset">DataSets</Item>
        <Item key="log">Logs</Item>
      </Nav>
        <div className="content">
          {selectedKey === 'home' && <Home />}
          {selectedKey === 'model' && <Model />}
          {selectedKey === 'dataset' && <Dataset />}
          {selectedKey === 'log' && <Log />}
          {selectedKey === 'status' && <Status />}
        </div>
      </div>
      
    );
  }
  
}
