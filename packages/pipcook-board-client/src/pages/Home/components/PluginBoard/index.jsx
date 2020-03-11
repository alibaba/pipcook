import React, { Component } from 'react';
import {Tree, Step, Button, Select} from '@alifd/next';
import axios from 'axios';
import {messageError} from '../../../../utils/message';

import ParamDialog from '../ParamDialog';
import {choosePipeline} from './choosePipeline';
import './index.scss';

const TreeNode = Tree.Node;
const StepItem = Step.Item;
const Option = Select.Option;


const pluginTypes = [
  'data-collect',
  'data-access',
  'data-process',
  'model-load',
  'model-train',
  'model-evaluate',
  'model-deploy',
];

function generateData(plugins) {
  let types = plugins.map(plugin => plugin.type);
  types = types.filter((type, index) => types.indexOf(type) === index);
  let treeData = types.map((type) => {
    return {
      label: type,
      key: type,
      selectable: false,
      children: plugins.filter(plugin => plugin.type === type).map(plugin => ({
        label: plugin.name,
        key: plugin.name,
      })),
    };
  });
  if (!treeData || treeData.length === 0) {
    return [];
  }
  treeData = treeData.sort((a, b) => {
    if (pluginTypes.indexOf(a.label) > pluginTypes.indexOf(b.label)) {
      return 1;
    } else {
      return -1;
    }
  });
  return treeData;
}


export default class PluginBoard extends Component {

  state = {
    currentStep: -1,
    pluginMap: {},
    inputDialogShow: false,
    inputDialogType: '',
    stdout: '',
    pipelineFinish: false,
    startPipeline: false,
    showLog: false,
  }

  dragPlugin = '';

  dragType = '';

  classList = null;

  timer = null;

  onDrop = (info) => {
    if (info !== this.dragType) {
      messageError('The plugin type you drag to is not correct');
    } else {
      const {pluginMap} = this.state;
      this.setState({
        pluginMap: {
          ...pluginMap,
          [info]: {
            name: this.dragPlugin,
            params: {},
          },
        },
      });
    }
  }  

  onDragOver = (info) => {
    if (this.classList) {
      this.classList.remove('over-item');
    }
    info.preventDefault();
    info.target.classList.add('over-item');
    this.classList = info.target.classList;
  }

  onDragStart = (info) => {
    this.dragPlugin = info.node.props.label;
    this.dragType = info.node.props.type;
  }

  onDragEnd = () => {
    if (this.classList) {
      this.classList.remove('over-item');
    }
  }

  configClick = (type) => {
    this.setState({
      inputDialogShow: true,
      inputDialogType: type,
    });
  }

  setValue = (type, value) => {
    const {pluginMap} = this.state;
    pluginMap[type].params = value;
    this.setState(pluginMap);
  }

  closeDialog = () => {
    this.setState({
      inputDialogShow: false,
    });
  }

  filterStep = (stdout) => {
    let index = -1;
    pluginTypes.forEach((pluginType) => {
      const transform = (type) => {
        const splitName = type.split('-');
        return splitName[0] + splitName[1].charAt(0).toUpperCase()+splitName[1].slice(1);
      };
      const transType = transform(pluginType);
      if (stdout.includes(`Current Execution Component: ${transType}`)) {
        index++;
      }
      if (stdout.includes(`__pipcook_exit_code:`)) {
        this.setState({startPipeline: false, pipelineFinish: true});
      }
    });
    this.setState({
      currentStep: index,
    });
  }

  startPipeline = async () => {
    try {
      this.setState({startPipeline: true, pipelineFinish: false});
      const {pluginMap} = this.state;

      let response = await axios.post('/project/pipeline', {
        pluginMap,
      });
      
      response = response.data;
      if (response.status) {
        this.timer = setInterval(async () =>{
          try {
            let res = await axios.get('/project/pipeline-execution-result');
            res = res.data;
            if (res.status) {
              this.setState({
                stdout: res.stdout,
              });
              this.filterStep(res.stdout);
              if (res.stdout.includes('__pipcook_exit_code:')) {
                this.setState({startPipeline: false, pipelineFinish: true});
              }
            }
          } catch (err) {
            console.error(err);
          }
        }, 1000);
      } else {
        this.setState({startPipeline: false, pipelineFinish: true});
        messageError(response.msg);
      }
    } catch (err) {
      this.setState({startPipeline: false, pipelineFinish: true});
      messageError(err.message);
    }
  }

  showLog = () => {
    const {showLog} = this.state;
    this.setState({
      showLog: !showLog,
    });
  }

  quickChoose = (data) => {
    choosePipeline(data, this);
  }

  deletePlugin = (type) => {
    const {pluginMap} = this.state;
    delete pluginMap[type];
    this.setState({pluginMap});
  }

  render() {
    const {plugins} = this.props;
    const {currentStep, pluginMap, inputDialogShow, inputDialogType, startPipeline, showLog, stdout, pipelineFinish} = this.state;
    const treeData = generateData(plugins);
    return (
      <div className="plugin-show">
        <ParamDialog 
          visible={inputDialogShow} 
          type={inputDialogType} 
          object={pluginMap[inputDialogType] && pluginMap[inputDialogType].params} 
          setValue={this.setValue}
          onClose={this.closeDialog}
        />
        <div className="plugin-board">
          <Tree selectable={false} isLabelBlock draggable onDragStart={this.onDragStart} onDragEnd={this.onDragEnd} >
            {
              treeData.map(tree => {
                return (
                  <TreeNode key={tree.key} label={tree.label} draggable={false} >
                    {
                      tree.children.map(node => {
                        return <TreeNode key={node.key} label={node.label} type={tree.key} />;
                      })
                    }
                  </TreeNode>
                );
              })
            }
          </Tree>
        </div>
        <div className="plugin-choose">
          <div className="plugin-title">You could drag the plugin you want into responding step</div>
          <div className="quick-choose">
            <Select style={{width: '300px'}} onChange={this.quickChoose} placeholder="quickly choose a pipeline here" hasClear>
                <Option value="image-classification">Image Classification</Option>
                <Option value="object-detection">Object Detection</Option>
                <Option value="text-classification">Text Classification</Option>
            </Select>
          </div>
          <Step current={currentStep} shape={this.state.circle} animation>
            {
              pluginTypes.map(type => (
                <StepItem
                  title={type} 
                  key={type} 
                  onDragOver={(info) => this.onDragOver(info, type)} 
                  onDrop={() => this.onDrop(type)} 
                  content={
                    pluginMap[type] ? (
                      <div>
                        <Button className="config-button" size="small" type="primary" onClick={() => this.configClick(type)}>Config Param</Button>
                        <span>{pluginMap[type].name}</span> <br />
                        <img alt="close" src="https://img.alicdn.com/tfs/TB1o9vIxGL7gK0jSZFBXXXZZpXa-32-32.png" onClick={() => this.deletePlugin(type)} className="plugin-delete"/>
                      </div>
                    ) : 'not set'
                  }
                />
              ))
            }
          </Step>
          <div className="pipeline-wrap">
            <Button type="primary" 
              onClick={this.startPipeline} 
              loading={startPipeline} 
              disabled={startPipeline}
              className="pipeline-button"
            >
              {startPipeline ? 'Training ...' : 'Start Pipeline'}
            </Button>
            {
              (startPipeline || pipelineFinish) && <Button type="primary" onClick={this.showLog}>Show Log</Button>
            }
          </div>
          {
            (startPipeline || pipelineFinish) && showLog && <div className="log-wrap">
              {stdout}
            </div>
          }
          
        </div>
      </div>
    );
  }
}
