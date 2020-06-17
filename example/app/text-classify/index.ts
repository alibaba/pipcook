import { createLearnable, nlp } from '@pipcook/app';

const isCooking = createLearnable(async function(sentence: string) {
  return (await nlp.classify(sentence));
});

const isBooking = createLearnable(async function(sentence: string) {
  console.log(nlp.classify);
  return (await nlp.classify(sentence));
});

(async () => {
  console.log(await isCooking('test'));
  console.log(await isBooking('booking test'));
})();
