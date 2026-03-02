import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Level, Deck, FlashcardState, SentencePractice, WordProgress } from './types';
import n5Kanji from './data/n5_kanji.json';
import n4Kanji from './data/n4_kanji.json';
import n3Kanji from './data/n3_kanji.json';

interface AppContextType {
  currentLevel: Level;
  setCurrentLevel: (level: Level) => void;
  decks: Deck[];
  setDecks: React.Dispatch<React.SetStateAction<Deck[]>>;
  updateFlashcardState: (deckId: string, cardId: string, newState: FlashcardState) => void;
  resetDeck: (deckId: string) => void;
  deleteDeck: (deckId: string) => void;
  addCustomDeck: (deck: Deck) => void;
  updateCustomDeck: (deck: Deck) => void;
  wordProgress: WordProgress[];
  addSentence: (wordId: string, sentence: SentencePractice) => void;
  removeSentence: (wordId: string, sentenceIndex: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLevel, setCurrentLevel] = useState<Level>('N5');
  const [decks, setDecks] = useState<Deck[]>([]);
  const [wordProgress, setWordProgress] = useState<WordProgress[]>([]);

  useEffect(() => {
    // Initialize default decks from JSON
    const initialDecks: Deck[] = [
      {
        id: 'n5-kanji',
        name: 'N5 Kanji',
        type: 'default',
        level: 'N5',
        cards: n5Kanji.map((k, i) => ({ ...k, id: `n5-k-${i}`, state: 'to-be-learnt' as FlashcardState })),
      },
      {
        id: 'n4-kanji',
        name: 'N4 Kanji',
        type: 'default',
        level: 'N4',
        cards: n4Kanji.map((k, i) => ({ ...k, id: `n4-k-${i}`, state: 'to-be-learnt' as FlashcardState })),
      },
      {
        id: 'n3-kanji',
        name: 'N3 Kanji',
        type: 'default',
        level: 'N3',
        cards: n3Kanji.map((k, i) => ({ ...k, id: `n3-k-${i}`, state: 'to-be-learnt' as FlashcardState })),
      },
    ];

    // Load from local storage if available
    const savedDecks = localStorage.getItem('decki-decks');
    if (savedDecks) {
      setDecks(JSON.parse(savedDecks));
    } else {
      setDecks(initialDecks);
    }

    const savedProgress = localStorage.getItem('decki-progress');
    if (savedProgress) {
      setWordProgress(JSON.parse(savedProgress));
    }
  }, []);

  useEffect(() => {
    if (decks.length > 0) {
      localStorage.setItem('decki-decks', JSON.stringify(decks));
    }
  }, [decks]);

  useEffect(() => {
    localStorage.setItem('decki-progress', JSON.stringify(wordProgress));
  }, [wordProgress]);

  const updateFlashcardState = (deckId: string, cardId: string, newState: FlashcardState) => {
    setDecks((prev) =>
      prev.map((deck) =>
        deck.id === deckId
          ? {
              ...deck,
              cards: deck.cards.map((card) =>
                card.id === cardId ? { ...card, state: newState } : card
              ),
            }
          : deck
      )
    );
  };

  const resetDeck = (deckId: string) => {
    setDecks((prev) =>
      prev.map((deck) =>
        deck.id === deckId
          ? {
              ...deck,
              cards: deck.cards.map((card) => ({ ...card, state: 'to-be-learnt' })),
            }
          : deck
      )
    );
  };

  const deleteDeck = (deckId: string) => {
    setDecks((prev) => prev.filter((d) => d.id !== deckId));
  };

  const addCustomDeck = (deck: Deck) => {
    setDecks((prev) => [...prev, deck]);
  };

  const updateCustomDeck = (deck: Deck) => {
    setDecks((prev) => prev.map((d) => (d.id === deck.id ? deck : d)));
  };

  const addSentence = (wordId: string, sentence: SentencePractice) => {
    setWordProgress((prev) => {
      const existing = prev.find((p) => p.wordId === wordId);
      if (existing) {
        return prev.map((p) =>
          p.wordId === wordId
            ? { ...p, usedInPractice: true, sentences: [...p.sentences, sentence] }
            : p
        );
      } else {
        return [...prev, { wordId, usedInPractice: true, sentences: [sentence] }];
      }
    });
  };

  const removeSentence = (wordId: string, sentenceIndex: number) => {
    setWordProgress((prev) =>
      prev.map((p) =>
        p.wordId === wordId
          ? {
              ...p,
              sentences: p.sentences.filter((_, i) => i !== sentenceIndex),
              usedInPractice: p.sentences.length > 1,
            }
          : p
      )
    );
  };

  return (
    <AppContext.Provider
      value={{
        currentLevel,
        setCurrentLevel,
        decks,
        setDecks,
        updateFlashcardState,
        resetDeck,
        deleteDeck,
        addCustomDeck,
        updateCustomDeck,
        wordProgress,
        addSentence,
        removeSentence,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
