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
    const {itemName, plugins, choices, currentSelect} = this.props;
    const currentPlugin = plugins[itemName];
    const currentChoices = choices[itemName];
    if (currentPlugin) {
      if (!currentChoices.includes(currentPlugin.name)) {
        currentChoices.push(currentPlugin.name);
      }
    }
    return (
      <div className="choose-item" style={{
        backgroundColor: currentSelect ? '#bdbdbd' : '#f2f2f2'
      }}>
        <div className="item-name">{itemName}</div>
        <div className="choose-plugin">
          <Select value={currentPlugin && currentPlugin.name || ''} autoWidth={false} onChange={this.onChange} >
            {
              currentChoices.map(choice => <Option value={choice} key={choice} >{choice}</Option>)
            }
          </Select>
        </div>
      </div>
    );
  }
}
