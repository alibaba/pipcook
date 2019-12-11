import React, { Component } from 'react';
const axios = require('axios');
import IceNotification from '@icedesign/notification';
import { Table } from '@alifd/next';

export default class Dataset extends Component {

  state = {
    data: []
  }
  componentDidMount = async () => {
    axios.get('/datasets')
      .then((response) => {
        const data =response.data.data;
        this.setState({ data });
      })
      .catch((err) => {
        IceNotification.error({
          message: 'Error',
          description: JSON.stringify(err)
        })
      })
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
