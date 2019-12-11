import React, { Component } from 'react';
import ImageUploader from 'react-images-upload';
import './index.scss';
import { Loading } from '@alifd/next';
const axios = require('axios');
import { Button } from '@alifd/next';

export default class Status extends Component {

  state = {
    status: 'no job',
    type: 'no job',
    name: null, 
    version: null, 
    startTime: null, 
    id: null,
  }

  timer= null;

  fetch = () => {
    axios.get('/status')
    .then((response) => {
      const {status, type, name, version, startTime, id} = response.data;
      this.setState({
        status, type, name, version, startTime, id
      });
    })
    .catch((error) => {
      this.setState({
        status: 'no job'
      })
    });
  }

  componentDidMount() {
    this.fetch();
    this.timer = setInterval(this.fetch, 2000);
  }


  componentWillUnmount() {
    clearInterval(this.timer);
  }

  render() {
    const {status, type, name, version, startTime, id} = this.state;
    return (

      <div className="status">
        {
          status == 'no job' && 
          <div className="no-job">
            Currently there is no job found. Please check Home page to see how to create a Pipcook pipeline and run the job.
          </div>
        }
        {
          status == 'running' &&  
          <div className="tips">
            <Loading tip="" visible={status == 'running'} inline={false} style={{marginBottom: 40}}/>
            Currently a pipeline is running. Below is Infomation: <br />
            PipeLine Name: {id} <br />
            PipeLine Name: {name} <br />
            PipeLine Version: {version} <br />
            Start Time: {startTime} <br />
          </div>
        }
        {
          status == 'success' &&
            <div className="tips">
              Currently a pipeline is running. Below is Infomation: <br />
              PipeLine Name: {id} <br />
              PipeLine Name: {name} <br />
              PipeLine Version: {version} <br />
              Start Time: {startTime} <br />
              <a href={
                type === 'image classification' ? "#/image-classification" : (
                  type === 'object detection' ? "#/object-detection" : (
                    type === 'text classification' ? "#/text-classification" : '#/'
                  )
                )
              }><Button type="primary">Go to Prediction</Button></a>
            </div>
        }
        {
          status == 'error' &&
            <div className="tips">
              The pipeline come acrss errors. Please check logs<br />
              PipeLine Name: {id} <br />
              PipeLine Name: {name} <br />
              PipeLine Version: {version} <br />
              Start Time: {startTime} <br />
            </div>
        }
        
      </div>
    );
  }
  
}
