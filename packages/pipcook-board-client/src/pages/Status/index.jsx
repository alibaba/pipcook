import React, { Component } from 'react';
import './index.scss';
import { Loading } from '@alifd/next';

const axios = require('axios');

export default class Status extends Component {

  state = {
    status: 'no job',
    version: null, 
    startTime: null, 
    id: null,
  }

  timer= null;

  componentDidMount() {
    this.fetch();
    this.timer = setInterval(this.fetch, 2000);
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  fetch = () => {
    axios.get('/status')
    .then((response) => {
      const {status, version, startTime, id} = response.data;
      this.setState({
        status, version, startTime, id,
      });
    })
    .catch(() => {
      this.setState({
        status: 'no job',
      });
    });
  }

  render() {
    const {status, version, startTime, id} = this.state;
    return (

      <div className="status">
        {
          status === 'no job' && 
          <div className="no-job">
            Currently there is no job found. Please check Home page to see how to create a Pipcook pipeline and run the job.
          </div>
        }
        {
          status === 'running' &&  
          <div className="tips">
            <Loading tip="" visible={status === 'running'} inline={false} style={{marginBottom: 40}}/>
            Currently a pipeline is running. Below is Infomation: <br />
            PipeLine Id: {id} <br />
            PipeLine Version: {version} <br />
            Start Time: {startTime} <br />
          </div>
        }
        {
          status === 'success' &&
            <div className="tips">
              Currently a pipeline is running. Below is Infomation: <br />
              PipeLine Id: {id} <br />
              PipeLine Version: {version} <br />
              Start Time: {startTime} <br />
              <div>
                local prediction server has been running, API is as follows, only if you specify local deploy plugin, this will work: <br /><br />
                <div className="codes">
                  POST <br /><br />
                  http://127.0.0.1:7778/predict <br /><br />
                  {
                    `
                    {
                      "data": [<array of your data>]
                    }
                    `
                  }<br /><br />
                  application/json
                </div>
                
              </div>
            </div>
        }
        {
          status === 'error' &&
            <div className="tips">
              The pipeline come acrss errors. Please check logs<br />
              PipeLine Id: {id} <br />
              PipeLine Version: {version} <br />
              Start Time: {startTime} <br />
            </div>
        }
        
      </div>
    );
  }
  
}
