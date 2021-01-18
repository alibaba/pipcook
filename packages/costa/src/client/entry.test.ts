
// import { PluginProtocol, PluginOperator } from '../protocol';
// import './entry';

// const emit = process.emit.bind(process) as any;
// process.send = () => {
//   throw new TypeError('injection is required.');
// };

// describe('test entry', () => {
//   it('should test emit common', () => {
//     spyOn(process, 'send');

//     const id = 'foobar';
//     emit('message', PluginProtocol.stringify(PluginOperator.START, {
//       event: 'handshake',
//       params: [ id ]
//     }));

//     const firstCall = (process.send as any).calls.first();
//     expect(firstCall.args[0]).toEqual(
//       PluginProtocol.stringify(PluginOperator.START, {
//         event: 'pong',
//         params: [ id ]
//       })
//     );
//   });

//   it('should test emit with failed result', () => {
//     spyOn(process, 'send').and.returnValue(false);
//     spyOn(console, 'error');

//     const id = 'foobar2';
//     emit('message', PluginProtocol.stringify(PluginOperator.START, {
//       event: 'handshake',
//       params: [ id ]
//     }));

//     const firstCall = (console.error as any).calls.first();
//     expect(firstCall.args[0]).toEqual('failed to send a message to parent process.');
//   });
// });
