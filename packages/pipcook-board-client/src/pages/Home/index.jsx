import React, { Component } from 'react';
import { Button } from '@alifd/next';
import axios from 'axios';

import PluginBoard from './components/PluginBoard';
import {messageError} from '../../utils/message';
import './index.scss';

export default class Home extends Component {

  state = {
    init: false,
    initOutput: '',
    loading: false,
    plugins: [],
  }

  async componentDidMount() {
    try {
      let response = await axios.get('/project/info');
      response = response.data;
      this.setState({
        plugins: response.data,
        init: response.init,
      });
    } catch (err) {
      console.error(err);
    }
  }

  initialize = async () => {
    try {
      this.setState({loading: true});
      let response = await axios.post('/project/init');
      response = response.data;
      if (response.status) {
        setInterval(async () => {
          try {
            let res = await axios.get('/project/pipeline-execution-result');
            res = res.data;
            if (res.status) {
              this.setState({
                initOutput: res.stdout,
              });
              if (res.stdout.includes('__pipcook_exit_code:')) {
                this.setState({loading: false});
              }
            }
          } catch (err) {
            console.error(err);
          }
        }, 2000);
      } else {
        this.setState({loading: false});
        messageError(response.msg);
      }
    } catch (err) {
      this.setState({loading: false});
      messageError(err.message);
    }
  }

  render() {
    const {init, initOutput, plugins, loading} = this.state;
    return (
      <div className="home">
        {
          !init ? (<div className="init-wrapper">
            <div className="init-message">
              Current working directory is not a pipcook project. You can initialize a project by button below
            </div>
            <div className="init-button-wrap">
              <Button type="primary" 
                className="init-button" 
                onClick={this.initialize} 
                loading={loading} 
                disabled={loading}
              >
                Initialize Project
              </Button>
            </div>
            <div className="init-output" style={initOutput ? {border: '1px solid rgba(0,0,0,.2)'} : {}}>{initOutput}</div>
          </div>) : (
            <PluginBoard plugins={plugins} />
          )
        }
      </div>
    );  
}
