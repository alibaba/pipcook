import { ImageSample, ImageLabel } from '../../packages/cli/node_modules/@pipcook/pipcook-core';
import path from 'path';

export const makeImageSample = (uri: string, name: string, categoryId: number): ImageSample => {
  const imageLabel: ImageLabel = {
    name,
    categoryId,
  }

  return {
    data: uri,
    label: imageLabel
  }
}

export const ASSET = path.join(path.resolve(__dirname, "../"), "assets")
