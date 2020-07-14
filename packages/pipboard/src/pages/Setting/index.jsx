import React, { Component } from 'react';
import { Input, Tab, Tag, Form, Button } from '@alifd/next';
import { get } from '@/utils/request';
import './index.scss';

class OverviewSetting extends Component {

  state = {
    versions: { daemon: null, pipboard: null }
  }

  async componentWillMount() {
    const versions = await get('/versions');
    this.setState({ versions });
  }

  render() {
    const formItemLayout = {
      labelCol: {
        fixedSpan: 10
      },
      wrapperCol: {
        span: 14
      }
    };
    return <Form {...formItemLayout}>
      <Form.Item label="Daemon" help="the pipcook daemon.">
        <Tag size="small">v{this.state.versions.daemon}</Tag>
      </Form.Item>
      <Form.Item label="Pipboard" help="the pipboard version.">
        <Tag size="small">v{this.state.versions.pipboard}</Tag>
      </Form.Item>
    </Form>;
  }
}

class DaemonSetting extends Component {
  state = {
    config: {
      npmRegistryPrefix: '',
      pythonIndexMirror: '',
      pythonCondaMirror: ''
    }
  }

  async componentWillMount() {
    const config = await get('/config');
    this.setState({ config });
  }

  createConfigSetter = (name) => {
    return (v) => {
      const newConfig = Object.assign({}, this.state.config);
      newConfig[name] = v;
      this.setState({ config: newConfig });
    }
  }

  render() {
    const formItemLayout = {
      labelCol: {
        fixedSpan: 10
      },
      wrapperCol: {
        span: 14
      }
    };
    return <Form {...formItemLayout}>
      <Form.Item label="NPM Registry" help="The NPM registry prefix to install all plugin.">
        <Input value={this.state.config.npmRegistryPrefix} onChange={this.createConfigSetter('npmRegistryPrefix')}></Input>
      </Form.Item>
      <Form.Item label="Python Index" help="The index page to install Python packages.">
        <Input value={this.state.config.pythonIndexMirror} onChange={this.createConfigSetter('pythonIndexMirror')}></Input>
      </Form.Item>
      <Form.Item label="Python Interrupter Mirror" help="The mirror address to install Python interrupter.">
        <Input value={this.state.config.pythonCondaMirror} onChange={this.createConfigSetter('pythonCondaMirror')}></Input>
      </Form.Item>
    </Form>;
  }
}

class PluginSetting extends Component {
  state = {
    // TODO
  }

  render() {
    const formItemLayout = {
      labelCol: {
        fixedSpan: 10
      },
      wrapperCol: {
        span: 14
      }
    };
    return <Form {...formItemLayout}>
      <Form.Item label="Installed plugins">
        <p>10 plugins are installed</p>
      </Form.Item>
      <Form.Item label="Operations" help="This removes all installed plugins.">
        <Button warning>Remove All Plugins</Button>
      </Form.Item>
    </Form>;
  }
}

export default class Setting extends Component {

  render() {
    return (
      <div className="setting">
        <h1>Settings</h1>
        <Tab className="setting-container" tabPosition="left" shape="wrapped">
          <Tab.Item title="Overview">
            <OverviewSetting />
          </Tab.Item>
          <Tab.Item title="Daemon">
            <DaemonSetting />
          </Tab.Item>
          <Tab.Item title="Plugins">
            <PluginSetting />
          </Tab.Item>
        </Tab>
      </div>
    );
  }
  
}
