export type Level = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

export type DeckType = 'default' | 'custom';

export type FlashcardState = 'to-be-learnt' | 'learnt' | 'review';
export type UserStatusOverride = 'LEARNT' | 'STILL_LEARNING' | null;
export type QuizQuestionType = 'MEANING_MC' | 'READING_MC';

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
  srs_interval?: number;
  srs_ease_factor?: number;
  srs_repetitions?: number;
  last_reviewed_at?: string | null;
  next_review_due?: string | null;
  user_status_override?: UserStatusOverride;
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
