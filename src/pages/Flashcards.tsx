import React, { useState } from 'react';
import { useAppContext } from '../AppContext';
import type { Flashcard, FlashcardState } from '../types';
import leftArrow from '../assets/ic_round-keyboard-arrow-left.svg';
import rightArrow from '../assets/ic_round-keyboard-arrow-right.svg';
import checkIcon from '../assets/ic_round-check.svg';
import restoreIcon from '../assets/ic_round-restore.svg';
import refreshIcon from '../assets/ic_round-refresh.svg';
import eventsIcon from '../assets/ic_round-emoji-events.svg';
import clearIcon from '../assets/ic_round-clear.svg';
import confetti from 'canvas-confetti';

interface FlashcardsProps {
  deckId: string;
  onBack: () => void;
  onNavigateToMastery: () => void;
}

const Flashcards: React.FC<FlashcardsProps> = ({ deckId, onBack, onNavigateToMastery }) => {
  const { decks, updateFlashcardState, resetDeck } = useAppContext();
  const deck = decks.find(d => d.id === deckId);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [shuffledCards, setShuffledCards] = useState<Flashcard[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Initialize and sync cards when deck changes
  React.useEffect(() => {
    if (deck) {
      setShuffledCards(deck.cards);
      setIsShuffled(false);
      setCurrentIndex(0);
      setIsFlipped(false);
    }
  }, [deckId, deck]);

  const allLearnt = shuffledCards.length > 0 && shuffledCards.every(c => c.state === 'learnt');
  const isKanjiDeck = deck?.type === 'default' && deck?.name.toLowerCase().includes('kanji');

  React.useEffect(() => {
    if (allLearnt && !isTransitioning) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ff0000', '#ffd700', '#228b22', '#0000ff', '#ff69b4', '#800080', '#ffa500']
      });
    }
  }, [allLearnt, isTransitioning]);

  if (!deck) return <div className="flashcards-mode-view">Deck not found</div>;

  const currentCard = shuffledCards[currentIndex];
  const totalCards = shuffledCards.length;

  const handleNext = () => {
    if (totalCards === 0 || isTransitioning) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % totalCards);
  };

  const handlePrev = () => {
    if (totalCards === 0 || isTransitioning) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + totalCards) % totalCards);
  };

  const handleSetState = (state: FlashcardState) => {
    if (!currentCard || isTransitioning) return;
    
    setIsTransitioning(true);
    updateFlashcardState(deckId, currentCard.id, state);
    
    // Update local state to reflect change immediately so the badge shows up
    const updatedCards = [...shuffledCards];
    updatedCards[currentIndex] = { ...currentCard, state };
    setShuffledCards(updatedCards);

    // Wait 600ms before moving to the next card
    setTimeout(() => {
      if (state === 'learnt') {
        // Find next non-learnt card
        const nextIndex = updatedCards.findIndex((c, i) => i > currentIndex && c.state !== 'learnt');
        if (nextIndex !== -1) {
          setCurrentIndex(nextIndex);
        } else {
          // If no non-learnt cards after, check from beginning
          const firstNonLearnt = updatedCards.findIndex((c) => c.state !== 'learnt');
          if (firstNonLearnt !== -1) {
            setCurrentIndex(firstNonLearnt);
          }
        }
      } else {
        // For 'review' state, just go to the next card
        setCurrentIndex((prev) => (prev + 1) % totalCards);
      }
      setIsFlipped(false);
      setIsTransitioning(false);
    }, 600);
  };

  const toggleShuffle = () => {
    if (isTransitioning) return;
    const nextShuffled = !isShuffled;
    setIsShuffled(nextShuffled);
    if (nextShuffled) {
      setShuffledCards([...shuffledCards].sort(() => Math.random() - 0.5));
    } else {
      setShuffledCards(deck.cards);
    }
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleReset = () => {
    if (isTransitioning) return;
    resetDeck(deckId);
    setIsShuffled(false);
    setShuffledCards(deck.cards.map(c => ({ ...c, state: 'to-be-learnt' })));
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  if (allLearnt && !isTransitioning) {
    return (
      <div className="flashcards-mode-view">
        <div className="flashcards-mode-header">
          <button className="text-link-btn back-btn" onClick={onBack}>
            <img src={leftArrow} alt="" className="link-icon" />
            Back to decks
          </button>
        </div>

        <div className="flashcards-main-container">
          <div className="flashcard-item">
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
                color: '#060543',
                textAlign: 'left'
              }}>
                Well done!
              </div>
              <div style={{
                width: '247px',
                height: '17px',
                flexGrow: 0,
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: '14px',
                fontWeight: '500',
                color: '#2f2f3b',
                textAlign: 'center'
              }}>
                Great, you have completed this deck!
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                <button 
                  className="secondary-btn" 
                  onClick={handleReset}
                  style={{ 
                    width: '200px', 
                    height: '44px', 
                    display: 'flex', 
                    flexDirection: 'row', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    gap: '8px', 
                    padding: '13px 24px', 
                    borderRadius: '6px',
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
                    Restart deck
                  </span>
                </button>
                <button 
                  className="primary-btn congrats-mastery-btn" 
                  onClick={onNavigateToMastery}
                  style={{ 
                    width: '200px', 
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
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flashcards-mode-view">
      <div className="flashcards-mode-header">
        <button className="close-deck-btn" disabled={isTransitioning} onClick={onBack}>
          <img src={clearIcon} alt="Close" />
        </button>
        
        <div className="flashcards-header-actions">
          <button className="text-link-btn start-over-btn" disabled={isTransitioning} onClick={handleReset}>
            <img src={refreshIcon} alt="" className="link-icon" />
            Start over
          </button>
          <div className="shuffle-toggle">
            <label className="switch">
              <input type="checkbox" disabled={isTransitioning} checked={isShuffled} onChange={toggleShuffle} />
              <span className="slider round"></span>
            </label>
            <span className="shuffle-label">Shuffle</span>
          </div>
        </div>
      </div>

      <div className="flashcards-main-container">
        <button className="nav-arrow-btn left" disabled={isTransitioning} onClick={handlePrev}>
          <img src={leftArrow} alt="Previous" />
        </button>
        
        <div className={`flashcard-item ${isFlipped ? 'flipped' : ''} ${isTransitioning ? 'transitioning' : ''}`}>
          <div className="card-content-wrapper" onClick={() => !isTransitioning && setIsFlipped(!isFlipped)}>
            <div className="card-face card-front-face">
              {(currentCard?.state === 'learnt' || currentCard?.state === 'review') && (
                <div className={`card-state-badge ${currentCard.state} ${isTransitioning ? 'pop' : ''}`}>
                  {currentCard.state === 'learnt' ? 'I know this' : 'Still learning'}
                </div>
              )}
              {currentCard?.type && <div className="card-word-type">{currentCard.type}</div>}
              
              {currentCard?.kanji ? (
                <>
                  <div className="card-kanji-display">{currentCard.kanji}</div>
                  <div className="card-kana-display">{currentCard.kana}</div>
                </>
              ) : (
                <div className="card-kanji-display">{currentCard?.kana}</div>
              )}
            </div>
            <div className="card-face card-back-face">
              {(currentCard?.state === 'learnt' || currentCard?.state === 'review') && (
                <div className={`card-state-badge ${currentCard.state} ${isTransitioning ? 'pop' : ''}`}>
                  {currentCard.state === 'learnt' ? 'I know this' : 'Still learning'}
                </div>
              )}
              
              <div className="card-back-section">
                <div className="section-label">MEANING</div>
                <div className="card-meaning-display">{currentCard?.meaning}</div>
              </div>

              {isKanjiDeck && (
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
              )}

              <div className="card-back-section example-section">
                <div className="section-label">EXAMPLE</div>
                <div className="card-example-display">{currentCard?.example}</div>
              </div>
            </div>
          </div>
        </div>

        <button className="nav-arrow-btn right" disabled={isTransitioning} onClick={handleNext}>
          <img src={rightArrow} alt="Next" />
        </button>
      </div>

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
    </div>
  );
};

export default Flashcards;
