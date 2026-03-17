import React, { useState, useEffect } from 'react';
import { useAppContext } from '../AppContext';
import type { Flashcard, SentencePractice } from '../types';
import checkIcon from '../assets/ic_round-check.svg';
import restoreIcon from '../assets/ic_round-restore.svg';
import editNoteIcon from '../assets/ic_round-edit-note.svg';
import autoStoriesIcon from '../assets/ic_round-auto-stories.svg';
import deleteIcon from '../assets/ic_round-delete-outline.svg';
import backIcon from '../assets/ic_round-keyboard-arrow-left.svg';

const MasteryPractice: React.FC<{ onNavigateToStudy: () => void }> = ({ onNavigateToStudy }) => {
  const { decks, wordProgress, addSentence, removeSentence, currentLevel } = useAppContext();
  const [selectedWord, setSelectedWord] = useState<Flashcard | null>(null);
  const [sentence, setSentence] = useState('');
  const [sentenceToDelete, setSentenceToDelete] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Get all learnt words for the current level
  const learntWords = decks
    .filter(deck => deck.level === currentLevel)
    .flatMap(deck => deck.cards)
    .filter(card => card.state === 'learnt');
  
  // Deduplicate words if they appear in multiple decks
  const uniqueLearntWords = Array.from(new Map(learntWords.map(w => [w.kanji || w.kana, w])).values());

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (sentenceToDelete !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sentenceToDelete]);

  const handleWordSelect = (word: Flashcard) => {
    setSelectedWord(word);
    setSentence('');
  };

  const handleBackToList = () => {
    setSelectedWord(null);
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

  const handleConfirmDelete = () => {
    if (selectedWord && sentenceToDelete !== null) {
      removeSentence(selectedWord.id, sentenceToDelete);
      setSentenceToDelete(null);
    }
  };

  const progress = wordProgress.find(p => p.wordId === selectedWord?.id);

  // Decide what to show on mobile
  const showSidebar = !isMobile || !selectedWord;
  const showPractice = !isMobile || selectedWord;

  return (
    <div className="mastery-practice-page-container">
      {sentenceToDelete !== null && (
        <div className="modal-overlay" onClick={() => setSentenceToDelete(null)}>
          <div className="confirmation-modal" onClick={(e) => e.stopPropagation()} style={{
            width: 'min(571px, 90vw)',
            minHeight: '193px',
            height: 'auto',
            flexGrow: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '32px',
            padding: '32px',
            borderRadius: '12px',
            border: 'solid 1px #ededf0',
            backgroundColor: '#fcfcfc',
            boxSizing: 'border-box'
          }}>
            <div style={{ width: '100%' }}>
              <div style={{
                height: 'auto',
                alignSelf: 'stretch',
                flexGrow: 0,
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: '20px',
                fontWeight: 'bold',
                textAlign: 'left',
                color: '#060543',
                lineHeight: 'normal',
                marginBottom: '8px'
              }}>
                Delete sentence?
              </div>
              <div style={{
                alignSelf: 'stretch',
                minHeight: '17px',
                flexGrow: 0,
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: '14px',
                fontWeight: 'normal',
                textAlign: 'left',
                color: '#2f2f3b',
                lineHeight: '1.4'
              }}>
                Are you sure you would like to delete this sentence? You won't be able to recover a sentence once deleted.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px', alignSelf: 'stretch', flexDirection: isMobile ? 'column' : 'row' }}>
              <button 
                className="secondary-btn modal-secondary-btn" 
                onClick={() => setSentenceToDelete(null)}
                style={{ 
                  flex: 1,
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
                  Cancel
                </span>
              </button>
              <button 
                className="delete-btn modal-delete-btn" 
                onClick={handleConfirmDelete}
                style={{ 
                  flex: 1,
                  height: '43px',
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  backgroundColor: '#ffe6e6',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <span style={{
                  fontFamily: "'Noto Sans JP', sans-serif",
                  fontSize: '16px',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  color: '#d73d3d',
                  lineHeight: '1'
                }}>
                  Delete
                </span>
                <img 
                  src={deleteIcon} 
                  alt="" 
                  style={{ 
                    width: '20px', 
                    height: '20px', 
                    filter: 'brightness(0) saturate(100%) invert(34%) sepia(86%) saturate(1914%) hue-rotate(336deg) brightness(89%) contrast(91%)' // #d73d3d
                  }} 
                />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="page-title-row">
        <div className="title-section-icon" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <img 
            src={editNoteIcon} 
            alt="" 
            style={{ 
              width: '26px', 
              height: '26px',
              filter: 'brightness(0) saturate(100%) invert(26%) sepia(89%) saturate(5943%) hue-rotate(238deg) brightness(92%) contrast(98%)' // #4F46E5
            }} 
          />
        </div>
        <div className="title-content">
          <h2 className="page-title-text">Practice</h2>
          <p className="page-subtitle-text">Practice the words you know by creating your own sentences</p>
        </div>
      </div>

      <div className="mastery-practice-page">
        {showSidebar && (
          <div className="learnt-words-sidebar">
            <h3 className="sidebar-title">Words ({uniqueLearntWords.length})</h3>
            {uniqueLearntWords.length === 0 ? (
              <div className="empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '40px 20px', textAlign: 'center' }}>
                <p style={{ color: '#8F8E96', margin: 0 }}>No words learnt yet. Go to Decks to start learning!</p>
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
                    border: '1px solid #4F46E5',
                    color: '#4F46E5',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: '16px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    color: '#4F46E5',
                    lineHeight: '1'
                  }}>
                    Go to Decks
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
                        <div className="word-item-main-row">
                          <div className="word-item-main">{word.kanji || word.kana}</div>
                          <div className="word-item-reading">{word.kana}</div>
                        </div>
                        <div className="word-item-meaning">
                          {word.meaning.split(';').slice(0, 2).join(';')}
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
        )}

        {showPractice && (
          <div className="practice-column">
            {isMobile && selectedWord && (
              <button className="text-link-btn back-btn" onClick={handleBackToList} style={{ marginBottom: '16px' }}>
                <img src={backIcon} alt="" className="link-icon" />
                <span>Back to word list</span>
              </button>
            )}
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
                      <div className="field-label">Word</div>
                      <div className="selected-word-info">
                        <div className="selected-word-main-row">
                          <div className="word-item-main">{selectedWord.kanji || selectedWord.kana}</div>
                          <div className="word-item-reading">{selectedWord.kana}</div>
                        </div>
                        <div className="word-item-meaning">{selectedWord.meaning}</div>
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
                          Add sentence
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
                            <button className="remove-s" onClick={() => setSentenceToDelete(i)}>×</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MasteryPractice;
