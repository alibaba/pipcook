import React from 'react';
import Card from '@/components/Card';

import './index.scss';

const items = [{
  title: 'Tutorials',
  cover: 'https://img.alicdn.com/tfs/TB1K3ZQGHj1gK0jSZFuXXcrHpXa-450-240.png',
  description: 'Learn how to get started with Pipcook in tutorials',
  url: '/index.html#/tutorial',
}, {
  title: 'Pipeline',
  cover: 'https://img.alicdn.com/tfs/TB14AUOGNv1gK0jSZFFXXb0sXXa-715-400.jpg',
  description: 'Integratiing the machine learning Pipeline into your workflow',
  url: '/index.html#/tutorial',
}];


export default function() {
  return (
    <div className="home">
        <Card items = {items} />
    </div>
  );  
}


