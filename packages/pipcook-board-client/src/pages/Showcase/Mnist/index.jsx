import React, { Component } from 'react';
import CanvasDraw from 'react-canvas-draw';
import axios from 'axios';
import { Button } from '@alifd/next';

import { messageSuccess, messageError } from '../../../utils/message';
import './index.scss'

export default class Mnist extends Component {

  state = {
    image: ''
  }

  onChange = (value) => {
    this.setState({
      image: value.canvas.drawing.toDataURL()
    });
  }

  predict = async () => {
    try {
      let response = await axios.post('/showcase/mnist', {
        image: this.state.image
      });
      response = response.data;
      if (response.status) {
        messageSuccess(`I guess the digit you draw is ${response.result}`)
      } else {
        messageError(response.msg);
      }
      
    } catch (err) {
      messageError(err.message);
    }
   
  }

  render() {
    return (
      <div className="mnist">
        <div className="toast">you can draw a digit here and predict it</div>
        <CanvasDraw 
          onChange={this.onChange}
          canvasWidth={600}
          canvasHeight={600}
          brushColor="#000"
          brushRadius={25}
        />
        <Button type="primary" className="predict-button" size="large" onClick={this.predict}>Predict</Button>
      </div>
    );
  }
  
}


