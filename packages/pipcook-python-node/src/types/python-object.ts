import * as zmq from 'zeromq';

export interface PythonObject {
  __pipcook__identifier: string;
  (...args: any[]): any;
  [key: string]: any;
}

export interface Message {
  requestId?: string;
  responseId?: string;
  status?: boolean;
  traceback?: string;
}

export interface Header {
  msg_id?: string;
  msg_type?: string;
  username?: string;
  version?: string;
  session?: string;
}

export interface Session {
  id: string;
  parent_header: Header;
  last_header: Header;
  dealerMsg: Message;
  socketDealer: zmq.Dealer;
  socketSubscriber: zmq.Subscriber;
  timer: NodeJS.Timeout;
  ioPort: number;
  shellPort: number;
  kernel: any;
}
