import React, { useState, useEffect } from 'react';
import { Level, Deck, Card, CardState, UserProgress, Sentence } from './types';
import n5_kanji from './data/n5_kanji.json';
import n4_kanji from './data/n4_kanji.json';
import n3_kanji from './data/n3_kanji.json';
import { Book, Edit3, Award, Plus, ChevronLeft, ChevronRight, Check, RefreshCw, X, MessageSquare, Sparkles, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock empty data for missing levels
const emptyData: any[] = [];

const INITIAL_PROGRESS: UserProgress = {
  learntCards: {},
  reviewCards: {},
  sentences: [],
  customDecks: []
};

const App: React.FC = () => {
  const [level, setLevel] = useState<Level>('N5');
  const [view, setView] = useState<'home' | 'deck' | 'practice' | 'create'>('home');
  const [activeDeck, setActiveDeck] = useState<Deck | null>(null);
  const [progress, setProgress] = useState<UserProgress>(() => {
    const saved = localStorage.getItem('decki_progress');
    return saved ? JSON.parse(saved) : INITIAL_PROGRESS;
  });

  useEffect(() => {
    localStorage.setItem('decki_progress', JSON.stringify(progress));
  }, [progress]);

  // Derived decks for current level
  const defaultDecks: Deck[] = ([
    {
      id: `${level}_kanji`,
      name: `${level} Kanji`,
      level: level,
      type: 'kanji',
      cards: (level === 'N5' ? n5_kanji : level === 'N4' ? n4_kanji : level === 'N3' ? n3_kanji : emptyData) as Card[]
    },
    { id: `${level}_verbs`, name: `${level} Verbs`, level: level, type: 'verbs', cards: [] },
    { id: `${level}_nouns`, name: `${level} Nouns`, level: level, type: 'nouns', cards: [] },
    { id: `${level}_adjectives`, name: `${level} Adjectives`, level: level, type: 'adjectives', cards: [] },
    { id: `${level}_adverbs`, name: `${level} Adverbs`, level: level, type: 'adverbs', cards: [] },
  ] as Deck[]).filter(d => d.cards.length > 0 || d.type === 'kanji');

  const currentCustomDecks = progress.customDecks.filter(d => d.level === level);

  const [filter, setFilter] = useState<'all' | 'default' | 'custom'>('all');

  const visibleDecks = [...defaultDecks, ...currentCustomDecks].filter(d => {
    if (filter === 'all') return true;
    if (filter === 'default') return !d.isCustom;
    if (filter === 'custom') return d.isCustom;
    return true;
  });

  const getCardKey = (deckId: string, kanji: string) => `${deckId}_${kanji}`;

  const markCard = (deckId: string, kanji: string, state: CardState) => {
    const key = getCardKey(deckId, kanji);
    setProgress(prev => {
      const nextLearnt = { ...prev.learntCards };
      const nextReview = { ...prev.reviewCards };
      
      delete nextLearnt[key];
      delete nextReview[key];

      if (state === 'learnt') nextLearnt[key] = true;
      if (state === 'review') nextReview[key] = true;

      return { ...prev, learntCards: nextLearnt, reviewCards: nextReview };
    });
  };

  const getDeckStats = (deck: Deck) => {
    const total = deck.cards.length;
    let learnt = 0;
    let review = 0;
    deck.cards.forEach(c => {
      const key = getCardKey(deck.id, c.kanji);
      if (progress.learntCards[key]) learnt++;
      else if (progress.reviewCards[key]) review++;
    });
    return { total, learnt, review, neutral: total - learnt - review };
  };

  const openDeck = (deck: Deck) => {
    setActiveDeck(deck);
    setView('deck');
  };

  const goBack = () => {
    setView('home');
    setActiveDeck(null);
  };

  return (
    <div className="decki">
      <header>
        <div className="container header-content">
          <a href="#" className="logo" onClick={(e) => { e.preventDefault(); goBack(); }}>decki.ai</a>
          <div className="level-selector">
            {(['N5', 'N4', 'N3', 'N2', 'N1'] as Level[]).map(l => (
              <button 
                key={l} 
                className={`level-btn ${level === l ? 'active' : ''}`}
                onClick={() => { setLevel(l); goBack(); }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="container">
        {view === 'home' && (
          <>
            <section>
              <h2><Book size={20} /> Study Decks</h2>
              <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                <button className={`level-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
                <button className={`level-btn ${filter === 'default' ? 'active' : ''}`} onClick={() => setFilter('default')}>Default</button>
                <button className={`level-btn ${filter === 'custom' ? 'active' : ''}`} onClick={() => setFilter('custom')}>Custom</button>
              </div>
              <div className="grid">
                {visibleDecks.map(deck => {
                  const stats = getDeckStats(deck);
                  return (
                    <div key={deck.id} className="card" onClick={() => openDeck(deck)}>
                      {deck.isCustom && (
                        <button 
                          className="btn-nav" 
                          style={{ position: 'absolute', top: '10px', right: '10px', padding: '4px', borderRadius: '50%' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Delete this custom deck?')) {
                              setProgress(prev => ({
                                ...prev,
                                customDecks: prev.customDecks.filter(d => d.id !== deck.id)
                              }));
                            }
                          }}
                        >
                          <X size={14} />
                        </button>
                      )}
                      <div className="card-title">
                        {deck.name}
                        {deck.isCustom && <span className="badge badge-ai">Sensei AI</span>}
                      </div>
                      <div className="card-stats">
                        {stats.learnt} learnt / {stats.total} total
                      </div>
                      <div style={{ marginTop: '10px', height: '4px', background: '#eee', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${(stats.learnt / stats.total) * 100}%`, height: '100%', background: 'var(--success)' }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section>
              <h2><Edit3 size={20} /> Mastery Practice</h2>
              <div className="card" onClick={() => setView('practice')}>
                <div className="card-title">All Learnt Words Practice</div>
                <div className="card-stats">Create sentences with words from all your decks.</div>
              </div>
            </section>

            <section>
              <h2><Sparkles size={20} /> Create Decks with Sensei AI</h2>
              <div className="ai-creator" onClick={() => setView('create')}>
                <h3 style={{ marginBottom: '15px' }}>Let Sensei AI build your deck</h3>
                <p style={{ color: 'var(--secondary)', marginBottom: '30px' }}>Type a theme or a list of words, and the AI will do the rest.</p>
                <div className="ai-input-group">
                  <div className="ai-input">Example: "Words for traveling to Kyoto"</div>
                  <button className="btn-ai">Create</button>
                </div>
              </div>
            </section>
          </>
        )}

        {view === 'deck' && activeDeck && (
          <DeckView 
            deck={activeDeck} 
            progress={progress} 
            onBack={goBack} 
            onMark={markCard}
            onPractice={() => setView('practice')}
            onReset={() => {
              setProgress(prev => {
                const nextLearnt = { ...prev.learntCards };
                const nextReview = { ...prev.reviewCards };
                activeDeck.cards.forEach(c => {
                  const key = getCardKey(activeDeck.id, c.kanji);
                  delete nextLearnt[key];
                  delete nextReview[key];
                });
                return { ...prev, learntCards: nextLearnt, reviewCards: nextReview };
              });
            }}
          />
        )}

        {view === 'practice' && (
          <PracticeView 
            level={level}
            allDecks={[...defaultDecks, ...currentCustomDecks]}
            progress={progress}
            onBack={goBack}
            onSaveSentence={(sentence) => setProgress(prev => ({ ...prev, sentences: [...prev.sentences, sentence] }))}
          />
        )}

        {view === 'create' && (
          <CreateDeckView 
            level={level}
            onBack={goBack}
            onSaveDeck={(deck) => setProgress(prev => ({ ...prev, customDecks: [...prev.customDecks, deck] }))}
          />
        )}
      </main>
    </div>
  );
};

// Sub-components

const DeckView: React.FC<{ 
  deck: Deck, 
  progress: UserProgress, 
  onBack: () => void, 
  onMark: (deckId: string, kanji: string, state: CardState) => void,
  onPractice: () => void,
  onReset: () => void
}> = ({ deck, progress, onBack, onMark, onPractice, onReset }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);

  const getCardKey = (kanji: string) => `${deck.id}_${kanji}`;
  
  const stats = (() => {
    let learnt = 0;
    let review = 0;
    deck.cards.forEach(c => {
      const key = getCardKey(c.kanji);
      if (progress.learntCards[key]) learnt++;
      else if (progress.reviewCards[key]) review++;
    });
    return { learnt, review, total: deck.cards.length, neutral: deck.cards.length - learnt - review };
  })();

  const currentCard = deck.cards[currentIndex];
  const currentState = progress.learntCards[getCardKey(currentCard.kanji)] ? 'learnt' : 
                   progress.reviewCards[getCardKey(currentCard.kanji)] ? 'review' : 'neutral';

  const handleMark = (state: CardState) => {
    onMark(deck.id, currentCard.kanji, state);
    setFlipped(false);
    
    // Auto-advance if not completion
    if (currentIndex < deck.cards.length - 1) {
      setTimeout(() => setCurrentIndex(i => i + 1), 300);
    } else {
      // Check if all are learnt
      const willBeLearnt = stats.learnt + (state === 'learnt' ? 1 : 0) === stats.total;
      if (willBeLearnt) {
        setShowCompletion(true);
      } else {
        // Just loop back or stay?
      }
    }
  };

  const handleNext = () => {
    setCurrentIndex(i => (i + 1) % deck.cards.length);
    setFlipped(false);
  };

  const handlePrev = () => {
    setCurrentIndex(i => (i - 1 + deck.cards.length) % deck.cards.length);
    setFlipped(false);
  };

  return (
    <div className="deck-view">
      <div className="deck-header">
        <button className="btn btn-nav" onClick={onBack}><ArrowLeft size={16} /> Back</button>
        <div className="deck-progress">
          <div className="progress-item"><span>To learn</span> {stats.neutral}</div>
          <div className="progress-item"><span>Review</span> {stats.review}</div>
          <div className="progress-item"><span>Learnt</span> {stats.learnt}</div>
        </div>
      </div>

      <h2 style={{ width: '100%', maxWidth: '500px', justifyContent: 'center' }}>{deck.name} ({currentIndex + 1}/{deck.cards.length})</h2>

      <div className="flashcard-container" onClick={() => setFlipped(!flipped)}>
        <motion.div 
          className="flashcard-inner"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
        >
          <div className="flashcard-front">
            <div className="kanji-display">{currentCard.kanji}</div>
            <div className="kana-display">{currentCard.kana}</div>
            {currentState !== 'neutral' && (
              <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
                {currentState === 'learnt' ? <Check color="var(--success)" size={24} /> : <RefreshCw color="var(--warning)" size={24} />}
              </div>
            )}
          </div>
          <div className="flashcard-back">
            <div className="meaning-display">{currentCard.meaning}</div>
            <div style={{ marginBottom: '20px', fontSize: '14px' }}>
              {currentCard.kun && <div><strong>Kun:</strong> {currentCard.kun}</div>}
              {currentCard.on && <div><strong>On:</strong> {currentCard.on}</div>}
            </div>
            <div className="example-display">
              {currentCard.example}
            </div>
          </div>
        </motion.div>
      </div>

      <div className="flashcard-actions">
        <button className="btn btn-review" onClick={(e) => { e.stopPropagation(); handleMark('review'); }}><RefreshCw size={18} /> Review</button>
        <button className="btn btn-skip" onClick={(e) => { e.stopPropagation(); handleNext(); }}>Skip</button>
        <button className="btn btn-learnt" onClick={(e) => { e.stopPropagation(); handleMark('learnt'); }}><Check size={18} /> Learnt</button>
      </div>

      <div className="deck-nav-controls">
        <button className="btn btn-nav" onClick={handlePrev}><ChevronLeft /></button>
        <button className="btn btn-nav" onClick={handleNext}><ChevronRight /></button>
      </div>

      <div style={{ marginTop: '20px' }}>
        <button className="btn btn-nav" onClick={onReset}><RefreshCw size={14} /> Reset Progress</button>
      </div>

      {showCompletion && (
        <div className="modal-overlay">
          <div className="modal-content">
            <Award size={64} color="var(--warning)" style={{ marginBottom: '20px' }} />
            <h2>Congratulations!</h2>
            <p style={{ marginBottom: '30px' }}>You have finished the "{deck.name}" deck.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button className="btn btn-learnt" style={{ justifyContent: 'center' }} onClick={onBack}>Go back to Study Decks</button>
              <button className="btn btn-review" style={{ justifyContent: 'center' }} onClick={() => { setShowCompletion(false); onReset(); setCurrentIndex(0); }}>Restart Deck</button>
              <button className="btn btn-skip" style={{ justifyContent: 'center' }} onClick={onPractice}>Start Practice</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import { generateDeckFromAi, getSentenceFeedback } from './services/ai';

const PracticeView: React.FC<{
  level: Level,
  allDecks: Deck[],
  progress: UserProgress,
  onBack: () => void,
  onSaveSentence: (s: Sentence) => void
}> = ({ level, allDecks, progress, onBack, onSaveSentence }) => {
  const [selectedWord, setSelectedWord] = useState<Card | null>(null);
  const [sentenceText, setSentenceText] = useState('');
  const [feedback, setFeedback] = useState<{en: string, jp: string} | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Get all unique learnt words for this level
  const learntWords = allDecks.flatMap(d => d.cards.filter(c => progress.learntCards[`${d.id}_${c.kanji}`]));
  const practicedWords = new Set(progress.sentences.map(s => s.word));

  const handleAiAssist = () => {
    if (!selectedWord) return;
    setSentenceText(`私は毎日${selectedWord.kanji}を勉強します。`);
  };

  const handleSubmit = async () => {
    if (!selectedWord || !sentenceText) return;
    setIsAiLoading(true);
    try {
      const newFeedback = await getSentenceFeedback(sentenceText, selectedWord.kanji);
      setFeedback(newFeedback);
      onSaveSentence({
        id: Math.random().toString(36).substr(2, 9),
        word: selectedWord.kanji,
        text: sentenceText,
        aiFeedbackEn: newFeedback.en,
        aiFeedbackJp: newFeedback.jp,
        timestamp: Date.now()
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="practice-container">
      <div style={{ marginBottom: '30px' }}>
        <button className="btn btn-nav" onClick={onBack}><ArrowLeft size={16} /> Back</button>
        <h2 style={{ marginTop: '20px' }}><Award /> Mastery Practice</h2>
        <p style={{ color: 'var(--text-light)' }}>Select a learnt word to practice creating sentences.</p>
      </div>

      <div className="word-chips">
        {learntWords.map((card, i) => (
          <div 
            key={i} 
            className={`word-chip ${selectedWord?.kanji === card.kanji ? 'active' : ''} ${practicedWords.has(card.kanji) ? 'practiced' : ''}`}
            onClick={() => { setSelectedWord(card); setFeedback(null); setSentenceText(''); }}
          >
            {card.kanji}
          </div>
        ))}
      </div>

      {selectedWord && (
        <div className="sentence-editor">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontFamily: 'var(--font-jp)' }}>Word: {selectedWord.kanji} ({selectedWord.kana})</h3>
            <button className="btn btn-nav" onClick={handleAiAssist} disabled={isAiLoading}>
              <Sparkles size={14} /> AI Suggest
            </button>
          </div>
          
          <textarea 
            placeholder="Type your Japanese sentence here..."
            value={sentenceText}
            onChange={(e) => setSentenceText(e.target.value)}
          />

          <div style={{ display: 'flex', gap: '15px' }}>
            <button className="btn btn-learnt" style={{ flex: 1, justifyContent: 'center' }} onClick={handleSubmit} disabled={isAiLoading}>
              {isAiLoading ? 'Sensei AI is thinking...' : 'Submit Sentence'}
            </button>
          </div>

          {feedback && (
            <div className="ai-feedback">
              <h4>Sensei AI Feedback:</h4>
              <p><strong>EN:</strong> {feedback.en}</p>
              <p><strong>JP:</strong> {feedback.jp}</p>
              <button className="btn btn-skip" style={{ marginTop: '15px' }} onClick={() => { setSelectedWord(null); setFeedback(null); setSentenceText(''); }}>
                Practice another word
              </button>
            </div>
          )}

          <div style={{ marginTop: '40px' }}>
            <h4>History for "{selectedWord.kanji}"</h4>
            {progress.sentences.filter(s => s.word === selectedWord.kanji).map(s => (
              <div key={s.id} style={{ padding: '15px', borderBottom: '1px solid var(--border)' }}>
                <p style={{ fontFamily: 'var(--font-jp)', fontSize: '18px' }}>{s.text}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-light)' }}>{new Date(s.timestamp).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const CreateDeckView: React.FC<{
  level: Level,
  onBack: () => void,
  onSaveDeck: (d: Deck) => void
}> = ({ level, onBack, onSaveDeck }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<Card[] | null>(null);
  const [deckName, setDeckName] = useState('');

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const cards = await generateDeckFromAi(prompt, level);
      setGeneratedCards(cards);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (!deckName || !generatedCards) return;
    onSaveDeck({
      id: Math.random().toString(36).substr(2, 9),
      name: deckName,
      level: level,
      type: 'kanji',
      cards: generatedCards,
      isCustom: true
    });
    onBack();
  };

  return (
    <div className="practice-container">
      <button className="btn btn-nav" onClick={onBack}><ArrowLeft size={16} /> Back</button>
      <h2 style={{ marginTop: '20px' }}><Sparkles /> Create with Sensei AI</h2>
      
      {!generatedCards ? (
        <div style={{ marginTop: '30px' }}>
          <p style={{ marginBottom: '15px' }}>Tell Sensei AI what kind of flashcards you want to create.</p>
          <textarea 
            placeholder='e.g., "Create a deck about family members for N5 level"'
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button className="btn btn-learnt" style={{ marginTop: '20px', width: '100%', justifyContent: 'center' }} onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? 'Sensei AI is creating...' : 'Generate Deck'}
          </button>
        </div>
      ) : (
        <div style={{ marginTop: '30px' }}>
          <h3>Review Generated Deck</h3>
          <div className="word-chips" style={{ marginTop: '20px' }}>
            {generatedCards.map((c, i) => (
              <div key={i} className="word-chip">{c.kanji} - {c.meaning}</div>
            ))}
          </div>
          <div style={{ marginTop: '30px' }}>
            <label style={{ display: 'block', marginBottom: '10px' }}>Deck Name:</label>
            <input 
              type="text" 
              className="ai-input" 
              style={{ width: '100%', border: '1px solid var(--border)', boxShadow: 'none' }}
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              placeholder="e.g., Family Words"
            />
          </div>
          <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
            <button className="btn btn-skip" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setGeneratedCards(null)}>Restart</button>
            <button className="btn btn-learnt" style={{ flex: 2, justifyContent: 'center' }} onClick={handleSave} disabled={!deckName}>Save Deck</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
