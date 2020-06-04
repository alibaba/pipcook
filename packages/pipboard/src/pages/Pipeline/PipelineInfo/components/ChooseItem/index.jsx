import React, { Component } from 'react';
import { Select } from '@alifd/next';

import './index.scss';

const Option = Select.Option;

export default class ChooseItem extends Component {
  onChange = (e) => {
    const {itemName, changeSelectPlugin} = this.props;
    changeSelectPlugin(itemName, e);
  }

  render () {
    const {itemName, plugins, choices, currentSelect, jobId} = this.props;
    const currentPlugin = plugins[itemName];
    const currentChoices = choices[itemName];
    if (currentPlugin) {
      if (!currentChoices.includes(currentPlugin.package)) {
        currentChoices.push(currentPlugin.package);
      }
    }
    return (
      <div className="choose-item" style={{
        backgroundColor: currentSelect ? '#bdbdbd' : '#f2f2f2'
      }}>
        <div className="item-name">{itemName}</div>
        <div className="choose-plugin">
          <Select 
            value={currentPlugin && currentPlugin.package || ''} 
            autoWidth={false} 
            onChange={this.onChange}
            disabled={jobId}
            hasClear
          >
            {
              currentChoices.map(choice => <Option value={choice} key={choice} >{choice}</Option>)
            }
          </Select>
        </div>
      </div>
    );
  }
}
