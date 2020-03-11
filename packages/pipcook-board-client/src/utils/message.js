import { Message } from '@alifd/next';


export function messageSuccess (message) {
  Message.success(message);
}

export function messageError (error) {
  Message.show({
    type: 'error',
    title: 'error',
    content: error,
    hasMask: true,
  });
}

export function messageWarning (message) {
  Message.show({
    type: 'warning',
    title: 'warning',
    content: message,
    hasMask: true,
  });
}