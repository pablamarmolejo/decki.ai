import React, { useState } from 'react';
import { useAppContext } from '../AppContext';
import { getSentenceSuggestions, getSentenceFeedback } from '../services/gemini';
import type { Flashcard, SentencePractice } from '../types';

const MasteryPractice: React.FC<{ onNavigateToStudy: () => void }> = ({ onNavigateToStudy }) => {
  const { decks, wordProgress, addSentence, removeSentence, currentLevel } = useAppContext();
  const [selectedWord, setSelectedWord] = useState<Flashcard | null>(null);
  const [sentence, setSentence] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingSuggestions, setIsGettingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<any | null>(null);
  const [isFromSuggestion, setIsFromSuggestion] = useState(false);

  // Get all learnt words across all decks
  const learntWords = decks.flatMap(deck => deck.cards).filter(card => card.state === 'learnt');
  
  // Deduplicate words if they appear in multiple decks
  const uniqueLearntWords = Array.from(new Map(learntWords.map(w => [w.kanji || w.kana, w])).values());

  const handleWordSelect = (word: Flashcard) => {
    setSelectedWord(word);
    setSentence('');
    setSuggestions(null);
    setIsFromSuggestion(false);
  };

  const handleGetSuggestions = async () => {
    if (!selectedWord) return;
    setIsGettingSuggestions(true);
    try {
      const data = await getSentenceSuggestions(selectedWord.kanji || selectedWord.kana || '', selectedWord.meaning, currentLevel);
      setSuggestions(data);
    } catch (error) {
      console.error(error);
      alert('Failed to get suggestions.');
    } finally {
      setIsGettingSuggestions(false);
    }
  };

  const handleUseSuggestion = (suggestion: any) => {
    setSentence(suggestion.kanji);
    setIsFromSuggestion(true);
  };

  const [currentFeedback, setCurrentFeedback] = useState<any | null>(null);

  const handleSubmit = async () => {
    if (!selectedWord || !sentence.trim()) return;
    setIsSubmitting(true);
    setCurrentFeedback(null);
    try {
      const data = await getSentenceFeedback(sentence, selectedWord.kanji || selectedWord.kana || '', currentLevel, isFromSuggestion);
      
      if (!data.isGibberish) {
        const newSentence: SentencePractice = {
          sentence: sentence,
          hiragana: '', // Would be better if Gemini provided this for custom sentences
          meaning: '', // Would be better if Gemini provided this
          date: new Date().toLocaleDateString(),
          feedback: data.feedback
        };
        addSentence(selectedWord.id, newSentence);
        setSentence('');
      } else {
        // If gibberish, we show feedback but don't add to history
        setSuggestions({
          explanation: data.explanation,
          suggestions: data.suggestions
        });
      }
      setCurrentFeedback(data);
    } catch (error) {
      console.error(error);
      alert('Failed to submit sentence.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = wordProgress.find(p => p.wordId === selectedWord?.id);

  return (
    <div className="mastery-practice-page">
      <div className="learnt-words-sidebar">
        <h3>Learnt words ({uniqueLearntWords.length})</h3>
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
                  <div className="word-main">{word.kanji || word.kana} {isUsed && '✓'}</div>
                  <div className="word-sub">{word.meaning}</div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="practice-area">
        {!selectedWord ? (
          <div className="empty-practice">
            <p>Select a word from the list to start practicing!</p>
          </div>
        ) : (
          <div className="writing-section">
            <div className="selected-word-info">
              <h2>{selectedWord.kanji} ({selectedWord.kana})</h2>
              <p>{selectedWord.meaning}</p>
            </div>

            <div className="ai-assist">
              <button onClick={handleGetSuggestions} disabled={isGettingSuggestions}>
                {isGettingSuggestions ? 'Loading suggestions...' : 'Sensei AI Assist'}
              </button>
              {suggestions && (
                <div className="suggestions-list">
                  <p>{suggestions.explanation}</p>
                  {suggestions.suggestions.map((s: any, i: number) => (
                    <div key={i} className="suggestion-card" onClick={() => handleUseSuggestion(s)}>
                      <div className="s-kanji">{s.kanji}</div>
                      <div className="s-hiragana">{s.hiragana}</div>
                      <div className="s-meaning">{s.meaning}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="sentence-input">
              <textarea 
                value={sentence} 
                onChange={(e) => {
                  setSentence(e.target.value);
                  setIsFromSuggestion(false);
                }} 
                placeholder="Write a sentence using this word..."
              />
              <button onClick={handleSubmit} disabled={isSubmitting || !sentence.trim()}>
                {isSubmitting ? 'Submitting...' : 'Submit to Sensei AI'}
              </button>
            </div>

            {currentFeedback && (
              <div className={`feedback-bubble ${currentFeedback.isGibberish ? 'warning' : 'success'}`}>
                <strong>Sensei AI's Feedback:</strong>
                <p>{currentFeedback.feedback}</p>
              </div>
            )}

            {progress && progress.sentences.length > 0 && (
              <div className="sentence-history">
                <h3>Sentence History</h3>
                {progress.sentences.map((s, i) => (
                  <div key={i} className="history-item">
                    <div className="history-header">
                      <div className="h-sentence">{s.sentence}</div>
                      <div className="h-date">{s.date}</div>
                      <button className="remove-s" onClick={() => removeSentence(selectedWord.id, i)}>×</button>
                    </div>
                    <details className="h-feedback">
                      <summary>Sensei's Feedback</summary>
                      <div className="feedback-content">{s.feedback}</div>
                    </details>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MasteryPractice;
