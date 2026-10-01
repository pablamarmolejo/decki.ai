import React, { useState } from 'react';
import type { Deck, DeckStudySettings } from '../types';

interface DeckSetupModalProps {
  deck: Deck;
  onClose: () => void;
  onStart: (settings: DeckStudySettings) => void;
}

const DeckSetupModal: React.FC<DeckSetupModalProps> = ({ deck, onClose, onStart }) => {
  const [shuffle, setShuffle] = useState(true);
  const [frontKana, setFrontKana] = useState(true);
  const [frontMeaning, setFrontMeaning] = useState(false);
  const [backKana, setBackKana] = useState(false);
  const [backMeaning, setBackMeaning] = useState(true);

  const handleStart = () => {
    onStart({
      shuffle,
      frontKana,
      frontMeaning,
      backKana,
      backMeaning,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="quiz-setup-modal deck-setup-modal" onClick={(e) => e.stopPropagation()}>
        <h2>{deck.name}</h2>
        <p>Customise your study session before starting.</p>

        <div className="deck-setup-toggle-row">
          <span className="deck-setup-label">Shuffle deck</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={shuffle}
              onChange={(e) => setShuffle(e.target.checked)}
            />
            <span className="slider round"></span>
          </label>
        </div>

        <label className="deck-setup-section-heading">Front side</label>
        <label className="quiz-check deck-setup-check">
          <input
            type="checkbox"
            checked={frontKana}
            onChange={(e) => setFrontKana(e.target.checked)}
          />
          Show kana
        </label>
        <label className="quiz-check deck-setup-check">
          <input
            type="checkbox"
            checked={frontMeaning}
            onChange={(e) => setFrontMeaning(e.target.checked)}
          />
          Show meaning
        </label>

        <label className="deck-setup-section-heading">Back side</label>
        <label className="quiz-check deck-setup-check">
          <input
            type="checkbox"
            checked={backKana}
            onChange={(e) => setBackKana(e.target.checked)}
          />
          Show kana
        </label>
        <label className="quiz-check deck-setup-check">
          <input
            type="checkbox"
            checked={backMeaning}
            onChange={(e) => setBackMeaning(e.target.checked)}
          />
          Show meaning
        </label>

        <div className="quiz-actions deck-setup-actions">
          <button className="secondary-btn modal-secondary-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-btn modal-primary-btn" onClick={handleStart}>
            Start deck
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeckSetupModal;
