import { NamedEntityProp, TextAnswer, TranslationResult } from './types';

export async function classify(input: string): Promise<string> {
  return 'label';
}

export async function getNamedEntity(sentence: string): Promise<NamedEntityProp> {
  return {
    sentence,
    entities: []
  };
}

export async function getAnswers(question: string): Promise<TextAnswer[]> {
  return [];
}

export async function getSummary(input: string): Promise<string> {
  return 'summary';
}

export async function translate(input: string): Promise<TranslationResult> {
  return {
    lang: 'zh-cn',
    output: ''
  };
}

export async function createArtwork(): Promise<string> {
  return 'artwork';
}
