/**
 * @file This file contains methods for python-node to communicate between nodejs and python
 */

import * as zmq from 'zeromq';
import {Session} from '../types/python-object';
import {startKernel} from '../communication/connectkernel';

const nodeCleanup = require('node-cleanup');
const kernel = require('./ipker.json')

/**
 * Executor class: responsible for handling sessions and ipython and exeucting python statements.
 */
export default class Executor {
 
  static sessions: Session[] = []; // stores all current sessions in use
  static latestIoPort = 55548; // default start port to use for iopub
  static latestShellPort = 51314 // default start port to use for shell

  /**
   * open a session which is bound to a scope
   */
  static openSession = async (scope: string) => {
    let session: Session = Executor.sessions.find((e: any) => e.id === scope);
    if (!session) {
      session = await Executor.createSession(scope);
      session.socketSubscriber.connect(kernel.transport + "://" + kernel.ip + ":" + session.ioPort);
      session.socketDealer.connect(kernel.transport + "://" + kernel.ip + ":" + session.shellPort);
      session.socketSubscriber.subscribe("stream");
      Executor.handleSubscriberMsg(session.socketSubscriber);
      Executor.handleDealerMsg(session.socketDealer, session);
    }
  }

  static closeSession = async (scope: string) => {
    await Executor.exit(scope);
    Executor.sessions = Executor.sessions.filter((session: any) => session.id !== scope);
  }

  /**
   * exit a session
   */
  static exit = async (scope: string) => {
    const session: Session = Executor.sessions.find((e: any) => e.id === scope);
    await session.kernel.cleanup();
  }

  /**
   * create a new session
   */
  static createSession = async (id: string) => {
    const kernel: any = await startKernel(Executor.latestShellPort, Executor.latestIoPort);
    // register cleanup process. This is executed when nodejs process exit
    nodeCleanup(function () {
      kernel.cleanup()
        .then(() => {
          nodeCleanup.uninstall();
        })
        .catch(() => {
          nodeCleanup.uninstall();
        });
      return false;
    });
    const session: Session = {
      id,
      parent_header: {},
      last_header: {
        msg_id: "init_id", 
        msg_type: "execute_request",
        username: 'pipcook',
        version: "5.0",
        session: "pipcook_session"
      },
      dealerMsg: {},
      socketDealer: new zmq.Dealer,
      socketSubscriber: new zmq.Subscriber,
      timer: null,
      ioPort: Executor.latestIoPort,
      shellPort: Executor.latestShellPort,
      kernel
    }
    Executor.latestIoPort++;
    Executor.latestShellPort++;
    Executor.sessions.push(session);

    return session;
  }


  /**
   * handle subscriber message. This protocol is used to receive stdout and stderr from ipython kernel
   */
  static handleSubscriberMsg = (socketSubscriber: zmq.Subscriber) => {
    socketSubscriber.receive()
    .then((msg: Buffer[]) => {
      msg.forEach((item) => {
        let json = null;
        try {
          json = JSON.parse(item.toString());
        } catch (err) {
          json = {};
        }
        if (json.name === 'stdout') {
          console.log('[PYTHON: ]', json.text);
        } else if (json.name === 'stderr') {
          console.log('[PYTHON: ]', json.text);
        }
      });
      Executor.handleSubscriberMsg(socketSubscriber);
    })
    .catch(() => {
      Executor.handleSubscriberMsg(socketSubscriber)
    });
  }

  /**
   * handle dealer message. This protocol is used to send codes to ipython and receive execution message
   */
  static handleDealerMsg = (socketDealer: zmq.Dealer, session: Session) => {
    socketDealer.receive()
    .then((msg) => {
      const message: any = {};
      msg.forEach((item) => {
        try {
          const json = JSON.parse(item.toString());
          if (json.msg_type === 'execute_request') {
            message.requestId = json.msg_id;
          }
          if (json.msg_type === 'execute_reply') {
            message.responseId = json.msg_id;
          }
          if (json.status && json.execution_count !== undefined) {
            if (json.status === 'ok') {
              message.status = true;
              if (json.user_expressions) {
                for (const key in json.user_expressions) {
                  if (json.user_expressions[key].status === 'ok') {
                    message[key] = json.user_expressions[key].data['text/plain'];
                  }
                  
                }
              }
            } else {
              message.status = false;
              message.traceback = json.traceback;
            }
          }
        } catch (err) {
          // TODO: how to handle with this error?
        }
      });
      session.dealerMsg = message;
      Executor.handleDealerMsg(socketDealer, session);
    })
    .catch((err) => {
      console.error(err);
    });
  }

  /**
   * execute codes.
   * @param scope the scope name
   * @param code codes to be executed
   */
  static execute = (scope: string, code: string, user_expressions?: any) => {
    const session: Session = Executor.sessions.find((e: any) => e.id === scope);
    if (!session) {
      throw new Error('no session Found!');
    }

    const header = session.last_header;
    const parent_header = session.parent_header;
    session.parent_header = header;
    const metadata = {};
    const content = {
      code: code,
      silent: true,
      user_expressions: user_expressions || {}
    };

    session.socketDealer.send(
      ["","<IDS|MSG>","", 
        JSON.stringify(header), 
        JSON.stringify(parent_header), 
        JSON.stringify(metadata), 
        JSON.stringify(content)
      ]
    );
    return new Promise((resolve, reject) => {
      session.timer = setInterval(() => {
        if (session.dealerMsg && session.dealerMsg.requestId === header.msg_id) {
          session.last_header.msg_id = session.dealerMsg.responseId;
          if (session.dealerMsg.status) {
            clearInterval(session.timer);
            resolve(session.dealerMsg);   
          } else {
            if (Array.isArray(session.dealerMsg.traceback)) {
              session.dealerMsg.traceback.forEach((item: string) => {
                console.error(item)
              })
            } else {
              console.error('[PYTHON: ]', session.dealerMsg.traceback);
            }
            clearInterval(session.timer);
            reject();
          }
        }
      }, 1);
    })
  }
}