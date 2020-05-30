import tensorflow as tf
  
def loadImage(path):
  image = tf.io.read_file(path)
  image = tf.image.decode_jpeg(image, channels=3)
  return image