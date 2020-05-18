import React, { Component } from 'react';
import './index.scss';
import { Input, Button } from '@alifd/next';

const axios = require('axios');

export default class ImageClassification extends Component {

  state = {
    predictionResult: null,
    text: '',
  }

  onDrop = async () => {
    axios.post('/predict', {
      data: [this.state.text],
    })
    .then((response) => {
      const result = response.data.result;
      this.setState({
        predictionResult: result,
      });
    })
    .catch((error) => {
      console.log(error);
    });
  };

  onChange = (value) => {
    this.setState({text: value});
  }


  render() {
    const {predictionResult, text} = this.state;
    return (
      <div className="text-classificaiton">
        <Input style={{marginBottom: 20}} size="medium" placeholder="input your text to classify" value={text} onChange={this.onChange} />
        <Button style={{marginBottom: 40}} onClick={this.onDrop}>Predict</Button>
        <div className="result">
          The Text you input is {predictionResult}
        </div>
      </div>
    );
  }
  
}
