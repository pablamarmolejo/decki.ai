import React, { useState } from 'react';
import { useAppContext } from '../AppContext';
import type { DeckType } from '../types';
import autoAwesomeIcon from '../assets/ic_round-auto-awesome.svg';
import editIcon from '../assets/ic_round-edit.svg';
import styleIcon from '../assets/ic_round-style.svg';

interface StudyDecksProps {
  onNavigateToCreate: () => void;
  onNavigateToDeck: (deckId: string) => void;
  onEditDeck: (deckId: string) => void;
}

const StudyDecks: React.FC<StudyDecksProps> = ({ onNavigateToCreate, onNavigateToDeck, onEditDeck }) => {
  const { currentLevel, decks } = useAppContext();
  const [filter, setFilter] = useState<DeckType | 'all'>('all');

  const levelDecks = decks.filter(deck => deck.level === currentLevel);
  const filteredDecks = levelDecks.filter(deck => {
    if (filter === 'all') return true;
    if (filter === 'default') return deck.type === 'default';
    if (filter === 'custom') return deck.type === 'custom';
    return true;
  });

  return (
    <div className="study-decks-page">
      <div className="study-decks-title-row">
        <div className="page-title-row">
          <div className="title-section-icon study-decks-icon"></div>
          <div className="title-content">
            <h2 className="page-title-text">Study decks</h2>
            <p className="page-subtitle-text">Review your vocabulary and kanji collections</p>
          </div>
        </div>
        <div className="decks-filter">
          <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
          <button className={`filter-btn ${filter === 'default' ? 'active' : ''}`} onClick={() => setFilter('default')}>Default</button>
          <button className={`filter-btn ${filter === 'custom' ? 'active' : ''}`} onClick={() => setFilter('custom')}>Custom Deck</button>
        </div>
      </div>

      <div className="study-decks-content">
        <div className="decks-grid">
          {filteredDecks.map((deck) => {
            const totalCards = deck.cards.length;
            const learntCards = deck.cards.filter(c => c.state === 'learnt').length;
            const progress = totalCards > 0 ? (learntCards / totalCards) * 100 : 0;
            const isCustom = deck.type === 'custom';
            const isInProgress = learntCards > 0;
            const cardClassName = [
              'deck-card',
              isCustom ? 'deck-card-custom' : 'deck-card-default',
              isInProgress ? 'deck-card-in-progress' : 'deck-card-not-started',
            ].join(' ');

            return (
              <div key={deck.id} className={cardClassName} onClick={() => onNavigateToDeck(deck.id)}>
                <div className="deck-header">
                  <div className="deck-label">
                    {deck.type === 'custom' ? 'CUSTOM DECK' : deck.level}
                  </div>
                  {deck.type === 'custom' && (
                    <button
                      className="edit-deck-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditDeck(deck.id);
                      }}
                      aria-label="Edit deck"
                    >
                      <img src={editIcon} alt="" />
                    </button>
                  )}
                </div>
                <h4 className="deck-name">{deck.name}</h4>
                <div className="deck-card-info">
                  {totalCards} cards
                </div>
                
                <div className="progress-row">
                  <span>{learntCards} / {totalCards} Learnt</span>
                  <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="create-banner">
          <img 
            src={styleIcon} 
            alt="" 
            style={{ 
              width: '53px', 
              height: '54.9px', 
              margin: '0',
              filter: 'brightness(0) saturate(100%) invert(32%) sepia(94%) saturate(4529%) hue-rotate(236deg) brightness(97%) contrast(93%)' // #5856eb
            }} 
          />
          <h3>Create your own custom deck</h3>
          <p>Add your own words and sentences to practice at your own pace.</p>
          <button className="create-btn-white" onClick={onNavigateToCreate}>
            <span>Create custom deck</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudyDecks;
