import React, { Component } from 'react';
import axios from 'axios';
import { Table } from '@alifd/next';

import {messageError} from '../../utils/message';

export default class Dataset extends Component {

  state = {
    data: [],
  }

  componentDidMount = async () => {
    try {
      let response = await axios.get('/log/datasets');
      response = response.data;
      if (response.status) {
        this.setState({data: response.data});
      } else {
        messageError(response.msg);
      }
      
    } catch (err) {
      messageError(err.message);
    }
  }

  render() {
    const {data} = this.state;
    return (
      <div className="home">
        <Table dataSource={data}>
          <Table.Column title="Dataset Name" dataIndex="datasetName"/>
          <Table.Column title="Number of train samples" dataIndex="trainNumber" />
          <Table.Column title="Number of validation samples" dataIndex="validationNumber"/>
          <Table.Column title="Number of test samples" dataIndex="testNumber"/>
        </Table>
      </div>
    );
  }
  
}
