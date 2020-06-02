import React, { Component } from 'react';
import axios from 'axios';
import { Table } from '@alifd/next';
import { observer, inject } from "mobx-react";
import queryString from 'query-string';

import {messageError} from '../../utils/message';
import { PIPELINE_MAP, JOB_MAP } from '../../utils/config';

@inject("pipelineData")
@observer
export default class Pipeline extends Component {

  state = {
    models: [],
    fields: PIPELINE_MAP // pipeline or job
  }

  componentDidMount = async () => {
    let params = queryString.parse(location.hash.split('?')[1]);
    let queryUrl = '/log/pipelines';
    if (params.type === 'job') {
      this.setState({
        fields: JOB_MAP
      });
      queryUrl = '/log/logs';
    }
    
    try {
      let response = await axios.get(queryUrl);
      response = response.data;
      if (response.status) {
        const result = response.data.rows.map((item) => {
          return {
           ...item,
           createdAt: new Date(item.createdAt).toLocaleString(), 
          };
        });
        this.setState({ models: result });
      } else {
        messageError(response.msg);
      }
    } catch (err) {
      messageError(err.message);
    }
  }

  render() {
    const { models, fields } = this.state;
    console.log(fields);
    return (
      <div className="pipeline">
        <Table dataSource={models}>
          {
            fields.map(field => <Table.Column key={field.name} title={field.name} dataIndex={field.field} />)
          }
        </Table>
      </div>
    );
  }
  
}
