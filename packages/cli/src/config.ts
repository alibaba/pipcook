import path from 'path';

export const dependencies: string[] = [
  '@pipcook/boa',
  '@pipcook/pipcook-core'
];

export const isLocal = process.env.NODE_ENV === 'local';
export const daemonPackage = isLocal ? path.join(__dirname, '../../daemon') : '@pipcook/daemon';
export const boardPackage = isLocal ? path.join(__dirname, '../../pipboard') : '@pipcook/pipboard';

export const pipcookLogName = 'pipcook-output';
export const optionalNpmClients: string[] = [ 'npm', 'cnpm' ];
