import React, { useState } from 'react';
import { useAppContext } from '../AppContext';
import type { Flashcard, SentencePractice } from '../types';
import checkIcon from '../assets/ic_round-check.svg';
import restoreIcon from '../assets/ic_round-restore.svg';
import schoolIcon from '../assets/ic_round-school.svg';

const MasteryPractice: React.FC<{ onNavigateToStudy: () => void }> = ({ onNavigateToStudy }) => {
  const { decks, wordProgress, addSentence, removeSentence } = useAppContext();
  const [selectedWord, setSelectedWord] = useState<Flashcard | null>(null);
  const [sentence, setSentence] = useState('');

  // Get all learnt words across all decks
  const learntWords = decks.flatMap(deck => deck.cards).filter(card => card.state === 'learnt');
  
  // Deduplicate words if they appear in multiple decks
  const uniqueLearntWords = Array.from(new Map(learntWords.map(w => [w.kanji || w.kana, w])).values());

  const handleWordSelect = (word: Flashcard) => {
    setSelectedWord(word);
    setSentence('');
  };

  const handleSubmit = () => {
    if (!selectedWord || !sentence.trim()) return;
    
    const newSentence: SentencePractice = {
      sentence: sentence,
      hiragana: '', 
      meaning: '', 
      date: new Date().toLocaleDateString(),
    };
    
    addSentence(selectedWord.id, newSentence);
    setSentence('');
  };

  const progress = wordProgress.find(p => p.wordId === selectedWord?.id);

  return (
    <div className="mastery-practice-page-container">
      <div className="page-title-row">
        <img 
          src={schoolIcon} 
          alt="" 
          style={{ 
            width: '32px', 
            height: '32px',
            filter: 'brightness(0) saturate(100%) invert(32%) sepia(94%) saturate(4529%) hue-rotate(236deg) brightness(97%) contrast(93%)' // #5856eb
          }} 
        />
        <div className="title-content">
          <h2 className="page-title-text">Mastery practice</h2>
          <p className="page-subtitle-text">Practice your learnt words by creating sentences</p>
        </div>
      </div>

      <div className="mastery-practice-page">
        <div className="learnt-words-sidebar">
          <h3 className="sidebar-title">Learnt words ({uniqueLearntWords.length})</h3>
          {uniqueLearntWords.length === 0 ? (
            <div className="empty-state">
              <p>No words learnt yet. Go to Study Decks to start learning!</p>
              <button onClick={onNavigateToStudy}>Go to Study Decks</button>
            </div>
          ) : (
            <ul className="word-list">
              {uniqueLearntWords.map(word => {
                const isUsed = wordProgress.find(p => p.wordId === word.id)?.usedInPractice;
                return (
                  <li 
                    key={word.id} 
                    className={`word-item ${selectedWord?.id === word.id ? 'active' : ''}`}
                    onClick={() => handleWordSelect(word)}
                  >
                    <div className="word-item-content">
                      <div className="word-item-meaning">{word.meaning}</div>
                      <div className="word-item-main-row">
                        <div className="word-item-main">{word.kanji || word.kana}</div>
                        <div className="word-item-reading">{word.kana}</div>
                      </div>
                    </div>
                    {isUsed && (
                      <div className="word-item-used-badge">
                        <img src={checkIcon} alt="Used" />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="practice-column">
          {!selectedWord ? (
            <div className="practice-area empty">
              <div className="empty-practice">
                <p>Select a word from the list to start practicing!</p>
              </div>
            </div>
          ) : (
            <>
              <div className="practice-area">
                <div className="writing-section">
                  <div className="practice-header-row">
                    <div className="selected-word-info">
                      <div className="word-item-meaning">{selectedWord.meaning}</div>
                      <div className="selected-word-main-row">
                        <div className="word-item-main">{selectedWord.kanji || selectedWord.kana}</div>
                        <div className="word-item-reading">{selectedWord.kana}</div>
                      </div>
                    </div>
                  </div>

                  <div className="sentence-input">
                    <div className="field-label">Type your sentence</div>
                    <textarea 
                      value={sentence} 
                      onChange={(e) => setSentence(e.target.value)} 
                      placeholder="Write a sentence using this word..."
                    />
                    <div className="action-row">
                      <button className="submit-btn" onClick={handleSubmit} disabled={!sentence.trim()}>
                        Add to history
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {progress && progress.sentences.length > 0 && (
                <div className="practice-feedback-container">
                  <div className="section-title">
                    <img src={restoreIcon} alt="" className="section-icon" />
                    <span>Sentence history</span>
                  </div>
                  <div className="history-list">
                    {progress.sentences.map((s, i) => (
                      <div key={i} className="history-item">
                        <div className="history-header">
                          <div className="history-text-content">
                            <div className="h-sentence">{s.sentence}</div>
                            <div className="h-date">{s.date}</div>
                          </div>
                          <button className="remove-s" onClick={() => removeSentence(selectedWord.id, i)}>×</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MasteryPractice;
