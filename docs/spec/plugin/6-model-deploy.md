# ModelDeploy Plugin

This plug-in will be used to deploy trained models to online services, such as Alibaba Cloud (eas service, etc.), Azure, Google Cloud, or Amazon Lambda. This plug-in should be able to obtain the data pre-processing process in the pipeline to accurately process data in the prediction service. At the same time, it should obtain a well-trained model to predict data. With different Model Deploy plug-ins, we can Deploy models to different cloud services or local services.

```ts
export interface ModelDeployType extends PipcookPlugin {
  (args: ArgsType): Promise<any>
}
```

- Input: a trained model and a plug-in for pre-processing data.
- Output: Model Deployment Results.
