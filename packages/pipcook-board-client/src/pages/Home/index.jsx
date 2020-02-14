import React, { Component } from 'react';
const document = require('../../assets/document');
import './index.scss';

export default class Home extends Component {
  render() {
    return (
      <div className="home">
        {/* <div dangerouslySetInnerHTML={{__html:document}} /> */}
        <iframe src="https://alibaba.github.io/pipcook/doc/What%20is%20Pipcook%3F-en" style={{minWidth: '100%', minHeight: '100vh'}}/>
      </div>
    );
  }
  
}
