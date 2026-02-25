export type Level = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

export type CardState = 'neutral' | 'learnt' | 'review';

export interface Card {
  kanji: string;
  kana: string;
  meaning: string;
  kun: string;
  on: string;
  example: string;
  state?: CardState;
}

export interface Deck {
  id: string;
  name: string;
  level: Level;
  type: 'verbs' | 'nouns' | 'adjectives' | 'adverbs' | 'kanji';
  cards: Card[];
  isCustom?: boolean;
}

export interface Sentence {
  id: string;
  word: string;
  text: string;
  aiFeedbackEn: string;
  aiFeedbackJp: string;
  timestamp: number;
}

export interface UserProgress {
  learntCards: Record<string, boolean>; // key: `${level}_${type}_${kanji}`
  reviewCards: Record<string, boolean>;
  sentences: Sentence[];
  customDecks: Deck[];
}
