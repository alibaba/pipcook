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
        const result = response.data.rows.map((item) => {
          return {
           ...item,
           startTime: new Date(item.createdAt).toLocaleString(), 
           endTime: new Date(item.endTime).toLocaleString(),
          };
        });
        this.setState({data: result});
      } else {
        messageError(response.message);
      }
    } catch (err) {
      messageError(err.message);
    }
  }

  showModal = (record) => {
    Dialog.show({
      title: 'Dataset',
      content: record.metadata,
    });
  }

  render() {
    const {data} = this.state;
    return (
      <div className="log">
        <Table dataSource={data}>
          <Table.Column title="Job Id" dataIndex="id" />
          <Table.Column title="Pipeline Id" dataIndex="pipelineId" />
          <Table.Column title="Pipeline Version" dataIndex="coreVersion" />
          <Table.Column title="Test Evaluation" dataIndex="evaluateMap"/>
          <Table.Column title="Metadata" cell={(value, index, record) => <Button onClick={() => this.showModal(record)}>Expand</Button>}/>
          <Table.Column title="Start Time" dataIndex="startTime"/>
          <Table.Column title="End Time" dataIndex="endTime"/>
        </Table>
      </div>
    );
  }
  
}
