import React, { useState, useEffect, useMemo } from 'react';
import { Level, Deck, Card, CardState, UserProgress, Sentence, AiAssistExample, SentenceFeedback } from './types';
import n5_kanji from './data/n5_kanji.json';
import n4_kanji from './data/n4_kanji.json';
import n3_kanji from './data/n3_kanji.json';
import { 
  Book, Edit3, Award, Plus, ChevronLeft, ChevronRight, Check, 
  RefreshCw, X, MessageSquare, Sparkles, ArrowLeft, Trash2, 
  Undo2, Pencil, Shuffle, RotateCcw, ChevronDown, ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateDeckFromAi, getSentenceFeedback, getAiAssist } from './services/ai';

// Mock empty data for missing levels
const emptyData: any[] = [];

const Logo: React.FC<{ size?: number }> = ({ size = 34 }) => (
  <svg width={size} height={size} viewBox="123 21 35 33" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
    <path fillRule="evenodd" clipRule="evenodd" d="M130.459 45.2722C130.508 45.9771 131.096 46.3838 131.772 46.1804L149.664 40.7946L149.944 44.8415C149.993 45.5466 149.484 46.2831 148.808 46.487L126.051 53.3357C125.374 53.5392 124.786 53.1333 124.737 52.4284L123.844 39.4929C123.795 38.7879 124.304 38.0513 124.981 37.8474L129.845 36.3835L130.459 45.2722Z" fill="#060543"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M155.096 21.3928C155.773 21.1891 156.362 21.5951 156.411 22.3L157.304 35.2356C157.353 35.9408 156.843 36.6774 156.167 36.8811L133.411 43.7297C132.734 43.9334 132.146 43.5274 132.097 42.8225L131.204 29.8869C131.155 29.1819 131.664 28.4453 132.34 28.2414L155.096 21.3928ZM149.523 27.1037C149.407 27.1038 149.308 27.1859 149.279 27.2981C149.167 27.7267 148.961 28.1606 148.662 28.5989C148.323 29.0906 147.902 29.5122 147.397 29.8635C146.958 30.1676 146.501 30.3874 146.027 30.5227C145.915 30.5547 145.835 30.6554 145.835 30.7717C145.835 30.8902 145.919 30.9911 146.033 31.0227C146.516 31.1556 147 31.4054 147.483 31.7707C148.039 32.186 148.467 32.6367 148.767 33.1223C149.02 33.5266 149.192 33.908 149.282 34.2668C149.31 34.3793 149.408 34.463 149.524 34.4631C149.64 34.4631 149.738 34.3788 149.766 34.2658C149.856 33.9019 150.028 33.5176 150.282 33.1125C150.486 32.7867 150.748 32.4767 151.068 32.1828C151.387 31.8827 151.732 31.6236 152.102 31.4065C152.409 31.2297 152.708 31.1012 152.998 31.0217C153.111 30.9904 153.195 30.8897 153.195 30.7717C153.195 30.6555 153.114 30.5558 153.002 30.5246C152.544 30.3976 152.094 30.1771 151.652 29.8635C151.313 29.6208 151.007 29.3493 150.732 29.0491C150.464 28.7425 150.243 28.4231 150.071 28.091C149.934 27.8221 149.833 27.5589 149.768 27.302C149.74 27.1882 149.64 27.1037 149.523 27.1037Z" fill="#5856EB"/>
  </svg>
);

const INITIAL_PROGRESS: UserProgress = {
  learntCards: {},
  reviewCards: {},
  sentences: [],
  customDecks: []
};

