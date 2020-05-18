import React, { Component } from 'react';
import axios from 'axios';
import { Table } from '@alifd/next';

import {messageError} from '../../utils/message';

const TABLE_TITLE = {
  PIPELINE_ID: 'Pipeline Id',
  DATA_COLLECT: 'Data Collect',
  DATA_ACCESS: 'Data Access',
  DATA_PROCESS: 'Data Process',
  MODEL_DEFINE: 'Model Define',
  MODEL_LOAD: 'Model Load',
  MODEL_TRAIN: 'Model Train',
  MODEL_EVALUATE: 'Model Evaluate',
  CREATED_AT: 'Created At',
};

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
          <Table.Column title={TABLE_TITLE.PIPELINE_ID} dataIndex="id"/>
          <Table.Column title={TABLE_TITLE.DATA_COLLECT} dataIndex="dataCollect"/>
          <Table.Column title={TABLE_TITLE.DATA_ACCESS} dataIndex="dataAccess"/>
          <Table.Column title={TABLE_TITLE.DATA_PROCESS} dataIndex="dataProcess"/>
          <Table.Column title={TABLE_TITLE.MODEL_DEFINE} dataIndex="modelDefine"/>
          <Table.Column title={TABLE_TITLE.MODEL_LOAD} dataIndex="modelLoad"/>
          <Table.Column title={TABLE_TITLE.MODEL_TRAIN} dataIndex="modelTrain"/>
          <Table.Column title={TABLE_TITLE.MODEL_EVALUATE} dataIndex="modelEvaluate"/>
          <Table.Column title={TABLE_TITLE.CREATED_AT} dataIndex="createdAt"/>
        </Table>
      </div>
    );
  }
  
}
