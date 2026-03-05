import React, { useState, useEffect } from 'react';
import { generateCustomDeck } from '../services/gemini';
import { useAppContext } from '../AppContext';
import type { Deck, Flashcard, Level } from '../types';
import leftArrow from '../assets/ic_round-keyboard-arrow-left.svg';

interface CreateWithSenseiAIProps {
  onBack: () => void;
  editingDeckId: string | null;
  showToast: (message: string) => void;
}

const CreateWithSenseiAI: React.FC<CreateWithSenseiAIProps> = ({ onBack, editingDeckId, showToast }) => {
  const { currentLevel, addCustomDeck, updateCustomDeck, deleteDeck, decks } = useAppContext();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState<any | null>(null);
  const [deckName, setDeckName] = useState('');
  const [selectedWords, setSelectedWords] = useState<Flashcard[]>([]);
  const [removedWords, setRemovedWords] = useState<Flashcard[]>([]);

  useEffect(() => {
    if (editingDeckId) {
      const deckToEdit = decks.find(d => d.id === editingDeckId);
      if (deckToEdit) {
        setGeneratedData({ level: deckToEdit.level });
        setDeckName(deckToEdit.name);
        setSelectedWords(deckToEdit.cards);
      }
    }
  }, [editingDeckId, decks]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const data = await generateCustomDeck(prompt, currentLevel);
      setGeneratedData(data);
      setDeckName(data.name || 'My Custom Deck');
      setSelectedWords(data.cards.map((c: any, i: number) => ({
        ...c,
        id: `custom-${Date.now()}-${i}`,
        state: 'to-be-learnt'
      })));
    } catch (error) {
      console.error(error);
      showToast('Error generating deck. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const removeWord = (wordId: string) => {
    const wordToRemove = selectedWords.find(w => w.id === wordId);
    if (wordToRemove) {
      setSelectedWords(prev => prev.filter(w => w.id !== wordId));
      setRemovedWords(prev => [...prev, wordToRemove]);
    }
  };

  const undoRemove = () => {
    if (removedWords.length === 0) return;
    const lastRemoved = removedWords[removedWords.length - 1];
    setRemovedWords(prev => prev.slice(0, -1));
    setSelectedWords(prev => [...prev, lastRemoved]);
  };

  const handleCreateOrUpdateDeck = () => {
    if (!deckName.trim() || selectedWords.length === 0) return;

    if (editingDeckId) {
      const updatedDeck: Deck = {
        id: editingDeckId,
        name: deckName,
        type: 'custom',
        level: (generatedData?.level as Level) || currentLevel,
        cards: selectedWords
      };
      updateCustomDeck(updatedDeck);
      showToast('Deck updated successfully!');
    } else {
      const newDeck: Deck = {
        id: `custom-deck-${Date.now()}`,
        name: deckName,
        type: 'custom',
        level: (generatedData?.level as Level) || currentLevel,
        cards: selectedWords
      };
      addCustomDeck(newDeck);
      if (newDeck.level !== currentLevel) {
        showToast(`Deck created for ${newDeck.level}. Find it there!`);
      } else {
        showToast('Deck created successfully!');
      }
    }
    
    onBack();
  };

  const handleDelete = () => {
    if (editingDeckId && window.confirm('Are you sure you want to delete this deck?')) {
      deleteDeck(editingDeckId);
      showToast('Deck deleted.');
      onBack();
    }
  };

  if (generatedData) {
    return (
      <div className="sensei-ai-view">
        <div className="sensei-ai-header">
          <button className="text-link-btn back-btn" onClick={() => { if (editingDeckId) onBack(); else setGeneratedData(null); }}>
            <img src={leftArrow} alt="" className="link-icon" />
            Back to decks
          </button>
        </div>

        <div className="review-deck-page">
          <h2>{editingDeckId ? 'Edit deck' : 'Review your new deck'}</h2>
          <div className="deck-name-input">
            <label>Deck name</label>
            <input 
              type="text" 
              value={deckName} 
              onChange={(e) => setDeckName(e.target.value)} 
              placeholder="Enter deck name..."
            />
          </div>
          <div className="words-review">
            <h3>Words ({selectedWords.length})</h3>
            <div className="word-pills">
              {selectedWords.map(word => (
                <div key={word.id} className="word-pill">
                  <span>{word.kanji || word.kana} - {word.meaning}</span>
                  <button className="remove-word" onClick={() => removeWord(word.id)}>×</button>
                </div>
              ))}
            </div>
            {removedWords.length > 0 && (
              <button className="undo-btn" onClick={undoRemove}>Undo last removal</button>
            )}
          </div>
          
          {editingDeckId && (
            <div className="edit-prompt-link">
              <p>Want to change words? <button onClick={() => setGeneratedData(null)}>Go back to Sensei prompt</button></p>
            </div>
          )}

          <div className="review-actions">
            {editingDeckId ? (
              <>
                <button className="delete-btn" onClick={handleDelete}>Delete deck</button>
                <button className="primary-btn" onClick={handleCreateOrUpdateDeck}>Save changes</button>
              </>
            ) : (
              <>
                <button className="secondary-btn" onClick={() => setGeneratedData(null)}>Go back to Sensei</button>
                <button className="primary-btn" onClick={handleCreateOrUpdateDeck}>Create deck</button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sensei-ai-view">
      <div className="sensei-ai-header">
        <button className="text-link-btn back-btn" onClick={onBack}>
          <img src={leftArrow} alt="" className="link-icon" />
          Back to decks
        </button>
      </div>

      <div className="create-ai-page">
        <h2>Create with Sensei AI</h2>
        <div className="prompt-container">
          <textarea 
            value={prompt} 
            onChange={(e) => setPrompt(e.target.value)} 
            placeholder="Ask Sensei to generate a custom deck for you. E.g., '15 words about food' or 'N4 verbs for traveling'..."
            disabled={isGenerating}
          />
          <button 
            className="generate-btn" 
            onClick={handleGenerate} 
            disabled={isGenerating || !prompt.trim()}
          >
            {isGenerating ? 'Sensei is thinking...' : 'Generate deck'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateWithSenseiAI;
