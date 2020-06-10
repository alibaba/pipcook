import { createLearnable, nlp, types, vision } from './index';

const isCooking = createLearnable(async function isCookingImpl(sentence: string) {
  return (await nlp.classify(sentence));
});

const recognizeFace = createLearnable(async (design: types.Image) => {
  return (await vision.classify(design));
});

(async () => {
  console.log(await isCooking('test'));

  const img = new types.Image();
  console.log(await recognizeFace(img));
})();
