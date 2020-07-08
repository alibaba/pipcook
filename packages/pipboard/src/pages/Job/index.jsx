import React, { Component } from 'react';
import { Table, Pagination, Icon } from '@alifd/next';

import { messageError } from '@/utils/message';
import { JOB_MAP, PIPELINE_STATUS } from '@/utils/config';
import { get } from '@/utils/request';
import './index.scss';

const PAGE_SIZE = 30; // number of records in one page

export default class JobPage extends Component {

  state = {
    models: [],
    fields: JOB_MAP, // pipeline or job,
    currentPage: 1,
    totalCount: 0,
  }

  changePage = async (value) => {
    await this.fetchData(value);
  }

  fetchData = async (currentPage) => {
    // check if show job or pipeline from url
    try {
      const response = await get('/job/list', {
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
        currentPage,
      });
    } catch (err) {
      messageError(err.message);
    }
  }

  componentDidMount = async () => {
    await this.fetchData(1);
  }

  render() {
    const { models, fields, currentPage, totalCount } = this.state;
    return (
      <div className="job">
        <Table dataSource={models}
          hasBorder={false}
          stickyHeader
          offsetTop={45}>
          {
            fields.map(field => <Table.Column 
              key={field.name}
              title={field.name}
              dataIndex={field.field}
              cell={field.cell}
              sortable={field.sortable || false}
              width={field.width}
              align="center"
            />)
          }
        </Table>
        <Pagination 
          current={currentPage} 
          total={totalCount} 
          pageSize={PAGE_SIZE} 
          type="simple"
          className="pagination-wrapper" 
          onChange={this.changePage}
        />
        <div className="job-create-container" onClick={() => location.href = 'index.html#/job/info'}>
          <Icon className="job-create" type="add" size="large" />
        </div>
      </div>
    );
  }
  
}
