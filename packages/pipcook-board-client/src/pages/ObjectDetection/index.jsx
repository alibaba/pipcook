import React, { Component } from 'react';
import ImageUploader from 'react-images-upload';
import './index.scss';
import { Loading } from '@alifd/next';
const axios = require('axios');

export default class ObjectDetection extends Component {

  state = {
    predictionResult: null,
    loading: false,
    image: null,
    lines: []
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
      const image = new Image(); 

      image.onload = () => {
        const lines = [];
        result.forEach((item) => {
          const {size, object} = item;
          const {name, bndbox} = object;
          const xmin = bndbox.xmin / (size[0] / image.width);
          const xmax = bndbox.xmax / (size[0] / image.width);
          const ymin = bndbox.ymin / (size[1] / image.height);
          const ymax = bndbox.ymax / (size[1] / image.height);
          lines.push([xmin, ymin, xmax, ymax]);
        });
        this.setState({ lines });
      };

      image.src = base64; 
      
      this.setState({
        loading: false,
        predictionResult: result,
        image: base64
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
    const {predictionResult, loading, image, lines} = this.state;
    return (
      <div className="object-detection">
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
          {
            image && <div className="image-wrapper">
              <img src={`data:image/jpeg;base64,${image}`} />
              {
                lines.map((line, index) => {
                  <div className="lines" style={{x: line[0], y: line[1], width: line[2] - line[0], height: line[3] - line[1]}} />
                })
              }
            </div>
          }
          
        </Loading>
      </div>
    );
  }
  
}
