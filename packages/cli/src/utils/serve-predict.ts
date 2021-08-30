import * as express from 'express';
import { Express, Request, Response } from 'express';
import * as multer from 'multer';
import * as path from 'path';
import * as http from 'http';
import { PipelineType } from '@pipcook/costa';

let server: http.Server;
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
export async function serve(
  port: number,
  pipelineType: PipelineType,
  predictCallback: PredictCallBack
): Promise<void> {
  if (!ServeMap[pipelineType]) {
    throw new TypeError(`Pipeline type is not supported: ${pipelineType}`);
  }

  const app = express();
  ServeMap[pipelineType](app, predictCallback);
  return new Promise<void>((resolve) => {
    server = app.listen(port, () => {
      resolve();
    });
  });
}

export async function stop(): Promise<void> {
  if (server) {
    return new Promise<void>((resolve, reject) => {
      server.close((err?: Error) => {
        server = undefined;
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

export async function predictText(
  predictCallback: PredictCallBack,
  req: Request,
  res: Response
): Promise<void> {
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
}

export function serveText(
  app: Express,
  predictCallback: PredictCallBack
): void {
  app.use(express.static(path.join(__dirname, '../../serve-resource/text')))
    .get('/predict', predictText.bind(this, predictCallback));
}

export async function predictImage(
  predictCallback: PredictCallBack,
  req: Request,
  res: Response
): Promise<void> {
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
}

export function serveImage(
  app: Express,
  predictCallback: PredictCallBack
): void {
  const upload = multer({ storage: multer.memoryStorage() });
  app.use(express.static(path.join(__dirname, '../../serve-resource/image')))
    .post('/predict', upload.array('image'), predictImage.bind(this, predictCallback));
}
