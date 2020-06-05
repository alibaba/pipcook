import React from 'react';
import Card from '@/components/Card';

import './index.scss';

const items = [{
  title: 'MNIST Handwritten Digit Recognition',
  cover: 'https://img.alicdn.com/tfs/TB1GtzSy.T1gK0jSZFrXXcNCXXa-480-360.jpg',
  description: 'We have trained a neural network to recognize handwritten digits. You can have a try to give your own handwritten digit',
  url: '/index.html#/tutorial/mnist',
}, {
  title: 'Image Classification for Front-end Assets',
  cover: 'https://gw.alicdn.com/tfs/TB1yujRgUY1gK0jSZFMXXaWcVXa-524-410.png',
  description: 'Use CNN trained by Pipcook to try understand the meaning of image assets used in Taobao App',
  url: '/index.html#/tutorial/assets-classification',
}];


export default function() {
  return (
    <div className="tutorial">
      <Card items = {items} />
    </div>
  );
}


