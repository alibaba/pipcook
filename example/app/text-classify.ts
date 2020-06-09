import { createLearnable, nlp, types } from '@pipcook/app';

const isCooking = createLearnable(async (sentence: string) => {
  return (await nlp.classify(sentence));
});

(async () => {
  console.log(await isCooking('test'));
})();