const App: React.FC = () => {
  const [level, setLevel] = useState<Level>('N5');
  const [activeTab, setActiveTab] = useState<'study' | 'mastery'>('study');
  const [view, setView] = useState<'home' | 'deck' | 'create' | 'edit'>('home');
  const [activeDeck, setActiveDeck] = useState<Deck | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [progress, setProgress] = useState<UserProgress>(() => {
    const saved = localStorage.getItem('decki_progress');
    return saved ? JSON.parse(saved) : INITIAL_PROGRESS;
  });

  useEffect(() => {
    localStorage.setItem('decki_progress', JSON.stringify(progress));
  }, [progress]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const defaultDecks: Deck[] = useMemo(() => ([
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
  ] as Deck[]).filter(d => d.cards.length > 0 || d.type === 'kanji'), [level]);

  const visibleDecks = [...defaultDecks, ...progress.customDecks.filter(d => d.level === level)];

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

  const goBack = () => { setView('home'); setActiveDeck(null); };

  const handleSaveDeck = (deck: Deck, isUpdate = false) => {
    setProgress(prev => {
      const decks = isUpdate ? prev.customDecks.map(d => d.id === deck.id ? deck : d) : [...prev.customDecks, deck];
      return { ...prev, customDecks: decks };
    });
    showNotification(isUpdate ? "Deck updated successfully!" : "Deck created successfully!");
    goBack();
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <a href="#" className="logo" onClick={(e) => { e.preventDefault(); setActiveTab('study'); goBack(); }}>
          <Logo /> decki.ai
        </a>
        <div className="level-selector">
          {(['N5', 'N4', 'N3', 'N2', 'N1'] as Level[]).map(l => (
            <button key={l} className={`level-btn ${level === l ? 'active' : ''}`} onClick={() => { setLevel(l); goBack(); }}>{l}</button>
          ))}
        </div>
        <div className="header-nav" />
      </header>

      <main className="main-content">
        <div className="section-select">
          <div className={`section-select-item ${activeTab === 'study' ? 'active' : ''}`} onClick={() => { setActiveTab('study'); setView('home'); }}>Study decks</div>
          <div className={`section-select-item ${activeTab === 'mastery' ? 'active' : ''}`} onClick={() => setActiveTab('mastery')}>Mastery practice</div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'study' ? (
            <StudyTab 
              key="study" view={view} level={level} visibleDecks={visibleDecks} activeDeck={activeDeck} 
              getDeckStats={getDeckStats} openDeck={(d: Deck) => { setActiveDeck(d); setView('deck'); }}
              onEditDeck={(d: Deck) => { setActiveDeck(d); setView('edit'); }} setView={setView} onBack={goBack} 
              onMark={markCard} progress={progress} onSaveDeck={handleSaveDeck} 
              onDeleteDeck={(id: string) => { setProgress(prev => ({ ...prev, customDecks: prev.customDecks.filter(d => d.id !== id) })); showNotification("Deck deleted."); goBack(); }} 
              onResetDeck={(deck: Deck) => {
                setProgress(prev => {
                  const nextLearnt = { ...prev.learntCards }; const nextReview = { ...prev.reviewCards };
                  deck.cards.forEach(c => { const key = getCardKey(deck.id, c.kanji); delete nextLearnt[key]; delete nextReview[key]; });
                  return { ...prev, learntCards: nextLearnt, reviewCards: nextReview };
                });
              }}
            />
          ) : (
            <PracticeView 
              key="practice" level={level} allDecks={[...defaultDecks, ...progress.customDecks]} progress={progress} 
              onBack={() => setActiveTab('study')} onSaveSentence={(s: Sentence) => setProgress(prev => ({ ...prev, sentences: [...prev.sentences, s] }))}
              onRemoveSentence={(id: string) => setProgress(prev => ({ ...prev, sentences: prev.sentences.filter(s => s.id !== id) }))}
            />
          )}
        </AnimatePresence>
      </main>

      <footer className="app-footer">
        <a href="#" className="footer-logo"><Logo size={24} /> decki.ai</a>
        <div className="copyright">© 2026 decki.ai. All rights reserved.</div>
      </footer>

      {notification && <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="notification">{notification}</motion.div>}
    </div>
  );
};

const FuriganaText: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;
  const parts = text.split(/(\[.*?\])/g);
  const result: React.ReactNode[] = [];
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].startsWith('[') && parts[i].endsWith(']') && i > 0) {
      const reading = parts[i].slice(1, -1);
      const kanji = result.pop() as string;
      result.push(<span key={i} className="furigana"><span className="rt">{reading}</span><span>{kanji}</span></span>);
    } else { result.push(parts[i]); }
  }
  return <>{result}</>;
};

