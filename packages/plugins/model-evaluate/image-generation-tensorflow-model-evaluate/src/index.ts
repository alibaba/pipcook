import { ModelEvaluateType, UniModel, ImageDataset, EvaluateResult, ArgsType } from '@pipcook/pipcook-core';

const cycleGanModelEvaluate: ModelEvaluateType
  = async (data: ImageDataset, model: UniModel, _args: ArgsType): Promise<EvaluateResult> => {
    const { testLoader } = data;
    const aList = [];
    const bList = [];
    for (let i = 0; i < await testLoader.len(); ++i) {
      const image = await testLoader.getItem(i);
      switch ((await image).label.name.toLowerCase()) {
      case 'a':
        aList.push((await image).data);
        break;
      case 'b':
        bList.push((await image).data);
        break;
      default:
        console.warn('unknown type of ', (await image).data);
        break;
      }
    }
    const [ G_loss_fake_B, G_loss_rec_A, G_loss_fake_A, G_loss_rec_B, G_loss_id_A, G_loss_id_B,
      D_loss_real_A, D_loss_fake_A, D_loss_real_B, D_loss_fake_B ] = model.model.evaluate(aList, bList);
    return {
      pass: true,
      loss: {
        G_loss_fake_B, G_loss_rec_A, G_loss_fake_A, G_loss_rec_B, G_loss_id_A, G_loss_id_B,
        D_loss_real_A, D_loss_fake_A, D_loss_real_B, D_loss_fake_B
      }
    };
  };

export default cycleGanModelEvaluate;
