import React, { useState } from 'react';
import { useAppContext } from '../AppContext';
import type { Flashcard, FlashcardState } from '../types';
import leftArrow from '../assets/ic_round-keyboard-arrow-left.svg';
import rightArrow from '../assets/ic_round-keyboard-arrow-right.svg';
import checkIcon from '../assets/ic_round-check.svg';
import restoreIcon from '../assets/ic_round-restore.svg';
import refreshIcon from '../assets/ic_round-refresh.svg';

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
  }, [deckId]);

  if (!deck) return <div>Deck not found</div>;

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

  const allLearnt = shuffledCards.length > 0 && shuffledCards.every(c => c.state === 'learnt');
  const isKanjiDeck = deck.type === 'default' && deck.name.toLowerCase().includes('kanji');

  if (allLearnt && !isTransitioning) {
    return (
      <div className="congratulations-container">
        <div className="congratulations-card">
          <h2>🎉 Congratulations! 🎉</h2>
          <p>You have mastered all {totalCards} cards in this deck!</p>
          <div className="congrats-actions">
            <button className="primary-btn" onClick={onBack}>Go back to Study decks</button>
            <button className="secondary-btn" onClick={handleReset}>Restart deck</button>
            <button className="accent-btn" onClick={onNavigateToMastery}>Start practice</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flashcards-mode-view">
      <div className="flashcards-mode-header">
        <button className="text-link-btn back-btn" disabled={isTransitioning} onClick={onBack}>
          <img src={leftArrow} alt="" className="link-icon" />
          Back to decks
        </button>
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

      <div className="flashcards-main-container">
        <button className="nav-arrow-btn left" disabled={isTransitioning} onClick={handlePrev}>
          <img src={leftArrow} alt="Previous" />
        </button>
        
        <div className={`flashcard-item ${isFlipped ? 'flipped' : ''} ${isTransitioning ? 'transitioning' : ''}`}>
          <div className="card-content-wrapper" onClick={() => !isTransitioning && setIsFlipped(!isFlipped)}>
            <div className="card-face card-front-face">
              {(currentCard?.state === 'learnt' || currentCard?.state === 'review') && (
                <div className={`card-state-badge ${currentCard.state} ${isTransitioning ? 'pop' : ''}`}>
                  {currentCard.state === 'learnt' ? 'Learnt' : 'Review'}
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
                  {currentCard.state === 'learnt' ? 'Learnt' : 'Review'}
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
          Review
          <img src={restoreIcon} alt="" className="btn-icon" />
        </button>
        <button className="state-btn learnt" disabled={isTransitioning} onClick={() => handleSetState('learnt')}>
          Learnt
          <img src={checkIcon} alt="" className="btn-icon" />
        </button>
      </div>
    </div>
  );
};

export default Flashcards;
