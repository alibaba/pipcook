import test from 'ava';
import { DaemonApplication } from '../../application';
import { testConstructor } from '../__helpers__';

test('should get a new DaemonApplication object', testConstructor(DaemonApplication));
