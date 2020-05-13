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
      let response = await axios.get('/log/pipelines');
      response = response.data;
      if (response.status) {
        const result = response.data.rows.map((item) => {
          return {
           ...item,
           createdAt: new Date(item.createdAt).toLocaleString(), 
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
      <div className="model">
        <Table dataSource={models}>
          <Table.Column title="Pipeline Id" dataIndex="id"/>
          <Table.Column title="Data Collect" dataIndex="dataCollect"/>
          <Table.Column title="Data Access" dataIndex="dataAccess"/>
          <Table.Column title="Data Process" dataIndex="dataProcess"/>
          <Table.Column title="Model Define" dataIndex="modelDefine"/>
          <Table.Column title="Model Load" dataIndex="modelLoad"/>
          <Table.Column title="Model Train" dataIndex="modelTrain"/>
          <Table.Column title="Model Evaluate" dataIndex="modelEvaluate"/>
          <Table.Column title="Created At" dataIndex="createdAt"/>
        </Table>
      </div>
    );
  }
  
}
