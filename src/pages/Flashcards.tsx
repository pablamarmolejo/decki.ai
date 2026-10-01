import React, { useState } from 'react';
import { useAppContext } from '../AppContext';
import type { Flashcard, FlashcardState, DeckStudySettings } from '../types';
import { DEFAULT_DECK_STUDY_SETTINGS } from '../types';
import leftArrow from '../assets/ic_round-keyboard-arrow-left.svg';
import rightArrow from '../assets/ic_round-keyboard-arrow-right.svg';
import checkIcon from '../assets/ic_round-check.svg';
import restoreIcon from '../assets/ic_round-restore.svg';
import eventsIcon from '../assets/ic_round-emoji-events.svg';
import clearIcon from '../assets/ic_round-clear.svg';
import confetti from 'canvas-confetti';

interface FlashcardsProps {
  deckId: string;
  settings?: DeckStudySettings;
  onBack: () => void;
  onNavigateToMastery: () => void;
}

const Flashcards: React.FC<FlashcardsProps> = ({ deckId, settings, onBack, onNavigateToMastery }) => {
  const { decks, updateFlashcardState } = useAppContext();
  const deck = decks.find(d => d.id === deckId);
  const studySettings = settings || DEFAULT_DECK_STUDY_SETTINGS;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [shuffledCards, setShuffledCards] = useState<Flashcard[]>(() => {
    if (!deck) return [];
    return studySettings.shuffle
      ? [...deck.cards].sort(() => Math.random() - 0.5)
      : [...deck.cards];
  });
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Sync and reset cards when deckId or settings change
  React.useEffect(() => {
    if (deck) {
      const cards = studySettings.shuffle
        ? [...deck.cards].sort(() => Math.random() - 0.5)
        : [...deck.cards];
      setShuffledCards(cards);
      setCurrentIndex(0);
      setIsFlipped(false);
    }
  }, [deckId, settings]);

  const allLearnt = shuffledCards.length > 0 && shuffledCards.every(c => c.state === 'learnt');
  const isKanjiDeck = Boolean(deck?.type === 'default' && deck?.name.toLowerCase().includes('kanji'));
  const totalSlots = allLearnt ? shuffledCards.length + 1 : shuffledCards.length;
  const isCompletionSlot = allLearnt && currentIndex === shuffledCards.length;

  React.useEffect(() => {
    if (allLearnt && !isTransitioning && currentIndex === shuffledCards.length) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ff0000', '#ffd700', '#228b22', '#0000ff', '#ff69b4', '#800080', '#ffa500']
      });
    }
  }, [allLearnt, isTransitioning, currentIndex, shuffledCards.length]);

  // All refs and their update effects must come before any early return
  const handlersRef = React.useRef({
    handleNext: () => {},
    handlePrev: () => {},
    handleSetState: (_state: FlashcardState) => {},
    setIsFlipped,
    onBack,
    isTransitioning,
    isCompletionSlot,
  });

  const currentCard = shuffledCards[currentIndex];

  const handleNext = () => {
    if (totalSlots === 0 || isTransitioning) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % totalSlots);
  };

  const handlePrev = () => {
    if (totalSlots === 0 || isTransitioning) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + totalSlots) % totalSlots);
  };

  const handleSetState = (state: FlashcardState) => {
    if (!currentCard || isTransitioning || isCompletionSlot) return;
    
    setIsTransitioning(true);
    
    // Toggle state logic: if clicking the same state, remove it
    const finalState = currentCard.state === state ? 'to-be-learnt' : state;
    updateFlashcardState(deckId, currentCard.id, finalState);
    
    const updatedCards = [...shuffledCards];
    updatedCards[currentIndex] = { ...currentCard, state: finalState };
    setShuffledCards(updatedCards);

    const isNowAllLearnt = updatedCards.every(c => c.state === 'learnt');

    setTimeout(() => {
      if (isNowAllLearnt) {
        // Automatically move to completion slot
        setCurrentIndex(updatedCards.length);
      } else if (finalState === 'learnt') {
        // Find next card that isn't learnt yet — search forward
        let nextIndex = updatedCards.findIndex((c, i) => i > currentIndex && c.state !== 'learnt');
        // If not found forward, search from the beginning
        if (nextIndex === -1) {
          nextIndex = updatedCards.findIndex((c) => c.state !== 'learnt');
        }
        if (nextIndex !== -1) {
          setCurrentIndex(nextIndex);
        }
      } else {
        // If we just marked it as 'review' or removed state, just move to the next card normally
        setCurrentIndex((prev) => (prev + 1) % updatedCards.length);
      }
      
      setIsFlipped(false);
      setIsTransitioning(false);
    }, 600);
  };

  // Keep ref in sync with latest handlers/state so the keydown listener always uses fresh values
  React.useEffect(() => {
    handlersRef.current = {
      handleNext,
      handlePrev,
      handleSetState,
      setIsFlipped,
      onBack,
      isTransitioning,
      isCompletionSlot,
    };
  });

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      const { onBack, isTransitioning, isCompletionSlot, handleNext, handlePrev, handleSetState, setIsFlipped } = handlersRef.current;

      if (e.key === 'Escape') {
        e.preventDefault();
        onBack();
        return;
      }

      if (isTransitioning) return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        if (!isCompletionSlot) {
          setIsFlipped((prev) => !prev);
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (!isCompletionSlot) {
          handleSetState('learnt');
        }
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        if (!isCompletionSlot) {
          handleSetState('review');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (!deck) return <div className="flashcards-mode-view">Deck not found</div>;

  const isKanjiCard = Boolean(currentCard?.kun || currentCard?.on || isKanjiDeck);

  return (
    <div className="flashcards-mode-view">
      {!isCompletionSlot && (
        <div className="flashcards-shortcuts-legend">
          <div className="shortcut-chip">
            <kbd className="shortcut-key">Left</kbd>
            <kbd className="shortcut-key">Right</kbd>
            <span className="shortcut-action">Navigate</span>
          </div>
          <div className="shortcut-chip">
            <kbd className="shortcut-key">Space</kbd>
            <span className="shortcut-action">Flip</span>
          </div>
          <div className="shortcut-chip">
            <kbd className="shortcut-key">Enter</kbd>
            <span className="shortcut-action">Learnt</span>
          </div>
          <div className="shortcut-chip">
            <kbd className="shortcut-key">Backspace</kbd>
            <span className="shortcut-action">Still learning</span>
          </div>
          <div className="shortcut-chip">
            <kbd className="shortcut-key">Esc</kbd>
            <span className="shortcut-action">Close</span>
          </div>
        </div>
      )}

      <div className="flashcards-mode-header">
        <button className="close-deck-btn" disabled={isTransitioning} onClick={onBack}>
          <img src={clearIcon} alt="Close" />
        </button>
      </div>

      <div className="flashcards-main-container">
        <button className="nav-arrow-btn left" disabled={isTransitioning} onClick={handlePrev}>
          <img src={leftArrow} alt="Previous" />
        </button>
        
        <div className={`flashcard-item ${isFlipped ? 'flipped' : ''} ${isTransitioning ? 'transitioning' : ''} ${isCompletionSlot ? 'completion-card' : ''}`}>
          {isCompletionSlot ? (
            <div className="card-face" style={{ 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '16px', 
              textAlign: 'center',
              position: 'relative'
            }}>
              <div className="title-section-icon" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#d2edd7' }}>
                <img 
                  src={eventsIcon} 
                  alt="" 
                  style={{ 
                    width: '26px', 
                    height: '26px',
                    filter: 'brightness(0) saturate(100%) invert(38%) sepia(58%) saturate(541%) hue-rotate(83deg) brightness(93%) contrast(88%)' // #297a39
                  }} 
                />
              </div>
              <div style={{
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#060543'
              }}>
                Well done!
              </div>
              <div style={{
                width: '247px',
                flexGrow: 0,
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: '14px',
                fontWeight: '500',
                color: '#2f2f3b',
                textAlign: 'center'
              }}>
                Great, you have completed this deck!
              </div>
              <div className="congrats-actions" style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                <button 
                  className="primary-btn congrats-mastery-btn" 
                  onClick={onNavigateToMastery}
                  style={{ 
                    height: '44px', 
                    display: 'flex', 
                    flexDirection: 'row', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    gap: '8px', 
                    padding: '13px 24px', 
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: '16px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    color: '#fcfcfc',
                    lineHeight: '1'
                  }}>
                    Practice
                  </span>
                </button>
                <button 
                  className="secondary-btn" 
                  onClick={onBack}
                  style={{ 
                    height: '44px', 
                    display: 'flex', 
                    flexDirection: 'row', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    gap: '8px', 
                    padding: '13px 24px', 
                    borderRadius: '8px',
                    backgroundColor: '#f4f4f7',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: '16px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    color: '#060543',
                    lineHeight: '1'
                  }}>
                    Back to decks
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <div className="card-content-wrapper" onClick={() => !isTransitioning && setIsFlipped(!isFlipped)}>
              <div className="card-face card-front-face">
                <div className="card-counter">
                  {currentIndex + 1}/{shuffledCards.length}
                </div>
                {(currentCard?.state === 'learnt' || currentCard?.state === 'review') && (
                  <div className={`card-state-badge ${currentCard.state} ${isTransitioning ? 'pop' : ''}`}>
                    {currentCard.state === 'learnt' ? 'I know this' : 'Still learning'}
                  </div>
                )}
                {currentCard?.type && <div className="card-word-type">{currentCard.type}</div>}
                
                {currentCard?.kanji ? (
                  <>
                    <div className="card-kanji-display">{currentCard.kanji}</div>
                    {studySettings.frontKana && currentCard.kana && (
                      <div className="card-kana-display">{currentCard.kana}</div>
                    )}
                    {studySettings.frontMeaning && currentCard.meaning && (
                      <div className="card-meaning-front-display">{currentCard.meaning}</div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="card-kanji-display">{currentCard?.kana}</div>
                    {studySettings.frontMeaning && currentCard?.meaning && (
                      <div className="card-meaning-front-display">{currentCard.meaning}</div>
                    )}
                  </>
                )}
              </div>
              <div className="card-face card-back-face">
                {(currentCard?.state === 'learnt' || currentCard?.state === 'review') && (
                  <div className={`card-state-badge ${currentCard.state} ${isTransitioning ? 'pop' : ''}`}>
                    {currentCard.state === 'learnt' ? 'I know this' : 'Still learning'}
                  </div>
                )}
                
                {studySettings.backMeaning && currentCard?.meaning && (
                  <div className="card-back-section">
                    <div className="section-label">MEANING</div>
                    <div className="card-meaning-display">{currentCard.meaning}</div>
                  </div>
                )}

                {studySettings.backKana && (
                  isKanjiCard ? (
                    <>
                      <div className="card-back-section">
                        <div className="section-label">KUN-READING</div>
                        <div className="card-detail">{currentCard?.kun || '-'}</div>
                      </div>
                      <div className="card-back-section">
                        <div className="section-label">ON-READING</div>
                        <div className="card-detail">{currentCard?.on || '-'}</div>
                      </div>
                    </>
                  ) : (
                    currentCard?.kana ? (
                      <div className="card-back-section">
                        <div className="section-label">READING</div>
                        <div className="card-detail">{currentCard.kana}</div>
                      </div>
                    ) : null
                  )
                )}

                {currentCard?.example && (
                  <div className="card-back-section example-section">
                    <div className="section-label">EXAMPLE</div>
                    <div className="card-example-display">{currentCard.example}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <button className="nav-arrow-btn right" disabled={isTransitioning} onClick={handleNext}>
          <img src={rightArrow} alt="Next" />
        </button>
      </div>

      {!isCompletionSlot && (
        <div className="flashcard-state-actions">
          <button className="state-btn review" disabled={isTransitioning} onClick={() => handleSetState('review')}>
            Still learning
            <img src={restoreIcon} alt="" className="btn-icon" />
          </button>
          <button className="state-btn learnt" disabled={isTransitioning} onClick={() => handleSetState('learnt')}>
            I know this
            <img src={checkIcon} alt="" className="btn-icon" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Flashcards;
