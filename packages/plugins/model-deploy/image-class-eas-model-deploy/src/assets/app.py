
import allspark
import io
import numpy as np
import json
from PIL import Image
import requests
import threading
import cv2
import tensorflow as tf
from tensorflow.keras.models import load_model


with open('label.json') as f:
    mp = json.load(f)
labels = {value:key for key,value in mp.items()}

def create_opencv_image_from_stringio(img_stream, cv2_img_flag=-1):
  img_stream.seek(0)
  img_array = np.asarray(bytearray(img_stream.read()), dtype=np.uint8)
  image_temp = cv2.imdecode(img_array, cv2_img_flag)
  if image_temp.shape[2] == 4:
    image_channel3 = cv2.cvtColor(image_temp, cv2.COLOR_BGRA2BGR)
    image_mask = image_temp[:,:,3] #.reshape(image_temp.shape[0],image_temp.shape[1], 1)
    image_mask = np.stack((image_mask, image_mask, image_mask), axis = 2)
    index_mask = np.where(image_mask == 0)
    image_channel3[index_mask[0], index_mask[1], index_mask[2]] = 255
    return image_channel3
  else:
    return image_temp

def get_string_io(origin_path):
  r = requests.get(origin_path, timeout=2)
  stringIo_content = io.BytesIO(r.content)
  return stringIo_content

def handleReturn(pred, percent, msg_length):
  result = {
    "content":[]
  }
  argm = np.argsort(-pred, axis = 1)
  for i in range(msg_length):
      label = labels[argm[i, 0]]
      index = argm[i, 0]
      if(pred[i, index] > percent):
        confident = True
      else:
        confident = False
      result['content'].append({'isConfident': confident, 'label': label})
  return result


def process(msg, model):
  msg_dict = json.loads(msg)
  percent = msg_dict['threshold']
  msg_dict = msg_dict['images']
  msg_length = len(msg_dict)
  desire_size = 256
  
  images = []
  for i in range(msg_length):
    image_temp = create_opencv_image_from_stringio(get_string_io(msg_dict[i]))
    image_temp = cv2.cvtColor(image_temp, cv2.COLOR_BGR2RGB)
    image = cv2.resize(image_temp, (256, 256))  
    images.append(image)
  images = np.asarray(images)
  pred = model.predict(images)
  return bytes(json.dumps(handleReturn(pred, percent, msg_length)) ,'utf-8')  


def worker(srv, thread_id, model):
  while True:
    msg = srv.read()
    try:
      rsp = process(msg, model)
      srv.write(rsp)
    except Exception as e:
      srv.error(500,bytes('invalid data format', 'utf-8'))

if __name__ == '__main__':
    desire_size = 256
    model = load_model('./model.h5')
    
    context = allspark.Context(4)
    queued = context.queued_service()

    workers = []
    for i in range(10):
        t = threading.Thread(target=worker, args=(queued, i, model))
        t.setDaemon(True)
        t.start()
        workers.append(t)
    for t in workers:
        t.join()


