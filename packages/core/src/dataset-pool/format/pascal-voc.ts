import * as DataCook from '@pipcook/datacook';
import { makeDatasetPool, Types } from '../';
import DatasetType = DataCook.Dataset.Types.DatasetType;
import PascalVoc = DataCook.Dataset.Types.PascalVoc;

function attachId(
  labelMap: Array<string>,
  annotationList: Array<PascalVoc.Annotation> | undefined,
): Array<PascalVoc.Sample> | undefined {
  if (!Array.isArray(annotationList)) {
    return undefined;
  }
  return annotationList.map((annotation: PascalVoc.Annotation) => {
    const extObjs = annotation.object?.map((obj) => {
      const index = labelMap.indexOf(obj.name);
      if (index >= 0) {
        return {
          ...obj,
          id: index
        };
      } else {
        throw TypeError(`'${obj.name}' not exists in train dataset.`);
      }
    });
    return {
      data: {
        ...annotation,
        object: extObjs
      },
      label: extObjs
    };
  });
}

export interface Options {
  trainAnnotationList?: Array<PascalVoc.Annotation>;
  testAnnotationList?: Array<PascalVoc.Annotation>;
  validAnnotationList?: Array<PascalVoc.Annotation>;
  predictedAnnotationList?: Array<PascalVoc.Annotation>;
}

export interface DatasetMeta extends Types.BaseDatasetMeta {
  type: DatasetType.Image;
  labelMap: Array<string>;
}

export const makeDatasetFromPascalVocFormat = async (options: Options): Promise<Types.DatasetPool<PascalVoc.Sample, Types.PascalVoc.DatasetMeta>> => {
  const labelNames: Array<string> = [];
  const trainData = options.trainAnnotationList?.map((annotation: PascalVoc.Annotation) => {
    const extObjs = annotation.object?.map((obj) => {
      const index = labelNames.indexOf(obj.name);
      if (index >= 0) {
        return {
          ...obj,
          id: index
        };
      } else {
        labelNames.push(obj.name);
        return {
          ...obj,
          id: labelNames.length - 1
        };
      }
    });
    return {
      data: {
        ...annotation,
        object: extObjs
      },
      label: extObjs
    };
  });
  const testData = attachId(labelNames, options.testAnnotationList);
  const validData = attachId(labelNames, options.validAnnotationList);
  const predictedData = options.predictedAnnotationList?.map((annotation: PascalVoc.Annotation) => {
    return {
      data: {
        ...annotation,
        object: []
      },
      label: []
    };
  });

  const datasetMeta: Types.PascalVoc.DatasetMeta = {
    type: DatasetType.Image,
    size: {
      train: trainData?.length || 0,
      test: testData?.length || 0,
      valid: validData?.length || 0,
      predicted: predictedData?.length || 0
    },
    labelMap: labelNames
  };
  return makeDatasetPool(
    {
      trainData,
      testData,
      validData,
      predictedData
    },
    datasetMeta
  );
};
