import React, { Component } from 'react';
import axios from 'axios';
import { Table } from '@alifd/next';

import {messageError} from '../../utils/message';

export default class Model extends Component {

  state = {
    models: [],
  }

  componentDidMount = async () => {
    try {
      let response = await axios.get('/log/models');
      response = response.data;
      if (response.status) {
        const result = response.data.map((item) => {
          return {
           ...item,
           startTime: new Date(item.startTime).toLocaleString(), 
           endTime: new Date(item.endTime).toLocaleString(),
          };
        });
        this.setState({ models: result});
      } else {
        messageError(response.msg);
      }
    } catch (err) {
      messageError(err.message);
    }
    
  }

  render() {
    const {models} = this.state;
    return (
      <div className="home">
        <Table dataSource={models}>
          <Table.Column title="Model Id" dataIndex="modelId"/>
          <Table.Column title="Test Evaluation" dataIndex="evaluation"/>
          <Table.Column title="Type" dataIndex="type"/>
          <Table.Column title="Start Time" dataIndex="startTime"/>
          <Table.Column title="End Time" dataIndex="endTime"/>
        </Table>
      </div>
    );
  }
  
}
