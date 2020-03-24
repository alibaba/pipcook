import React, { Component } from 'react';
import axios from 'axios';
import { UnControlled as CodeMirror } from 'react-codemirror2';

import { messageLoading, messageHide } from '../../../utils/message';
import './index.scss';
import'codemirror/lib/codemirror.css';
import 'codemirror/theme/material.css';
import 'codemirror/mode/javascript/javascript';

async function createImage(url) {
  const prom = new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = function () {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.height = this.naturalHeight;
      canvas.width = this.naturalWidth;
      ctx.drawImage(this, 0, 0);
      const dataURL = canvas.toDataURL('image/jpeg', 1.0);
      resolve(dataURL);
    };
    img.src = url;
  });
  const base64 = await prom;
  return base64;
}

export default class AssetsClassification extends Component {
  constructor(props) {
    super(props);
    this.state = {
      imageResult: {},
      imageList: [
        {
          url:
            'https://gw.alicdn.com/tfs/TB1ekuMhQY2gK0jSZFgXXc5OFXa-400-400.jpg',
          width: 100,
          height: 100,
        },
        {
          url:
            'https://gw.alicdn.com/tfs/TB1xQqNhNv1gK0jSZFFXXb0sXXa-256-256.jpg',
          width: 100,
          height: 100,
        },
        {
          url:
            'https://gw.alicdn.com/tfs/TB1lV9OhQT2gK0jSZPcXXcKkpXa-200-200.jpg',
          width: 100,
          height: 100,
        },
        {
          url:
            'https://gw.alicdn.com/tfs/TB1vbWJhFY7gK0jSZKzXXaikpXa-400-400.jpg',
          width: 100,
          height: 100,
        },
        {
          url:
            'https://gw.alicdn.com/tfs/TB1WkOLhNn1gK0jSZKPXXXvUXXa-800-800.jpg',
          width: 100,
          height: 100,
        },
        {
          url:
            'https://gw.alicdn.com/tfs/TB1gUaJhKT2gK0jSZFvXXXnFXXa-732-331.jpg',
          width: 100,
          height: 50,
        },
        {
          url:
            'https://gw.alicdn.com/tfs/TB17yuKhUY1gK0jSZFMXXaWcVXa-800-800.jpg',
          width: 100,
          height: 100,
        },
        {
          url:
            'https://img.alicdn.com/tfs/TB1v6gPcQL0gK0jSZFAXXcA9pXa-64-26.png',
          width: 32,
          height: 13,
        },
      ],
    };
  }

  onPredict = async image => {
    messageLoading('Please give us some time to predict the result ...');
    let response = await axios.post('/showcase/asset-classification', {
      image,
    });
    response = response.data;
    console.log(response);
    this.setState({
      imageResult: response,
    });
    messageHide();
  };

  onClickImg = async item => {
    const base64 = await createImage(item);
    this.onPredict(base64);
  };

  onClick = () => {
    this.inputElement.click();
  };

  onIptChange = async () => {
    const files = this.inputElement.files;
    const prom = new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(files[0]);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
    let base64 = await prom;
    base64 = await createImage(base64);
    this.onPredict(base64);
  };

  render() {
    const { imageResult, imageList } = this.state;
    const imageResultValue =
      (imageResult && JSON.stringify(imageResult, null, 2)) || '';
    return (
      <div className="asset-classification">
        <div className="experienceInner">
          <h3 className="pageTitle">Front-end Assets Classification for Taobao</h3>
          <p className="pageDescription" />
          <div style={{ display: 'flex', flexDirection: 'space-between' }}>
            <div className="content-item">
              <h4 className="label">Origin Image</h4>
              <div className="imageList">
                {imageList.map(item => {
                  return (
                    <div
                      key={item.url}
                      className="imageItem"
                      onClick={() => {
                        this.onClickImg(item.url);
                      }}
                    >
                      <img
                        src={item.url}
                        width={item.width}
                        height={item.height}
                        alt="item"
                      />
                    </div>
                  );
                })}
              </div>
              <div className="upload-wrap">
                <span className="upload-btn" onClick={this.onClick}>
                  <input
                    ref={input => (this.inputElement = input)}
                    onChange={this.onIptChange}
                    type="file"
                    accept="image/png, image/jpg, image/jpeg"
                    multiple=""
                    style={{ display: 'none' }}
                  />
                  <button type="button" className="btn-select-file">
                    Select a Picture
                  </button>
                </span>
              </div>
            </div>
            <div className="content-item">
              <h4 className="label">Result</h4>
              <CodeMirror
                value={imageResultValue}
                options={{
                  mode: 'javascript',
                  theme: 'material',
                  lineNumbers: true,
                  readOnly: true,
                }}
              />
            </div>
          </div>
        </div>
      </div>
      
    );
  }
}
