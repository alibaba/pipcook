import React, { Component } from 'react';
import { Button, Box, Card } from '@alifd/next';
import { PIPELINE_TEMPLATES } from '@/utils/config';
import { post } from '@/utils/request';
import './index.scss';

export default class NewPipelineBox extends Component {
  state = {
    selected: null,
  }
  async create() {
    const { template } = PIPELINE_TEMPLATES[this.state.selected];
    const pipelineRes = await post('/pipeline', {
      config: JSON.stringify(template),
      isFile: false,
    });
    location.href = '/index.html#/pipeline/info?pipelineId=' + pipelineRes.id;
  }
  render() {
    return <Box direction="row" spacing={20} wrap={true} style={{ width: 1000 }}>
      {PIPELINE_TEMPLATES.map(({ title, category, description }, index) => {
        const cardClassNames = [ 'new-pipeline-card' ];
        if (index === this.state.selected) {
          cardClassNames.push('new-pipeline-card-selected');
        }
        return <Card free key={index} className={cardClassNames.join(' ')} onClick={() => {
          this.setState({ selected: index });
        }}>
          <Card.Header title={title} subTitle={category} />
          <Card.Content>{description}</Card.Content>
          <Card.Actions>
            <Button type="primary" key="action1" text>Documentation</Button>
            <Button type="primary" key="action2" text>Tutorials</Button>
          </Card.Actions>
        </Card>;
      })}
    </Box>;
  }
}
