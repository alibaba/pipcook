import React, { Component } from 'react';
import CanvasDraw from 'react-canvas-draw';
import { Button } from '@alifd/next';
import * as Jimp from 'jimp';

import { messageSuccess } from '../../../utils/message';
import './index.scss';

export default class Mnist extends Component {

  state = {
    canvasImageBlob: null,
    image: '',
  }

  canvasObject = null

  async componentWillMount() {
    this.model = await tf.loadLayersModel('/playground/model/mnist/model.json');
  }

  onChange = async (value) => {
    value.canvas.drawing.toBlob(async (blob) => {
      this.setState({ canvasImageBlob: blob }, () => this.predict());
    });
  }

  predict = async () => {
    const blob = this.state.canvasImageBlob;
    let img = await Jimp.read(await blob.arrayBuffer());
    img = img.resize(28, 28).invert().greyscale();

    const str = await img.getBase64Async('image/jpeg');
    this.setState({ image: str });

    const arr = [];
    for (let i = 0; i < 28; i++) {
      for (let j = 0; j < 28; j++) {
        arr.push(Jimp.intToRGBA(img.getPixelColor(j, i)).r / 255);
      }
    }
    const res = this.model.predict(tf.tensor4d(arr, [1, 28, 28, 1]));
    let num = -1;
    let prob = -1;
    const prediction = res.dataSync();
    Object.keys(prediction).forEach((key) => {
      if (prediction[key] > prob) {
        num = parseInt(key, 10);
        prob = prediction[key];
      }
    });
    messageSuccess(`I guess the digit you draw is ${num}, ${Math.floor(prob * 100, 3)}%`);
  }

  clear = () => {
    this.canvasObject.clear();
  }

  render() {
    return (
      <div className="mnist">
        <div className="toast">you can draw a digit here and predict it</div>
        <Button size="small" className="clear-button" onClick={this.clear}>Clear Canvas</Button>
        <div className="contents">
          <CanvasDraw 
            ref={ref => this.canvasObject = ref}
            onChange={this.onChange}
            canvasWidth={600}
            canvasHeight={600}
            brushColor="#000"
            brushRadius={25}
          />
          <img alt="mnist" height="128" width="128" src={this.state.image} className="input-image" />
        </div>
      </div>
    );
  }
  
}


