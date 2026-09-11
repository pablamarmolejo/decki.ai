import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { useAppContext } from '../AppContext';
import type { Deck, Flashcard, QuizQuestionType } from '../types';
import { getEffectiveState } from '../srs';
import schoolIcon from '../assets/ic_round-school.svg';
import clearIcon from '../assets/ic_round-clear.svg';
import checkIcon from '../assets/ic_round-check.svg';
import restoreIcon from '../assets/ic_round-restore.svg';

type QuizMode = 'MASTERY' | 'ACTIVE' | 'DECK';
type ResultView = 'complete' | 'early' | null;
type Question = { deckId: string; card: Flashcard; type: QuizQuestionType; options: string[]; answer: string };
const shuffle = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5);
const label = (type: QuizQuestionType) => type === 'MEANING_MC' ? 'Meaning' : 'Reading';
const instruction = (type: QuizQuestionType) => `Choose the correct ${label(type).toLowerCase()}`;

const Quiz: React.FC<{ onSessionChange: (active: boolean) => void; exitRequest: number }> = ({ onSessionChange, exitRequest }) => {
  const { decks, currentLevel, recordQuizResult } = useAppContext();
  const [mode, setMode] = useState<QuizMode | null>(null); const [count, setCount] = useState(10);
  const [types, setTypes] = useState<QuizQuestionType[]>(['MEANING_MC', 'READING_MC']);
  const [deckFilter, setDeckFilter] = useState<'default' | 'custom'>('default'); const [deckId, setDeckId] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]); const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null); const [checked, setChecked] = useState(false); const [hintUsed, setHintUsed] = useState(false); const [shownAt, setShownAt] = useState(0);
  const [results, setResults] = useState<{ question: Question; correct: boolean }[]>([]); const [resultView, setResultView] = useState<ResultView>(null); const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const handledExitRequest = useRef(exitRequest);
  const quizInProgress = questions.length > 0 && !resultView;
  const selectableDecks = decks.filter((deck) => deck.type === deckFilter && (deck.type === 'custom' || deck.level === currentLevel));
  useEffect(() => { if (!selectableDecks.some((deck) => deck.id === deckId)) setDeckId(selectableDecks[0]?.id ?? ''); }, [deckFilter, currentLevel, decks, deckId, selectableDecks]);
  useEffect(() => { onSessionChange(quizInProgress); }, [onSessionChange, quizInProgress]);
  useEffect(() => {
    if (exitRequest === handledExitRequest.current) return;
    handledExitRequest.current = exitRequest;
    if (quizInProgress) setLeaveConfirmOpen(true);
  }, [exitRequest, quizInProgress]);
  useEffect(() => { if (resultView === 'complete') confetti({ particleCount: 110, spread: 70, origin: { y: 0.65 } }); }, [resultView]);
  useEffect(() => () => onSessionChange(false), [onSessionChange]);

  const candidateCards = (chosenMode: QuizMode, chosenDeckId: string) => {
    // The due queue is deliberately evaluated when setup is rendered or submitted.
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    const pool = chosenMode === 'DECK' ? decks.filter((deck) => deck.id === chosenDeckId) : decks.filter((deck) => deck.level === currentLevel);
    return pool.flatMap((deck) => deck.cards.map((card) => ({ deck, card }))).filter(({ card }) => chosenMode === 'MASTERY' ? getEffectiveState(card) === 'learnt' : chosenMode === 'ACTIVE' ? getEffectiveState(card) === 'review' : true).filter(({ card }) => !card.next_review_due || new Date(card.next_review_due).valueOf() <= now).sort((a, b) => {
      const ratio = ({ card }: { card: Flashcard }) => !card.last_reviewed_at || !card.srs_interval ? Number.MAX_SAFE_INTEGER : (now - new Date(card.last_reviewed_at).valueOf()) / (card.srs_interval * 86_400_000);
      return ratio(b) - ratio(a);
    });
  };
  const buildQuestions = (cards: { deck: Deck; card: Flashcard }[]) => cards.map(({ deck, card }, i) => {
    const type = types[i % types.length]; const answer = type === 'MEANING_MC' ? card.meaning : (card.kana || card.kanji || '');
    const candidates = [...deck.cards.filter((item) => item.id !== card.id), ...decks.filter((item) => item.level === deck.level).flatMap((item) => item.cards).filter((item) => item.id !== card.id), ...decks.flatMap((item) => item.cards).filter((item) => item.id !== card.id)];
    const options = shuffle(candidates).map((item) => type === 'MEANING_MC' ? item.meaning : (item.kana || item.kanji || '')).filter((item, optionIndex, optionList) => item && item !== answer && optionList.indexOf(item) === optionIndex).slice(0, 3);
    while (options.length < 3) options.push(type === 'MEANING_MC' ? `Other meaning ${options.length + 1}` : `ほかのよみ ${options.length + 1}`);
    return { deckId: deck.id, card, type, answer, options: shuffle([answer, ...options]) };
  });
  const startQuiz = () => {
    if (!mode || !types.length) return;
    // eslint-disable-next-line react-hooks/purity
    const startedAt = Date.now();
    setQuestions(buildQuestions(candidateCards(mode, deckId).slice(0, Math.min(count, 20)))); setIndex(0); setResults([]); setResultView(null); setSelected(null); setChecked(false); setHintUsed(false); setShownAt(startedAt); setMode(null);
  };
  const question = questions[index];
  const check = () => { if (!question || !selected) return; const correct = selected === question.answer; const seconds = (Date.now() - shownAt) / 1000; const score: 0 | 1 | 2 | 3 = !correct ? 0 : hintUsed || seconds > 8 ? 1 : seconds < 3 ? 3 : 2; recordQuizResult(question.deckId, question.card.id, score); setResults((previous) => [...previous, { question, correct }]); setChecked(true); };
  const next = () => { if (index + 1 >= questions.length) { setResultView('complete'); return; } const nextShownAt = Date.now(); setIndex((value) => value + 1); setSelected(null); setChecked(false); setHintUsed(false); setShownAt(nextShownAt); };
  const backToQuiz = () => { setQuestions([]); setResults([]); setResultView(null); setIndex(0); setLeaveConfirmOpen(false); };
  const correctInfo = (card: Flashcard) => <div className="quiz-answer-detail"><strong>{card.kanji || card.kana}</strong><span>{card.kana}</span><span>{card.meaning}</span></div>;

  if (questions.length && resultView) {
    const correct = results.filter((result) => result.correct).length; const answered = results.length; const early = resultView === 'early';
    return <div className="quiz-session"><div className="quiz-results">{!early && <div className="title-section-icon quiz-success-icon">✓</div>}<h2>{early ? 'Quiz results' : 'Quiz complete!'}</h2>{early ? <><p className="quiz-score">{answered}</p><p className="quiz-answered-label">question{answered === 1 ? '' : 's'} answered</p></> : <><p className="quiz-score">{Math.round((correct / questions.length) * 100)}%</p><p className="quiz-correct-count">{correct} of {questions.length} correct</p></>}<div className="quiz-reviewed-list">{results.map(({ question: item, correct: wasCorrect }) => <div key={`${item.deckId}-${item.card.id}`}><span className="quiz-result-word">{item.card.kanji || item.card.kana} · {item.card.kana}</span><span className={`quiz-result-status ${wasCorrect ? 'quiz-correct' : 'quiz-incorrect'}`}><img src={wasCorrect ? checkIcon : restoreIcon} alt="" />{wasCorrect ? 'Correct' : 'Review again'}</span></div>)}</div><div className="quiz-actions"><button className="primary-btn modal-primary-btn" onClick={backToQuiz}>Start new quiz</button><button className="secondary-btn modal-secondary-btn" onClick={backToQuiz}>Back to Quiz</button></div></div></div>;
  }
  if (questions.length && question) return <div className="quiz-session"><button className="close-deck-btn quiz-exit" onClick={() => setLeaveConfirmOpen(true)}><img src={clearIcon} alt="Leave quiz" /></button><div className="quiz-question"><div className="quiz-progress">Question {index + 1} of {questions.length}</div><div className="quiz-type-label">{instruction(question.type)}</div><div className="quiz-prompt"><strong>{question.card.kanji || question.card.kana}</strong></div>{hintUsed && <p className="quiz-hint">Hint: {question.type === 'MEANING_MC' ? question.card.kana : question.card.meaning}</p>}<div className="quiz-options">{question.options.map((option) => <button key={option} disabled={checked} onClick={() => setSelected(option)} className={`quiz-option ${selected === option ? 'selected' : ''} ${checked && option === question.answer ? 'answer-correct' : ''} ${checked && selected === option && option !== question.answer ? 'answer-wrong' : ''}`}>{option}</button>)}</div>{checked && <div className={`quiz-feedback ${selected === question.answer ? 'correct' : 'wrong'}`}><strong>{selected === question.answer ? 'Correct!' : 'Not quite right…'}</strong>{correctInfo(question.card)}</div>}<div className="quiz-controls">{!checked && <button className="secondary-btn modal-secondary-btn" onClick={() => setHintUsed(true)} disabled={hintUsed}>Hint</button>}{checked ? <button className="primary-btn modal-primary-btn" onClick={next}>{index + 1 === questions.length ? 'View results' : 'Next question'}</button> : <button className="primary-btn modal-primary-btn" disabled={!selected} onClick={check}>Check answer</button>}</div></div>{leaveConfirmOpen && <div className="modal-overlay"><div className="confirmation-modal quiz-leave-modal"><h2>Leaving the quiz?</h2><p>Don’t worry, any questions answered before this will still count towards your progress</p><div className="quiz-actions"><button className="secondary-btn modal-secondary-btn" onClick={() => setLeaveConfirmOpen(false)}>Keep quizzing</button><button className="primary-btn modal-primary-btn" onClick={() => { setLeaveConfirmOpen(false); setResultView('early'); }}>Leave and see results</button></div></div></div>}</div>;

  const cards = [{ mode: 'MASTERY' as const, title: 'Mastery check', description: "Test words you've already learned to keep them sharp" }, { mode: 'ACTIVE' as const, title: 'Active practice', description: "Get quizzed on the words you're currently building memory on" }, { mode: 'DECK' as const, title: 'Deck quiz', description: 'Choose any deck to test your knowledge on all its cards' }];
  const noCards = mode ? candidateCards(mode, deckId).length === 0 : false;
  return <div className="quiz-page"><div className="page-title-row"><div className="title-section-icon"><img src={schoolIcon} alt="" /></div><div className="title-content"><h2 className="page-title-text">Quiz</h2><p className="page-subtitle-text">Test your knowledge and build lasting memory</p></div></div><div className="quiz-option-grid">{cards.map((item) => <button key={item.mode} className="quiz-mode-card" onClick={() => setMode(item.mode)}><div className="quiz-mode-icon">{item.mode === 'MASTERY' ? '★' : item.mode === 'ACTIVE' ? '↻' : '▤'}</div><h3>{item.title}</h3><p>{item.description}</p><span>Set up quiz →</span></button>)}</div>{mode && <div className="modal-overlay" onClick={() => setMode(null)}><div className="quiz-setup-modal" onClick={(event) => event.stopPropagation()}><h2>{cards.find((item) => item.mode === mode)?.title}</h2><p>Choose how you would like to be quizzed.</p>{mode === 'DECK' && <><label>Deck type</label><div className="quiz-filter"><button className={deckFilter === 'default' ? 'active' : ''} onClick={() => setDeckFilter('default')}>Default</button><button className={deckFilter === 'custom' ? 'active' : ''} onClick={() => setDeckFilter('custom')}>Custom</button></div><label htmlFor="quiz-deck">Deck</label><select id="quiz-deck" value={deckId} onChange={(event) => setDeckId(event.target.value)}>{selectableDecks.map((deck) => <option value={deck.id} key={deck.id}>{deck.type === 'default' ? `${deck.level} · ` : ''}{deck.name}</option>)}</select></>}<label>Question types</label>{(['MEANING_MC', 'READING_MC'] as QuizQuestionType[]).map((type) => <label className="quiz-check" key={type}><input type="checkbox" checked={types.includes(type)} onChange={() => setTypes((value) => value.includes(type) ? value.filter((entry) => entry !== type) : [...value, type])} />{label(type)}</label>)}<label>Questions</label><div className="quiz-lengths">{[5, 10, 15, 20].map((value) => <button className={count === value ? 'active' : ''} onClick={() => setCount(value)} key={value}>{value}</button>)}</div>{noCards && <div className="quiz-empty"><span className="quiz-info-icon">i</span><span>No eligible cards yet. Mark cards as learnt or still learning, or choose another deck.</span></div>}<div className="quiz-actions"><button className="secondary-btn modal-secondary-btn" onClick={() => setMode(null)}>Cancel</button><button className="primary-btn modal-primary-btn" disabled={!types.length || noCards} onClick={startQuiz}>Start quiz</button></div></div></div>}</div>;
};
export default Quiz;
