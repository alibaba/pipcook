export class Image {
  height: number;
  width: number;
  // TODO
}

export interface Position2D {
  x: number;
  y: number;
}

export interface NamedEntity {
  // TODO
}

export interface NamedEntityProp {
  sentence: string;
  entities: NamedEntity[];
}

export interface TextAnswer {
  answer: string;
  confidence: number;
}

export interface TranslationResult {
  lang: string;
  output: string;
}