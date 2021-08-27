import * as express from 'express';
import * as multer from 'multer';
import * as path from 'path';
import { PipelineType } from '@pipcook/costa';

export function servePredict(
  port: number,
  pipelineType: PipelineType,
  predictCallback: (input: Buffer[] | string[]) => Promise<Record<string, any>[]>
): void {
  const app = express();
  app.use(express.static(path.join(__dirname, '../../serve-resource')));
  if (pipelineType === PipelineType.TextClassification) {
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
  } else {
    const upload = multer({ storage: multer.memoryStorage() });
    app.post('/predict', upload.single('image'), async (req, res) => {
      if (req.file) {
        const result = await predictCallback([ req.file.buffer ]);
        res.json({ success: true, data: result });
      } else {
        res.json({ success: false, message: 'no file available' });
      }
    });
  }
  app.listen(port, () => {
    console.log(`Pipcook has served at: http://localhost:${port}`);
  });
}
