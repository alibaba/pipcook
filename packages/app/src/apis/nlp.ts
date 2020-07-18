import { NamedEntityProp, TextAnswer, TranslationResult } from './types';
import { dynamicModelExports } from './executable';

/**
 * Classify the given text input, it returns the label of this input.
 * @param _input the input text.
 */
export async function classify(_input: string): Promise<string> {
  throw new TypeError('not trained method');
}

/**
 * Get the named entity by a sentence.
 * @param _sentence the sentence for named entity
 */
export async function getNamedEntity(_sentence: string): Promise<NamedEntityProp> {
  throw new TypeError('not trained method');
}

/**
 * Get answers by given question, every anwser has the text and its confidence.
 * @param _question the question text.
 */
export async function getAnswers(_question: string): Promise<TextAnswer[]> {
  throw new TypeError('not trained method');
}

/**
 * Get the summary of the given input.
 * @param _input the input text.
 */
export async function getSummary(_input: string): Promise<string> {
  throw new TypeError('not trained method');
}

/**
 * Returns the translated language.
 * @param _input the input text to be translated.
 */
export async function translate(_input: string): Promise<TranslationResult> {
  throw new TypeError('not trained method');
}

/**
 * Creation of an artwork for text.
 */
export async function createArtwork(): Promise<string> {
  throw new TypeError('not trained method');
}

dynamicModelExports('nlp', module.exports);