const StudyTab: React.FC<any> = ({ view, level, visibleDecks, activeDeck, getDeckStats, openDeck, onEditDeck, setView, onBack, onMark, progress, onSaveDeck, onDeleteDeck, onResetDeck }) => {
  if (view === 'deck' && activeDeck) return <DeckView deck={activeDeck} progress={progress} onBack={onBack} onMark={onMark} onReset={() => onResetDeck(activeDeck)} />;
  if (view === 'create') return <CreateDeckView level={level} onBack={onBack} onSaveDeck={onSaveDeck} />;
  if (view === 'edit' && activeDeck) return <ReviewDeckView initialDeck={activeDeck} level={level} onBack={onBack} onSaveDeck={(d: any) => onSaveDeck(d, true)} onDeleteDeck={() => onDeleteDeck(activeDeck.id)} />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="section-header"><h2 className="section-title">Study Decks</h2></div>
      <div className="decks-grid">
        {visibleDecks.map((deck: any) => {
          const stats = getDeckStats(deck);
          return (
            <div key={deck.id} className="card" onClick={() => openDeck(deck)}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div><div className="card-title">{deck.name}</div><div className="card-subtitle">{deck.isCustom ? 'Custom' : level}</div></div>
                {deck.isCustom && <button className="btn-ghost" onClick={(e) => { e.stopPropagation(); onEditDeck(deck); }}><Pencil size={18} /></button>}
              </div>
              <div className="card-footer"><div className="progress-container"><div className="progress-bar" style={{ width: `${(stats.learnt/stats.total)*100}%` }} /></div><div className="card-subtitle">{stats.learnt}/{stats.total} learnt</div></div>
            </div>
          );
        })}
      </div>
      <div className="card ai-card" style={{ marginTop: '48px' }} onClick={() => setView('create')}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}><Sparkles size={32} /><div><div className="card-title">Create with Sensei AI</div><div className="card-subtitle">Build custom decks with Gemini AI.</div></div></div>
      </div>
    </motion.div>
  );
};

