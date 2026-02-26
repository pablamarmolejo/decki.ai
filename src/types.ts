export type Level = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

export type CardState = 'neutral' | 'learnt' | 'review';

export interface Card {
  kanji: string;
  kana: string;
  meaning: string;
  kun: string;
  on: string;
  example: string;
  furiganaExample?: string; // Sentence with furigana support
}

export interface Deck {
  id: string;
  name: string;
  level: Level;
  type: 'verbs' | 'nouns' | 'adjectives' | 'adverbs' | 'kanji';
  cards: Card[];
  isCustom?: boolean;
}

export interface SentenceFeedback {
  grammar: string;
  suggestions: string;
  politeness: string;
  isCoherent: boolean;
  acknowledgement: string; // "You used my example" or "Great job creating your own"
}

export interface AiAssistExample {
  kanji: string;
  kana: string;
  english: string;
}

export interface AiAssistResponse {
  explanation: string;
  examples: AiAssistExample[];
}

export interface Sentence {
  id: string;
  word: string;
  kanjiText: string;
  kanaText: string;
  aiFeedback: SentenceFeedback;
  timestamp: number;
  usedAssist: boolean;
}

export interface UserProgress {
  learntCards: Record<string, boolean>; // key: `${deckId}_${kanji}`
  reviewCards: Record<string, boolean>;
  sentences: Sentence[];
  customDecks: Deck[];
}
