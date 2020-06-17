import { createLearnable, nlp } from '@pipcook/app';

const isCooking = createLearnable(async function(sentence: string) {
  return (await nlp.classify(sentence));
});

(async () => {
  console.log(await isCooking('test'));
})();
