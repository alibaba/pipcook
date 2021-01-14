import test from 'ava';
import { PipcookDataSource } from '../../../datasources';
import { testConstructor } from '../../__helpers__';

test('should get a new PluginRepository object', testConstructor(PipcookDataSource));
