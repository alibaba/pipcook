import Queue from 'queue';

export const pluginQueue = new Queue({ autostart: true, concurrency: 1 });
