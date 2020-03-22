import React, { Component } from 'react';
import axios from 'axios';
import { Table , Button, Dialog } from '@alifd/next';


import {messageError} from '../../utils/message';

export default class Log extends Component {

  state = {
    data: [],
  }

  componentDidMount = async () => {
    try {
      let response = await axios.get('/log/logs');
      response = response.data;
      if (response.status) {
        const result = response.logs.map((item) => {
          return {
           ...item,
           startTime: new Date(item.startTime).toLocaleString(), 
           endTime: new Date(item.endTime).toLocaleString(),
          };
        });
        this.setState({data: result});
      } else {
        messageError(response.msg);
      }
    } catch (err) {
      messageError(err.message);
    }
  }

  showModal = (record, value) => {
    if (value === 0) {
      Dialog.show({
        title: 'Plugins Status',
        content: record.components,
      });
    } else if (value === 1) {
      Dialog.show({
        title: 'Dataset',
        content: record.dataset,
      });
    }
  }

  render() {
    const {data} = this.state;
    return (
      <div className="log">
        <Table dataSource={data}>
          <Table.Column title="Pipeline Id" dataIndex="pipelineId" />
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
