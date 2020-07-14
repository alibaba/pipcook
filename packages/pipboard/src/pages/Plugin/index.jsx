import React, { Component } from 'react';
import { Box, Button, Dialog, List, Icon, Input, Select, Tag, Divider } from '@alifd/next';
import { PLUGINS } from '@pipcook/pipcook-core/constants/plugins';
import { DateTime } from 'luxon';
import { get } from '@/utils/request';
import './index.scss';

export default class PluginList extends Component {

  localPlugins = []

  state = {
    loading: true,
    plugins: [],
    filter: {
      category: undefined,
      datatype: undefined,
    },
    searchKey: null,
    pluginDialogVisible: false,
    pluginDialogTitle: '',
    pluginDialogContent: null,
  }

  async componentWillMount() {
    await this.fetch();
  }

  fetch = async () => {
    this.setState({ loading: true });
    this.localPlugins = await get('/plugin/list');
    this.setState({
      plugins: Object.assign([], this.localPlugins),
      loading: false,
    });
  }

  createFilterHandler = (type) => {
    return (val) => {
      this.setState(({ filter }) => {
        const newFilter = Object.assign({}, filter);
        newFilter[type] = val;
        // create new plugins.
        const newPlugins = this.localPlugins.filter((plugin) => {
          if (newFilter.category && newFilter.category !== plugin.category) {
            return false;
          }
          if (newFilter.datatype && newFilter.datatype !== plugin.datatype) {
            return false;
          }
          return true;
        });
        return { filter: newFilter, plugins: newPlugins };
      });
    };
  }

  createFilterSetter = (type, value) => {
    const handler = this.createFilterHandler(type);
    return () => handler(value);
  }

  onSearch = async () => {
    await this.openPluginDialog(this.state.searchKey);
  }

  openPluginDialog = async (name) => {
    this.setState({ pluginDialogVisible: true });
    const plugin = await get('/plugin/metadata', {
      params: { name },
    });
    const onClickSource = () => {
      if (plugin?.pipcook.source.from === 'npm') {
        window.open(`https://npmjs.com/package/${  plugin.name}`);
      } else {
        messageError(`unsupported source${  plugin?.pipcook.source.from}`);
      }
    };
    console.log(plugin);
    const content = (
      <Box className="plugin-dialog-box">
        <Tag.Group>
          <Tag type="normal" size="small" color="blue">v{plugin?.version}</Tag>
          <Tag type="normal" size="small">{plugin?.pipcook.datatype}</Tag>
          <Tag type="normal" size="small">{plugin?.pipcook.category}</Tag>
          <Tag type="normal" size="small" onClick={onClickSource}>source: {plugin?.pipcook.source.from}</Tag>
        </Tag.Group>
        <p>{plugin.description}</p>
        <Divider />
        <Box direction="row" flex={0.5} spacing={10} justify="flex-end">
          <Button><Icon type="refresh" />Install</Button>
          <Button warning><Icon type="ashbin" />Uninstall</Button>
        </Box>
      </Box>
    );
    this.setState({
      pluginDialogTitle: plugin.name,
      pluginDialogContent: content,
    });
  }

  closePluginDialog = () => {
    this.setState({
      pluginDialogVisible: false,
      pluginDialogContent: null,
    });
  }

  renderPluginList() {
    const pluginLength = this.state.plugins.length;
    const headerNode = <Box className="plugin-list-header" direction="row" spacing={10}>
      <Select placeholder="select plugin category"
        value={this.state.filter.category}
        hasClear
        onChange={this.createFilterHandler('category')}>
        {PLUGINS.map((val, index) => <Select.Option key={index} value={val}>category: {val}</Select.Option>)}
      </Select>
      <Select placeholder="select data type"
        value={this.state.filter.datatype}
        hasClear
        onChange={this.createFilterHandler('datatype')}>
        <Select.Option value="image">data: image</Select.Option>
        <Select.Option value="text">data: text</Select.Option>
      </Select>
      {this.state.loading ?
        <Icon type="loading" /> : <span>{pluginLength} plugins are displayed.</span>}
    </Box>;
    return (
      <List className="plugin-list-comp" header={headerNode}>
        {this.state.plugins.map((plugin, index) => {
          const extra = `installed at ${DateTime.fromISO(plugin.updatedAt).toRelative()}`;
          const title = <h3 className="plugin-item-title" onClick={() => this.openPluginDialog(plugin.name)}>{plugin.name}</h3>;

          // TODO
          const upgradePlugin = async () => {};
          const uninstallPlugin = async () => {};

          return <List.Item extra={extra} title={title} key={index}>
            <div className="plugin-item-container">
              <Tag.Group>
                <Tag type="normal" size="small" color="blue">v{plugin.version}</Tag>
                <Tag type="normal" size="small"
                  onClick={this.createFilterSetter('datatype', plugin.datatype)}>
                  {plugin.datatype}
                </Tag>
                <Tag type="normal" size="small"
                  onClick={this.createFilterSetter('category', plugin.category)}>
                  category: {plugin.category}
                </Tag>
              </Tag.Group>
              <Box className="plugin-item-actions" spacing={10} direction="row">
                <Button className="plugin-item-button" text onClick={upgradePlugin}><Icon type="refresh" />Upgrade</Button>
                <Button className="plugin-item-button" text onClick={uninstallPlugin}><Icon type="ashbin" />Uninstall</Button>
              </Box>
            </div>
          </List.Item>;
        })}
      </List>
    );
  }

  render() {
    const searchIcon = <Icon type="add" size="medium" style={{margin: 8}}/>;
    return (
      <div className="plugin-list">
        <Box align="center">
          <Input className="search-input"
            size="large"
            innerAfter={searchIcon}
            onChange={(v) => this.setState({ searchKey: v })}
            onPressEnter={this.onSearch}
            placeholder="Input a plugin package(npm) name or git address to install" />
        </Box>
        <Box align="center">
          {this.renderPluginList()}
        </Box>
        <Dialog
          className="plugin-dialog"
          footer={false}
          height={200}
          title={this.state.pluginDialogTitle}
          visible={this.state.pluginDialogVisible}
          onClose={this.closePluginDialog}>
          {this.state.pluginDialogContent}
        </Dialog>
      </div>
    );
  }
  
}
