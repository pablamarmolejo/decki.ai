import React, { useState, useEffect } from 'react';
import { useAppContext } from '../AppContext';
import type { Deck, Flashcard, Level } from '../types';
import leftArrow from '../assets/ic_round-keyboard-arrow-left.svg';
import plusIcon from '../assets/ic_round-plus.svg';
import autoStoriesIcon from '../assets/ic_round-auto-stories.svg';
import deleteIcon from '../assets/ic_round-delete-outline.svg';

interface CreateCustomDeckProps {
  onBack: () => void;
  editingDeckId: string | null;
  showToast: (message: string) => void;
}

const CreateCustomDeck: React.FC<CreateCustomDeckProps> = ({ onBack, editingDeckId, showToast }) => {
  const { currentLevel, addCustomDeck, updateCustomDeck, deleteDeck, decks } = useAppContext();
  const [deckName, setDeckName] = useState('');
  const [selectedWords, setSelectedWords] = useState<Flashcard[]>([]);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  
  // State for the card currently being added/edited
  const [cardFormData, setCardFormData] = useState({
    kanji: '',
    kana: '',
    meaning: '',
    example: ''
  });

  useEffect(() => {
    if (editingDeckId) {
      const deckToEdit = decks.find(d => d.id === editingDeckId);
      if (deckToEdit) {
        setDeckName(deckToEdit.name);
        setSelectedWords(deckToEdit.cards);
      }
    }
  }, [editingDeckId, decks]);

  const handleSaveCard = (id?: string) => {
    if (!cardFormData.kana.trim() || !cardFormData.meaning.trim()) {
      showToast('Word (kana) and Meaning are required.');
      return;
    }

    if (id) {
      // Update existing card
      setSelectedWords(prev => prev.map(card => 
        card.id === id 
          ? { ...card, ...cardFormData } 
          : card
      ));
      setEditingCardId(null);
      showToast('Card updated.');
    } else {
      // Add new card at the beginning
      const cardToAdd: Flashcard = {
        id: `custom-card-${Date.now()}`,
        ...cardFormData,
        state: 'to-be-learnt'
      };
      setSelectedWords(prev => [cardToAdd, ...prev]);
      setIsAddingNew(false);
      showToast('Card added.');
    }

    setCardFormData({ kanji: '', kana: '', meaning: '', example: '' });
  };

  const startEditing = (card: Flashcard) => {
    setCardFormData({
      kanji: card.kanji || '',
      kana: card.kana || '',
      meaning: card.meaning,
      example: card.example || ''
    });
    setEditingCardId(card.id);
    setIsAddingNew(false);
  };

  const handleRemoveCard = (cardId: string) => {
    setSelectedWords(prev => prev.filter(w => w.id !== cardId));
  };

  const handleCreateOrUpdateDeck = () => {
    if (!deckName.trim()) {
      showToast('Please enter a deck name.');
      return;
    }
    if (selectedWords.length === 0) {
      showToast('Please add at least one flashcard.');
      return;
    }

    const deckData: Deck = {
      id: editingDeckId || `custom-deck-${Date.now()}`,
      name: deckName,
      type: 'custom',
      level: currentLevel,
      cards: selectedWords
    };

    if (editingDeckId) {
      updateCustomDeck(deckData);
      showToast('Deck updated successfully!');
    } else {
      addCustomDeck(deckData);
      showToast('Deck created successfully!');
    }
    
    onBack();
  };

  const renderCardForm = (id?: string) => (
    <div className="add-card-section inline-form" style={{ 
      background: '#fcfcfc', 
      padding: '24px', 
      borderRadius: '12px', 
      border: '1px solid #5856EB',
      marginBottom: '12px',
      boxShadow: '0 6px 12px 0 rgba(88, 86, 235, 0.1)',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div className="input-group">
          <div className="field-label">Word (kanji)</div>
          <input 
            type="text" 
            value={cardFormData.kanji} 
            onChange={(e) => setCardFormData({...cardFormData, kanji: e.target.value})} 
            placeholder="e.g., 食べる"
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ededf0', boxSizing: 'border-box', marginTop: '16px' }}
          />
        </div>
        <div className="input-group">
          <div className="field-label">Word (kana)</div>
          <input 
            type="text" 
            value={cardFormData.kana} 
            onChange={(e) => setCardFormData({...cardFormData, kana: e.target.value})} 
            placeholder="e.g., たべる"
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ededf0', boxSizing: 'border-box', marginTop: '16px' }}
          />
        </div>
      </div>
      <div style={{ marginBottom: '16px' }}>
        <div className="field-label">Meaning</div>
        <input 
          type="text" 
          value={cardFormData.meaning} 
          onChange={(e) => setCardFormData({...cardFormData, meaning: e.target.value})} 
          placeholder="e.g., to eat"
          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ededf0', boxSizing: 'border-box', marginTop: '16px' }}
        />
      </div>
      <div style={{ marginBottom: '24px' }}>
        <div className="field-label">Example Sentence (optional)</div>
        <input 
          type="text"
          value={cardFormData.example} 
          onChange={(e) => setCardFormData({...cardFormData, example: e.target.value})} 
          placeholder="e.g., りんごを食べる。"
          style={{ 
            width: '100%', 
            padding: '12px', 
            borderRadius: '8px', 
            border: '1px solid #ededf0',
            boxSizing: 'border-box',
            marginTop: '16px'
          }}
        />
      </div>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button 
          className="secondary-btn" 
          onClick={() => {
            setEditingCardId(null);
            setIsAddingNew(false);
            setCardFormData({ kanji: '', kana: '', meaning: '', example: '' });
          }}
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
            Cancel
          </span>
        </button>
        <button 
          className="primary-btn" 
          onClick={() => handleSaveCard(id)}
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
            {id ? 'Update word' : 'Save word'}
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="sensei-ai-view">
      <div className="sensei-ai-header">
        <button className="text-link-btn back-btn" onClick={onBack}>
          <img src={leftArrow} alt="" className="link-icon" />
          Back to decks
        </button>
      </div>

      <div className="create-ai-page">
        <h2 style={{ 
          fontFamily: "'Noto Sans JP', sans-serif", 
          fontSize: '24px', 
          fontWeight: 'bold', 
          textAlign: 'left', 
          color: '#060543',
          margin: '0 0 32px 0'
        }}>
          {editingDeckId ? 'Edit custom deck' : 'Create custom deck'}
        </h2>
        
        <div className="deck-name-input" style={{ marginBottom: '32px' }}>
          <div className="field-label">Deck name</div>
          <input 
            type="text" 
            value={deckName} 
            onChange={(e) => setDeckName(e.target.value)} 
            placeholder="Enter deck name (e.g., My Favorite Verbs)"
            style={{ 
              width: '100%', 
              padding: '16px', 
              borderRadius: '8px', 
              border: '1px solid #ededf0',
              fontSize: '16px',
              marginTop: '16px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div className="words-review">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ color: '#060543', margin: 0 }}>Flashcards ({selectedWords.length})</h3>
            {!isAddingNew && !editingCardId && (
              <button 
                className="primary-btn" 
                onClick={() => {
                  setIsAddingNew(true);
                  setCardFormData({ kanji: '', kana: '', meaning: '', example: '' });
                }}
                style={{ 
                  padding: '8px 16px', 
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <img src={plusIcon} alt="" style={{ width: '18px', height: '18px', filter: 'brightness(0) invert(1)' }} />
                Add card
              </button>
            )}
          </div>

          <div className="word-pills">
            {isAddingNew && renderCardForm()}
            
            {selectedWords.length === 0 && !isAddingNew ? (
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
                  No cards yet. Let's add new cards!
                </p>
              </div>
            ) : (
              selectedWords.map(word => (
                <React.Fragment key={word.id}>
                  {editingCardId === word.id ? (
                    renderCardForm(word.id)
                  ) : (
                    <div className="word-pill" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '16px', background: 'white', borderRadius: '12px', border: '1px solid #ededf0', marginBottom: '12px', boxSizing: 'border-box' }}>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#060543' }}>{word.kanji ? `${word.kanji} (${word.kana})` : word.kana}</div>
                        <div style={{ color: '#494850' }}>{word.meaning}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="text-link-btn" onClick={() => startEditing(word)} style={{ color: '#5856EB' }}>Edit</button>
                        <button className="remove-word" onClick={() => handleRemoveCard(word.id)}>×</button>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))
            )}
          </div>
        </div>

        <div className="review-actions" style={{ marginTop: '40px', display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
          {editingDeckId && (
            <button 
              className="delete-btn" 
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this deck?')) {
                  deleteDeck(editingDeckId);
                  showToast('Deck deleted.');
                  onBack();
                }
              }} 
              style={{ 
                marginRight: 'auto',
                width: '200px',
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
          )}
          <button 
            className="primary-btn" 
            onClick={handleCreateOrUpdateDeck} 
            disabled={selectedWords.length === 0 || !deckName.trim() || !!editingCardId || isAddingNew}
            style={{ 
              width: '200px', 
              height: '44px', 
              flexGrow: 0, 
              display: 'flex', 
              flexDirection: 'row', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '13px 24px', 
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            <span style={{
              height: '19px',
              fontFamily: "'Noto Sans JP', sans-serif",
              fontSize: '16px',
              fontWeight: 'bold',
              textAlign: 'center',
              color: '#fcfcfc',
              lineHeight: '1'
            }}>
              {editingDeckId ? 'Save changes' : 'Save deck'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateCustomDeck;
