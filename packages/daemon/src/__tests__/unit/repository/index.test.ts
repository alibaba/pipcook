import test from 'ava';
import { PluginRepository, JobRepository, PipelineRepository } from '../../../repositories';
import { testConstructor } from '../../__helpers__';
import { juggler } from '@loopback/repository';

export const testdb: juggler.DataSource = new juggler.DataSource({
  name: 'db',
  connector: 'memory'
});

test('should get a new PluginRepository object', testConstructor(PluginRepository, testdb));
test('should get a new JobRepository object', testConstructor(JobRepository, testdb));
test('should get a new PipelineRepository object', testConstructor(PipelineRepository, testdb));
