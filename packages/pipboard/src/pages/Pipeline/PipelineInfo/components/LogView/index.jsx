import React, { Component } from 'react';
import { Dialog, Tab } from '@alifd/next';

import './index.scss';

export default class LogView extends Component {

  render () {
    const { visible, setVisible, stdout, stderr } = this.props;
    return (
      <Dialog
        title="Log View"
        visible={visible}
        onOk={setVisible}
        onCancel={setVisible}
        onClose={setVisible}
      >
        <div className="dialog-wrap" style={{
          height: '500px', 
          width: '800px', 
          whiteSpace: 'pre-line',
          fontSize: '16px',
        }}>
          <Tab shape="wrapped">
            <Tab.Item title="Log"><div style={{height: '500px', overflow: 'scroll'}}>{stdout}</div></Tab.Item>
            <Tab.Item title="Error"><div style={{height: '500px', overflow: 'scroll'}}>{stderr}</div></Tab.Item>
          </Tab>
        </div>
      </Dialog>
    )
  }
}
