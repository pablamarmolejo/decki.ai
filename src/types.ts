export type Level = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

export type DeckType = 'default' | 'custom';

export type FlashcardState = 'to-be-learnt' | 'learnt' | 'review';

export interface Flashcard {
  id: string;
  kanji?: string;
  kana?: string;
  meaning: string;
  kun?: string;
  on?: string;
  example: string;
  state: FlashcardState;
  type?: string;
}

export interface Deck {
  id: string;
  name: string;
  type: DeckType;
  level: Level;
  cards: Flashcard[];
}

export interface SentencePractice {
  sentence: string;
  hiragana: string;
  meaning: string;
  date: string;
  feedback?: string;
  grammar?: string;
  improvements?: string;
}

export interface WordProgress {
  wordId: string;
  sentences: SentencePractice[];
  usedInPractice: boolean;
}
