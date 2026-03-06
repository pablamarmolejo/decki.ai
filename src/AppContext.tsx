import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Level, Deck, FlashcardState, SentencePractice, WordProgress } from './types';

// Default Decks Data
import n5Kanji from './data/n5_kanji.json';
import n4Kanji from './data/n4_kanji.json';
import n3Kanji from './data/n3_kanji.json';
import n5Adjectives from './data/n5_adjectives.json';
import n5Adverbs from './data/n5_adverbs.json';
import n5Nouns1 from './data/n5_nouns_1.json';
import n5Nouns2 from './data/n5_nouns_2.json';
import n5Nouns3 from './data/n5_nouns_3.json';
import n5Nouns4 from './data/n5_nouns_4.json';
import n5Nouns5 from './data/n5_nouns_5.json';
import n5Verbs1 from './data/n5_verbs_1.json';
import n5Verbs2 from './data/n5_verbs_2.json';

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
    // Helper to format deck name from parts
    const formatName = (type: string, num?: string) => {
      const capitalized = type.charAt(0).toUpperCase() + type.slice(1);
      return num ? `${capitalized} ${num}` : capitalized;
    };

    // Initialize default decks from JSON
    const initialDecks: Deck[] = [
      // N5 Decks
      {
        id: 'n5-kanji',
        name: formatName('kanji'),
        type: 'default',
        level: 'N5',
        cards: n5Kanji.map((k, i) => ({ ...k, id: `n5-k-${i}`, state: 'to-be-learnt' as FlashcardState })),
      },
      {
        id: 'n5-adjectives',
        name: formatName('adjectives'),
        type: 'default',
        level: 'N5',
        cards: n5Adjectives.map((k, i) => ({ ...k, id: `n5-adj-${i}`, state: 'to-be-learnt' as FlashcardState })),
      },
      {
        id: 'n5-adverbs',
        name: formatName('adverbs'),
        type: 'default',
        level: 'N5',
        cards: n5Adverbs.map((k, i) => ({ ...k, id: `n5-adv-${i}`, state: 'to-be-learnt' as FlashcardState })),
      },
      {
        id: 'n5-nouns-1',
        name: formatName('nouns', '1'),
        type: 'default',
        level: 'N5',
        cards: n5Nouns1.map((k, i) => ({ ...k, id: `n5-n1-${i}`, state: 'to-be-learnt' as FlashcardState })),
      },
      {
        id: 'n5-nouns-2',
        name: formatName('nouns', '2'),
        type: 'default',
        level: 'N5',
        cards: n5Nouns2.map((k, i) => ({ ...k, id: `n5-n2-${i}`, state: 'to-be-learnt' as FlashcardState })),
      },
      {
        id: 'n5-nouns-3',
        name: formatName('nouns', '3'),
        type: 'default',
        level: 'N5',
        cards: n5Nouns3.map((k, i) => ({ ...k, id: `n5-n3-${i}`, state: 'to-be-learnt' as FlashcardState })),
      },
      {
        id: 'n5-nouns-4',
        name: formatName('nouns', '4'),
        type: 'default',
        level: 'N5',
        cards: n5Nouns4.map((k, i) => ({ ...k, id: `n5-n4-${i}`, state: 'to-be-learnt' as FlashcardState })),
      },
      {
        id: 'n5-nouns-5',
        name: formatName('nouns', '5'),
        type: 'default',
        level: 'N5',
        cards: n5Nouns5.map((k, i) => ({ ...k, id: `n5-n5-${i}`, state: 'to-be-learnt' as FlashcardState })),
      },
      {
        id: 'n5-verbs-1',
        name: formatName('verbs', '1'),
        type: 'default',
        level: 'N5',
        cards: n5Verbs1.map((k, i) => ({ ...k, id: `n5-v1-${i}`, state: 'to-be-learnt' as FlashcardState })),
      },
      {
        id: 'n5-verbs-2',
        name: formatName('verbs', '2'),
        type: 'default',
        level: 'N5',
        cards: n5Verbs2.map((k, i) => ({ ...k, id: `n5-v2-${i}`, state: 'to-be-learnt' as FlashcardState })),
      },
      // N4 Decks
      {
        id: 'n4-kanji',
        name: formatName('kanji'),
        type: 'default',
        level: 'N4',
        cards: n4Kanji.map((k, i) => ({ ...k, id: `n4-k-${i}`, state: 'to-be-learnt' as FlashcardState })),
      },
      // N3 Decks
      {
        id: 'n3-kanji',
        name: formatName('kanji'),
        type: 'default',
        level: 'N3',
        cards: n3Kanji.map((k, i) => ({ ...k, id: `n3-k-${i}`, state: 'to-be-learnt' as FlashcardState })),
      },
    ];

    // Load from local storage if available
    const savedDecks = localStorage.getItem('decki-decks');
    if (savedDecks) {
      const parsedDecks = JSON.parse(savedDecks) as Deck[];
      
      // We want to preserve the default decks from JSON but merge them with saved state (to keep 'learnt' flags)
      // And also keep custom decks created by user.
      
      const customDecks = parsedDecks.filter(d => d.type === 'custom');
      
      const finalDecks = initialDecks.map(defaultDeck => {
        const savedDefault = parsedDecks.find(pd => pd.id === defaultDeck.id);
        if (savedDefault) {
          // Sync card states
          return {
            ...defaultDeck,
            cards: defaultDeck.cards.map(card => {
              const savedCard = savedDefault.cards.find(sc => sc.kanji === card.kanji && sc.kana === card.kana);
              return savedCard ? { ...card, state: savedCard.state } : card;
            })
          };
        }
        return defaultDeck;
      });

      setDecks([...finalDecks, ...customDecks]);
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
