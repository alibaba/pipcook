import React, { Component } from 'react';
import { Table, Pagination, Button } from '@alifd/next';

import {messageError} from '@/utils/message';
import { PIPELINE_MAP, JOB_MAP, PIPELINE_STATUS } from '@/utils/config';
import { get } from '@/utils/request';

import './index.scss';

const PAGE_SIZE = 10; // number of records in one page

export default class Pipeline extends Component {

  state = {
    models: [],
    fields: PIPELINE_MAP, // pipeline or job,
    currentPage: 1,
    totalCount: 0,
  }

  changePage = async (value) => {
    await this.fetchData(value);
  }

  fetchData = async (currentPage) => {
    // check if show job or pipeline from url
    let queryUrl = '/pipeline/list';
    if (location.href.includes('jobs')) {
      this.setState({
        fields: JOB_MAP,
      });
      queryUrl = '/job/list';
    }
    
    try {
      const response = await get(queryUrl, {
        params: {
          offset: (currentPage - 1) * PAGE_SIZE, 
          limit: PAGE_SIZE,
        },
      });
      const result = response.rows.map((item) => {
        return {
          ...item,
          createdAt: new Date(item.createdAt).toLocaleString(),
          endTime: new Date(item.endTime).toLocaleString(),
          status: PIPELINE_STATUS[item.status],
        };
      });
      this.setState({
        models: result,
        totalCount: response.count,
        currentPage
      });
    } catch (err) {
      messageError(err.message);
    }
  }

  componentDidMount = async () => {
    await this.fetchData(1);
  }

  renderDetail = (value, index, record) => {
    return <a href={`/index.html#/pipeline/info?pipelineId=${record.id}`}>
      <Button>Detail</Button>
    </a>;
  }

  render() {
    const { models, fields, currentPage, totalCount } = this.state;
    return (
      <div className="pipeline">
        <Table dataSource={models}>
          {
            fields.map(field => <Table.Column 
              key={field.name}
              title={field.name}
              dataIndex={field.field}
              cell={field.cell}
            />)
          }
        </Table>
        <Pagination 
          current={currentPage} 
          total={totalCount} 
          pageSize={PAGE_SIZE} 
          className="pagination-wrapper" 
          onChange={this.changePage} 
        />
        <div className="pipeline-create-container" onClick={() => location.href = 'index.html#/pipeline/info'}>
          <img
            className="pipeline-create" 
            src="https://img.alicdn.com/tfs/TB1nTmRbmRLWu4jSZKPXXb6BpXa-128-128.png" 
            alt="create pipeline"
          />
        </div>
      </div>
    );
  }
  
}
