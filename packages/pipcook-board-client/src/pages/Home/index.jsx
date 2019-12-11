import React, { Component } from 'react';
const document = require('../../assets/document');
import './index.scss';

export default class Home extends Component {
  render() {
    return (
      <div className="home">
        <div dangerouslySetInnerHTML={{__html:document}} />
        {/* <iframe src="https://www.yuque.com/queyue-lsdxp/in8hih/ggg0lu" style={{width: '100%', height: '100vh'}}/> */}
      </div>
    );
  }
  
}
