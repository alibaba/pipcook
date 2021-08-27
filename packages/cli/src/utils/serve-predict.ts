import * as express from 'express';
import { Express } from 'express';
import * as multer from 'multer';
import * as path from 'path';
import { PipelineType } from '@pipcook/costa';

const ServeMap = {
  [PipelineType.TextClassification]: serveText,
  [PipelineType.ImageClassification]: serveImage,
  [PipelineType.ObjectDetection]: serveImage
};

export type PredictCallBack
  = (input: Buffer[] | string[]) => Promise<Record<string, any>[]>;

/**
 * Serve model.
 * @param port listen port.
 * @param pipelineType pipeline type.
 * @param predictCallback callback for predict.
 */
export function servePredict(
  port: number,
  pipelineType: PipelineType,
  predictCallback: PredictCallBack
): void {
  const app = express();
  if (!ServeMap[pipelineType]) {
    throw new TypeError(`Pipeline type is not supported: ${pipelineType}`);
  }
  ServeMap[pipelineType](app, predictCallback);
  app.listen(port, () => {
    console.log(`Pipcook has served at: http://localhost:${port}`);
  });
}

export function serveText(
  app: Express,
  predictCallback: PredictCallBack
): void {
  app.use(express.static(path.join(__dirname, '../../serve-resource/text')));
  app.get('/predict', async (req, res) => {
    if (req.query && req.query['input']) {
      let inputs: string[];
      if (Array.isArray(req.query['input'])) {
        inputs = req.query['input'] as string[];
      } else if (typeof req.query['input'] === 'string') {
        inputs = [ req.query['input'] ];
      }
      const result = await predictCallback(inputs);
      res.json({ success: true, data: result });
    } else {
      res.json({ success: false, message: 'no input available' });
    }
  });
}

export function serveImage(
  app: Express,
  predictCallback: PredictCallBack
): void {
  app.use(express.static(path.join(__dirname, '../../serve-resource/image')));
  const upload = multer({ storage: multer.memoryStorage() });
  app.post('/predict', upload.array('image'), async (req, res) => {
    let buf: Buffer[];
    if (Array.isArray(req.files)) {
      buf = (req.files as Express.Multer.File[]).map((file) => file.buffer);
    }

    if (buf) {
      const result = await predictCallback(buf);
      res.json({ success: true, data: result });
    } else {
      res.json({ success: false, message: 'no file available' });
    }
  });
}
