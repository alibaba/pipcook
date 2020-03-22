import React, { Component } from 'react';
import { Dialog } from '@alifd/next';
import ReactJson from 'react-json-view';


import './index.scss';

export default class ParamDialog extends Component {

  onEdit = (info) => {
    const {setValue, type} = this.props;
    setValue(type, info.updated_src);
  }

  onAdd = (info) => {
    const {setValue, type} = this.props;
    setValue(type, info.updated_src);
  }

  onDelete = (info) => {
    const {setValue, type} = this.props;
    setValue(type, info.updated_src);
  }

  render() {
    const {visible, object, onClose} = this.props;
    return (
      <Dialog
        title="Configure"
        visible={visible}
        height="600px"
        footer={false}
        onClose={onClose}
      >
        <div className="input-dialog">
          <ReactJson 
            src={object} 
            onEdit={this.onEdit}
            onAdd={this.onAdd}
            onDelete={this.onDelete}
          />
        </div>      
      </Dialog>
    );
    
  }
  
}
