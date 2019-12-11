import React, { Component } from 'react';
import ImageUploader from 'react-images-upload';
import './index.scss';
import { Loading } from '@alifd/next';
const axios = require('axios');

export default class ImageClassification extends Component {

  state = {
    predictionResult: null,
    loading: false
  }

  onDrop = async (value) => {
    const toBase64 = file => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
    let base64 = await toBase64(value[value.length - 1]);
    base64 = base64.replace(/data:.*base64,/, '');
    this.setState({
      loading: true
    })
    axios.post('/predict', {
      data: [base64]
    })
    .then((response) => {
      const result = response.data.result;
      this.setState({
        loading: false,
        predictionResult: result
      })
    })
    .catch((error) => {
      console.log(error);
      this.setState({
        loading: false
      })
    });
  };


  render() {
    const {predictionResult, loading} = this.state;
    return (
      <div className="image-classificaiton">
        <Loading tip="Loading..." visible={loading}>
          <ImageUploader
            withIcon={true}
            buttonText='Choose image'
            onChange={this.onDrop}
            imgExtension={['.jpg']}
            label="Choose an image to predict"
            maxFileSize={1000000}
            singleImage={true}
          />
          {
            <div className="result">
              The image you upload is {predictionResult}
            </div>
          }
        </Loading>
      </div>
    );
  }
  
}