const DeckView: React.FC<any> = ({ deck, progress, onBack, onMark, onReset }) => {
  const [cards, setCards] = useState([...deck.cards]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);

  const currentCard = cards[currentIndex];
  const currentState = progress.learntCards[`${deck.id}_${currentCard.kanji}`] ? 'learnt' : progress.reviewCards[`${deck.id}_${currentCard.kanji}`] ? 'review' : 'neutral';

  const handleMark = (state: CardState) => {
    onMark(deck.id, currentCard.kanji, state);
    setFlipped(false);
    if (state === 'review') {
      const next = [...cards]; const [item] = next.splice(currentIndex, 1); next.push(item); setCards(next);
    } else if (currentIndex < cards.length - 1) {
      setTimeout(() => setCurrentIndex(i => i + 1), 300);
    } else { setShowCompletion(true); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flashcard-view">
      <div className="section-header" style={{ width: '100%' }}>
        <button className="btn btn-ghost" onClick={onBack}><ChevronLeft size={20} /> Back</button>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={() => { setCards([...cards].sort(() => Math.random() - 0.5)); setCurrentIndex(0); }}><Shuffle size={16} /> Shuffle</button>
          <button className="btn btn-secondary" onClick={() => { onReset(); setCards([...deck.cards]); setCurrentIndex(0); }}><RotateCcw size={16} /> Reset</button>
        </div>
      </div>
      <div className="flashcard-container" onClick={() => setFlipped(!flipped)}>
        <div className={`flashcard ${flipped ? 'flipped' : ''}`}>
          <div className="flashcard-front">
            <div className="card-subtitle">{currentIndex + 1} / {cards.length}</div>
            <div className="flashcard-content">{currentCard.kanji}</div>
            <div className="flashcard-reading">{currentCard.kana}</div>
            {currentState !== 'neutral' && <div style={{ position: 'absolute', top: '24px', right: '24px' }}>{currentState === 'learnt' ? <Check color="var(--success-text)" /> : <RefreshCw color="var(--warning-text)" />}</div>}
          </div>
          <div className="flashcard-back">
            <div className="flashcard-meaning">{currentCard.meaning}</div>
            <div className="card" style={{ background: 'var(--grey-bg)', padding: '16px' }}><FuriganaText text={currentCard.furiganaExample || currentCard.example} /></div>
          </div>
        </div>
      </div>
      <div className="flashcard-actions" style={{ marginTop: '32px' }}>
        <button className="btn btn-review" onClick={() => handleMark('review')}>Review</button>
        <button className="btn btn-skip" onClick={() => setCurrentIndex((currentIndex + 1) % cards.length)}>Skip</button>
        <button className="btn btn-learnt" onClick={() => handleMark('learnt')}>Learnt</button>
      </div>
      {showCompletion && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ maxWidth: '400px', textAlign: 'center', padding: '40px' }}>
            <Award size={64} color="var(--warning-text)" /><h2>Mastered!</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
              <button className="btn btn-primary" onClick={onBack}>Study Decks</button>
              <button className="btn btn-secondary" onClick={() => { setShowCompletion(false); onReset(); setCurrentIndex(0); }}>Restart</button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

const CreateDeckView: React.FC<any> = ({ level, onBack, onSaveDeck }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try { 
      const res = await generateDeckFromAi(prompt, level); 
      setResult(res); 
    } catch (err: any) { 
      console.error(err); 
      showNotification(err.message || "Failed to generate deck. Please try again.");
    } finally { 
      setIsGenerating(false); 
    }
  };

  if (result) return <ReviewDeckView initialDeck={{ id: 'temp', name: '', level: result.targetLevel, cards: result.cards }} onBack={() => setResult(null)} onSaveDeck={onSaveDeck} onDeleteDeck={onBack} />;

  return (
    <div className="practice-area" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <button className="btn btn-ghost" onClick={onBack}><ArrowLeft size={18} /> Back</button>
      <h2 className="section-title">Sensei AI Deck Creator</h2>
      <textarea className="practice-input" placeholder="e.g., Japanese for cooking, 15 cards" value={prompt} onChange={e => setPrompt(e.target.value)} />
      <button className="btn btn-primary" style={{ width: '100%', marginTop: '24px' }} onClick={handleGenerate} disabled={isGenerating}>{isGenerating ? 'Sensei is working...' : 'Generate'}</button>
    </div>
  );
};

const ReviewDeckView: React.FC<any> = ({ initialDeck, onBack, onSaveDeck, onDeleteDeck }) => {
  const [name, setName] = useState(initialDeck.name);
  const [cards, setCards] = useState([...initialDeck.cards]);
  const [lastRemoved, setLastRemoved] = useState<any>(null);

  return (
    <div className="practice-area" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <button className="btn btn-ghost" onClick={onBack}><ArrowLeft size={18} /> Review</button>
      <input type="text" className="practice-input" style={{ minHeight: 'auto', marginBottom: '24px' }} value={name} onChange={e => setName(e.target.value)} placeholder="Deck Name" />
      <div className="word-pills">
        {cards.map((c, i) => (
          <div key={i} className="word-pill">{c.kanji} - {c.meaning}<button onClick={() => { setLastRemoved({c, i}); setCards(cards.filter((_, idx) => idx !== i)); }}><X size={14} /></button></div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '12px' }}>
        {lastRemoved && <button className="btn btn-secondary" onClick={() => { const n = [...cards]; n.splice(lastRemoved.i, 0, lastRemoved.c); setCards(n); setLastRemoved(null); }}>Undo</button>}
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => onSaveDeck({ ...initialDeck, name, cards, id: initialDeck.id === 'temp' ? Math.random().toString(36).substr(2,9) : initialDeck.id, isCustom: true })}>Save Deck</button>
        {initialDeck.id !== 'temp' && <button className="btn btn-secondary" onClick={() => { if(confirm("Delete deck?")) onDeleteDeck(); }}><Trash2 size={18} /></button>}
      </div>
    </div>
  );
};

const PracticeView: React.FC<any> = ({ level, allDecks, progress, onSaveSentence, onRemoveSentence }) => {
  const [selectedWord, setSelectedWord] = useState<Card | null>(null);
  const [sentenceText, setSentenceText] = useState('');
  const [assist, setAssist] = useState<any>(null);
  const [feedback, setFeedback] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const learntWords = useMemo(() => {
    const m = new Map(); allDecks.forEach((d:any) => d.cards.forEach((c:any) => { if (progress.learntCards[`${d.id}_${c.kanji}`]) m.set(c.kanji, c); }));
    return Array.from(m.values());
  }, [allDecks, progress.learntCards]);

  const practicedWords = new Set(progress.sentences.map((s: Sentence) => s.word));

  const handleAiAssist = async () => {
    if (!selectedWord) return;
    setIsAiLoading(true); 
    try { 
      const res = await getAiAssist(selectedWord.kanji, level); 
      setAssist(res); 
    } catch(e: any) { 
      console.error(e);
      alert("Sensei AI Error: " + (e.message || "Failed to get assistance. Please check your API key and connection."));
    } finally { 
      setIsAiLoading(false); 
    }
  };

  const handleSubmit = async () => {
    if (!selectedWord) return;
    setIsAiLoading(true);
    try {
      const usedAssist = assist?.examples.some((e:any) => e.kanji === sentenceText) || false;
      const res = await getSentenceFeedback(sentenceText, selectedWord.kanji, usedAssist, level);
      setFeedback(res);
      if (res.isCoherent) {
        onSaveSentence({ id: Math.random().toString(36).substr(2,9), word: selectedWord.kanji, kanjiText: sentenceText, aiFeedback: res, timestamp: Date.now(), usedAssist });
        setSentenceText(''); setAssist(null);
      } else if (res.examples) { setAssist({ explanation: "Sensei found that confusing. Try these:", examples: res.examples }); }
    } catch(e: any) { 
      console.error(e);
      alert("Sensei AI Error: " + (e.message || "Failed to get feedback. Please check your API key and connection."));
    } finally { 
      setIsAiLoading(false); 
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="section-header"><h2 className="section-title">Mastery Practice</h2><div className="card-subtitle">{learntWords.length} learnt</div></div>
      <div className="mastery-layout">
        <div className="word-list" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {learntWords.map((c, i) => (
            <div key={i} className={`word-card ${selectedWord?.kanji === c.kanji ? 'active' : ''} ${practicedWords.has(c.kanji) ? 'used' : ''}`} onClick={() => { setSelectedWord(c); setFeedback(null); setAssist(null); setSentenceText(''); }}>
              <div><div className="card-title" style={{ fontSize: '18px' }}>{c.kanji}</div><div className="card-subtitle">{c.kana}</div></div>
              {practicedWords.has(c.kanji) && <Check size={18} className="used-icon" />}
            </div>
          ))}
        </div>
        <div className="practice-area">
          {selectedWord ? (
            <>
              <div className="word-details">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div><div className="card-title">{selectedWord.kanji}</div><div className="card-subtitle">{selectedWord.meaning}</div></div>
                  <button className="btn btn-secondary" onClick={handleAiAssist} disabled={isAiLoading}><Sparkles size={16} /> Assist</button>
                </div>
              </div>
              {assist && <div className="fade-in" style={{ marginBottom: '24px' }}>
                <div className="card-subtitle" style={{ fontWeight: 600 }}>{assist.explanation}</div>
                {assist.examples.map((ex:any, i:number) => (
                  <div key={i} className="assist-card" style={{ marginTop: '8px' }} onClick={() => setSentenceText(ex.kanji)}><strong>{ex.kanji}</strong> ({ex.kana})<br/><i>{ex.english}</i></div>
                ))}
              </div>}
              <textarea className="practice-input" placeholder="Type sentence..." value={sentenceText} onChange={e => setSentenceText(e.target.value)} />
              <button className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }} onClick={handleSubmit} disabled={isAiLoading || !sentenceText}>{isAiLoading ? 'Evaluating...' : 'Submit'}</button>
              {feedback && feedback.isCoherent && <div className="fade-in card" style={{ marginTop: '24px', background: 'var(--grey-bg)' }}>
                <strong>{feedback.acknowledgement}</strong><p>{feedback.grammar}</p><p>{feedback.suggestions}</p>
              </div>}
              <div style={{ marginTop: '40px' }}>
                {progress.sentences.filter((s:any) => s.word === selectedWord.kanji).reverse().map((s:any) => (
                  <div key={s.id} className="card" style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div><strong>{s.kanjiText}</strong><div className="card-subtitle">{new Date(s.timestamp).toLocaleDateString()}</div></div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-ghost" onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}>{expandedId === s.id ? <ChevronUp /> : <ChevronDown />}</button>
                        <button className="btn-ghost" onClick={() => onRemoveSentence(s.id)}><Trash2 size={18} /></button>
                      </div>
                    </div>
                    {expandedId === s.id && <div className="fade-in" style={{ marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>{s.aiFeedback.grammar}</div>}
                  </div>
                ))}
              </div>
            </>
          ) : <div style={{ textAlign: 'center', padding: '40px' }}><Edit3 size={48} style={{ opacity: 0.2 }} /><p>Select a word to start</p></div>}
        </div>
      </div>
    </motion.div>
  );
};

export default App;
