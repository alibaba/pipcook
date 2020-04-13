export function shuffle(samples: any[]) {
  for (let i = samples.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ samples[i], samples[j] ] = [ samples[j], samples[i] ];
  }
}

export function sample(samples: any[], num: number) {
  shuffle(samples);
  return samples.slice(0, num);
}
