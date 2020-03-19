import React from 'react';
import './index.scss';

export default function Home () {
    return (
      <div className="home">
        {/* <div dangerouslySetInnerHTML={{__html:document}} /> */}
        <iframe title="doc" src="https://alibaba.github.io/pipcook/#/" style={{minWidth: '100%', minHeight: '100vh'}}/>
      </div>
    );  
}
