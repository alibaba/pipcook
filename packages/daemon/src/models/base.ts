import { Entity, model, property } from '@loopback/repository';
import { generateId } from '@pipcook/pipcook-core';

@model()
export class Base extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: false,
    required: true,
  })
  id: string;

  constructor(data?: Partial<Base>) {
    super(data);
    if (typeof this.id !== 'string') {
      this.id = generateId();
    }
  }
}
