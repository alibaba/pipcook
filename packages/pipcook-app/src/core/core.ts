import ImageClassification from '../models/imageClassification';
import ObjectDetection from '../models/objectDetection';
import TextClassification from '../models/textClassification';

export default class Pipcook {
  imageClassification = ImageClassification;
  objectDetection = ObjectDetection;
  textClassification = TextClassification;
}