import path from 'path';
const { LOCAL } = process.env;

export const dependencies: string[] = [
  '@pipcook/boa',
  '@pipcook/pipcook-core'
];

export const daemonPackage = LOCAL ? path.join(__dirname, '../../daemon') : '@pipcook/daemon';
export const boardPackage = LOCAL ? path.join(__dirname, '../../pipboard') : '@pipcook/pipboard';

export const pipcookLogName = 'pipcook-output';
export const optionalNpmClients: string[] = [ 'npm', 'cnpm' ];
