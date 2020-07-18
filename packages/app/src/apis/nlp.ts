import { NamedEntityProp, TextAnswer, TranslationResult } from './types';
import { dynamicModelExports } from './executable';

/**
 * Classify the given text input, it returns the label of this input.
 * @param _Input the input text.
 */
export async function classify(_Input: string): Promise<string> {
  throw new TypeError('not trained method');
}

/**
 * Get the named entity by a sentence.
 * @param _Sentence the sentence for named entity
 */
export async function getNamedEntity(_Sentence: string): Promise<NamedEntityProp> {
  throw new TypeError('not trained method');
}

/**
 * Get answers by given question, every anwser has the text and its confidence.
 * @param _Question the question text.
 */
export async function getAnswers(_Question: string): Promise<TextAnswer[]> {
  throw new TypeError('not trained method');
}

/**
 * Get the summary of the given input.
 * @param _Input the input text.
 */
export async function getSummary(_Input: string): Promise<string> {
  throw new TypeError('not trained method');
}

/**
 * Returns the translated language.
 * @param ignoreInput the input text to be translated.
 */
export async function translate(_Input: string): Promise<TranslationResult> {
  throw new TypeError('not trained method');
}

/**
 * Creation of an artwork for text.
 */
export async function createArtwork(): Promise<string> {
  throw new TypeError('not trained method');
}

dynamicModelExports('nlp', module.exports);
