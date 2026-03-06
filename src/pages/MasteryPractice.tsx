import React, { useState } from 'react';
import { useAppContext } from '../AppContext';
import type { Flashcard, SentencePractice } from '../types';
import checkIcon from '../assets/ic_round-check.svg';
import restoreIcon from '../assets/ic_round-restore.svg';
import schoolIcon from '../assets/ic_round-school.svg';
import autoStoriesIcon from '../assets/ic_round-auto-stories.svg';

const MasteryPractice: React.FC<{ onNavigateToStudy: () => void }> = ({ onNavigateToStudy }) => {
  const { decks, wordProgress, addSentence, removeSentence, currentLevel } = useAppContext();
  const [selectedWord, setSelectedWord] = useState<Flashcard | null>(null);
  const [sentence, setSentence] = useState('');
  const [openHistoryIndex, setOpenHistoryIndex] = useState<number | null>(null);

  // Get all learnt words for the current level
  const learntWords = decks
    .filter(deck => deck.level === currentLevel)
    .flatMap(deck => deck.cards)
    .filter(card => card.state === 'learnt');
  
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
        <div className="title-section-icon" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <img 
            src={schoolIcon} 
            alt="" 
            style={{ 
              width: '26px', 
              height: '26px',
              filter: 'brightness(0) saturate(100%) invert(32%) sepia(94%) saturate(4529%) hue-rotate(236deg) brightness(97%) contrast(93%)' // #5856eb
            }} 
          />
        </div>
        <div className="title-content">
          <h2 className="page-title-text">Mastery practice</h2>
          <p className="page-subtitle-text">Practice your learnt words by creating sentences</p>
        </div>
      </div>

      <div className="mastery-practice-page">
        <div className="learnt-words-sidebar">
          <h3 className="sidebar-title">Learnt words ({uniqueLearntWords.length})</h3>
          {uniqueLearntWords.length === 0 ? (
            <div className="empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '40px 20px', textAlign: 'center' }}>
              <p style={{ color: '#8F8E96', margin: 0 }}>No words learnt yet. Go to Study Decks to start learning!</p>
              <button 
                onClick={onNavigateToStudy}
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
                  backgroundColor: '#fcfcfc',
                  border: '1px solid #5856eb',
                  color: '#5856eb',
                  cursor: 'pointer'
                }}
              >
                <span style={{
                  fontFamily: "'Noto Sans JP', sans-serif",
                  fontSize: '16px',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  color: '#5856eb',
                  lineHeight: '1'
                }}>
                  Go to Study Decks
                </span>
              </button>
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
            <div style={{ 
              height: '200px',
              width: '100%',
              alignSelf: 'stretch',
              flexGrow: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '12px',
              padding: '40px 64px',
              borderRadius: '16px',
              border: 'solid 1px #ededf0',
              backgroundColor: '#fcfcfc',
              boxSizing: 'border-box'
            }}>
              <img 
                src={autoStoriesIcon} 
                alt="" 
                style={{ 
                  width: '48px', 
                  height: '48px', 
                  filter: 'brightness(0) saturate(100%) invert(64%) sepia(5%) saturate(344%) hue-rotate(206deg) brightness(90%) contrast(86%)' // #8F8E96
                }} 
              />
              <p style={{ 
                color: '#8F8E96', 
                textAlign: 'center',
                margin: 0
              }}>
                Select a word from the list to start practicing!
              </p>
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
                      <div 
                        key={i} 
                        className="history-item" 
                        onClick={() => setOpenHistoryIndex(openHistoryIndex === i ? null : i)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="history-header">
                          <div className="history-text-content">
                            <div className="h-sentence">{s.sentence}</div>
                            <div className="h-date">{s.date}</div>
                          </div>
                          <button className="remove-s" onClick={(e) => { e.stopPropagation(); removeSentence(selectedWord.id, i); }}>×</button>
                        </div>
                        
                        <details 
                          className="h-feedback" 
                          open={openHistoryIndex === i}
                          onClick={(e) => {
                            e.preventDefault();
                            setOpenHistoryIndex(openHistoryIndex === i ? null : i);
                          }}
                        >
                          <summary>Sensei's Feedback</summary>
                          <div className="feedback-content">
                            {s.feedback && (
                              <div style={{ marginBottom: '12px' }}>
                                {s.feedback}
                              </div>
                            )}
                            
                            {s.grammar && (
                              <div style={{ marginTop: '16px' }}>
                                <strong>Grammar</strong>
                                <div style={{ marginTop: '4px' }}>{s.grammar}</div>
                              </div>
                            )}

                            {s.improvements && (
                              <div style={{ marginTop: '16px' }}>
                                <strong>Suggestions</strong>
                                <div style={{ marginTop: '4px' }}>{s.improvements}</div>
                              </div>
                            )}
                          </div>
                        </details>
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
