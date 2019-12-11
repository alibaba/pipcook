import React, { Component } from 'react';
const axios = require('axios');
import IceNotification from '@icedesign/notification';
import { Table } from '@alifd/next';

export default class Model extends Component {

  state = {
    models: []
  }
  componentDidMount = async () => {
    axios.get('/models')
      .then((response) => {
        const data =response.data.data;
        const result = data.map((item) => {
          return {
           ...item,
           startTime: new Date(item.startTime).toLocaleString(), 
           endTime: new Date(item.endTime).toLocaleString(),
          }
        })
        this.setState({ models: result});
      })
      .catch((err) => {
        IceNotification.error({
          message: 'Error',
          description: JSON.stringify(err)
        })
      })
  }

  render() {
    const {models} = this.state;
    return (
      <div className="home">
        <Table dataSource={models}>
          <Table.Column title="Model Id" dataIndex="modelId"/>
          <Table.Column title="Model Name" dataIndex="modelName" />
          <Table.Column title="Test Evaluation" dataIndex="evaluation"/>
          <Table.Column title="Type" dataIndex="type"/>
          <Table.Column title="Start Time" dataIndex="startTime"/>
          <Table.Column title="End Time" dataIndex="endTime"/>
        </Table>
      </div>
    );
  }
  
}
