import React, { Component } from 'react';
const axios = require('axios');
import IceNotification from '@icedesign/notification';
import { Table } from '@alifd/next';
import { Button, Dialog } from '@alifd/next';

export default class Log extends Component {

  state = {
    data: []
  }
  componentDidMount = async () => {
    axios.get('/log')
      .then((response) => {
        const data =response.data.data;
        const result = data.map((item) => {
          return {
           ...item,
           startTime: new Date(item.startTime).toLocaleString(), 
           endTime: new Date(item.endTime).toLocaleString(),
          }
        })
        this.setState({ data: result});
      })
      .catch((err) => {
        IceNotification.error({
          message: 'Error',
          description: JSON.stringify(err)
        })
      })
  }

  showModal = (record, value) => {
    if (value === 0) {
      Dialog.show({
        title: 'Plugins Status',
        content: record.components
      });
    } else if (value === 1) {
      Dialog.show({
        title: 'Dataset',
        content: record.dataset
      });
    }
  }

  render() {
    const {data} = this.state;
    return (
      <div className="home">
        <Table dataSource={data}>
          <Table.Column title="Pipeline Id" dataIndex="pipelineId" />
          <Table.Column title="Model Id" dataIndex="modelId" />
          <Table.Column title="Pipeline Versiom" dataIndex="pipelineVersion" />
          <Table.Column title="Test Evaluation" dataIndex="evaluation"/>
          <Table.Column title="Type" dataIndex="type"/>
          <Table.Column title="Plugins Status" cell={(value, index, record) => <Button onClick={() => this.showModal(record, 0)}>Expand</Button>}/>
          <Table.Column title="Dataset" cell={(value, index, record) => <Button onClick={() => this.showModal(record, 1)}>Expand</Button>}/>
          <Table.Column title="Start Time" dataIndex="startTime"/>
        </Table>
      </div>
    );
  }
  
}
