import React, { useState, useEffect, useRef } from 'react';
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

interface ConfirmAction {
  type: 'word' | 'deck' | 'unsaved';
  id?: string;
  title: string;
  subheading: string;
  confirmText?: string;
  cancelText?: string;
}

const CreateCustomDeck: React.FC<CreateCustomDeckProps> = ({ onBack, editingDeckId, showToast }) => {
  const { currentLevel, addCustomDeck, updateCustomDeck, deleteDeck, decks } = useAppContext();
  const [deckName, setDeckName] = useState('');
  const [selectedWords, setSelectedWords] = useState<Flashcard[]>([]);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  
  // Track initial state to detect changes
  const initialDataRef = useRef<{ name: string, words: Flashcard[] }>({ name: '', words: [] });
  const [isFirstLoad, setIsFirstLoad] = useState(true);

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
        initialDataRef.current = { name: deckToEdit.name, words: [...deckToEdit.cards] };
      }
    } else {
      setDeckName('');
      setSelectedWords([]);
      initialDataRef.current = { name: '', words: [] };
    }
    setIsFirstLoad(false);
  }, [editingDeckId, decks]);

  const hasUnsavedChanges = () => {
    if (isFirstLoad) return false;
    const nameChanged = deckName !== initialDataRef.current.name;
    const wordsChanged = JSON.stringify(selectedWords) !== JSON.stringify(initialDataRef.current.words);
    return nameChanged || wordsChanged;
  };

  useEffect(() => {
    const container = document.querySelector('.minimalist-mode-container');
    if (confirmAction) {
      document.body.style.overflow = 'hidden';
      if (container) (container as HTMLElement).style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      if (container) (container as HTMLElement).style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
      if (container) (container as HTMLElement).style.overflow = '';
    };
  }, [confirmAction]);

  const handleSaveCard = (id?: string) => {
    if (!cardFormData.kana.trim() || !cardFormData.meaning.trim()) {
      showToast('Word (kana) and Meaning are required.');
      return;
    }

    if (id) {
      setSelectedWords(prev => prev.map(card => 
        card.id === id 
          ? { ...card, ...cardFormData } 
          : card
      ));
      setEditingCardId(null);
      showToast('Card updated.');
    } else {
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

  const confirmDeleteWord = (cardId: string) => {
    setConfirmAction({
      type: 'word',
      id: cardId,
      title: 'Delete word?',
      subheading: 'Saving your changes will make this action permanent.',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });
  };

  const confirmDeleteDeck = () => {
    setConfirmAction({
      type: 'deck',
      title: 'Delete deck?',
      subheading: "Are you sure you would like to delete this deck? Deleted decks can't be recovered.",
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });
  };

  const handleBackWithCheck = () => {
    if (hasUnsavedChanges()) {
      setConfirmAction({
        type: 'unsaved',
        title: 'Leaving without saving?',
        subheading: 'Some of the changes you have made to this deck have not been saved.',
        confirmText: 'Save changes',
        cancelText: 'Leave anyways'
      });
    } else {
      onBack();
    }
  };

  const handleConfirmAction = () => {
    if (!confirmAction) return;

    if (confirmAction.type === 'word' && confirmAction.id) {
      const cardId = confirmAction.id;
      setSelectedWords(prev => prev.filter(w => w.id !== cardId));
      if (editingCardId === cardId) {
        setEditingCardId(null);
        setCardFormData({ kanji: '', kana: '', meaning: '', example: '' });
      }
      showToast('Card removed from list.');
      setConfirmAction(null);
    } else if (confirmAction.type === 'deck' && editingDeckId) {
      deleteDeck(editingDeckId);
      showToast('Deck deleted.');
      onBack();
      setConfirmAction(null);
    } else if (confirmAction.type === 'unsaved') {
      handleCreateOrUpdateDeck();
      setConfirmAction(null);
    }
  };

  const handleCancelAction = (fromButton = false) => {
    if (confirmAction?.type === 'unsaved' && fromButton) {
      onBack();
    }
    setConfirmAction(null);
  };

  const handleCreateOrUpdateDeck = () => {
    const hasName = !!deckName.trim();
    const hasWords = selectedWords.length > 0;

    if (!hasName && !hasWords) {
      showToast('Please enter a deck name and add at least one word.');
      return;
    }
    if (!hasName) {
      showToast('Please enter a deck name.');
      return;
    }
    if (!hasWords) {
      showToast('Please add at least one word.');
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
          <div className="field-label">Word (kanji) *</div>
          <input 
            type="text" 
            value={cardFormData.kanji} 
            onChange={(e) => setCardFormData({...cardFormData, kanji: e.target.value})} 
            placeholder="e.g., 食べる"
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ededf0', boxSizing: 'border-box', marginTop: '16px' }}
          />
        </div>
        <div className="input-group">
          <div className="field-label">Word (kana) *</div>
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
        <div className="field-label">Meaning *</div>
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
          className="secondary-btn cancel-word-btn" 
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
          className="primary-btn add-word-btn" 
          onClick={() => handleSaveCard(editingCardId || undefined)}
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
            {editingCardId ? 'Update word' : 'Add word'}
          </span>
        </button>
      </div>
    </div>
  );

  const isSaveDisabled = !deckName.trim() || selectedWords.length === 0;

  return (
    <div className="sensei-ai-view">
      {confirmAction && (
        <div className="modal-overlay" onClick={() => handleCancelAction(false)}>
          <div className="confirmation-modal" onClick={(e) => e.stopPropagation()} style={{
            width: '571px',
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
                height: '24px',
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
                {confirmAction.title}
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
                {confirmAction.subheading}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px', alignSelf: 'flex-end' }}>
              <button 
                className="secondary-btn modal-secondary-btn" 
                onClick={() => handleCancelAction(true)}
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
                  {confirmAction.cancelText}
                </span>
              </button>
              <button 
                className="primary-btn modal-primary-btn" 
                onClick={handleConfirmAction}
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
                  backgroundColor: (confirmAction.type === 'unsaved' ? '#060543' : '#ffe6e6'),
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <span style={{
                  fontFamily: "'Noto Sans JP', sans-serif",
                  fontSize: '16px',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  color: (confirmAction.type === 'unsaved' ? '#fcfcfc' : '#d73d3d'),
                  lineHeight: '1'
                }}>
                  {confirmAction.confirmText}
                </span>
                {confirmAction.type !== 'unsaved' && (
                  <img 
                    src={deleteIcon} 
                    alt="" 
                    style={{ 
                      width: '20px', 
                      height: '20px', 
                      filter: 'brightness(0) saturate(100%) invert(34%) sepia(86%) saturate(1914%) hue-rotate(336deg) brightness(89%) contrast(91%)' // #d73d3d
                    }} 
                  />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="sensei-ai-header">
        <button className="text-link-btn back-btn" onClick={handleBackWithCheck}>
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
                className="primary-btn add-word-btn" 
                onClick={() => {
                  setIsAddingNew(true);
                  setCardFormData({ kanji: '', kana: '', meaning: '', example: '' });
                }}
                style={{ 
                  padding: '8px 16px', 
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#fcfcfc',
                  border: '1px solid #5856eb',
                  color: '#5856eb',
                  borderRadius: '18px'
                }}
              >
                <img 
                  src={plusIcon} 
                  alt="" 
                  style={{ 
                    width: '18px', 
                    height: '18px', 
                    filter: 'brightness(0) saturate(100%) invert(32%) sepia(94%) saturate(4529%) hue-rotate(236deg) brightness(97%) contrast(93%)' // #5856eb
                  }} 
                />
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
                        <button className="remove-word" onClick={() => confirmDeleteWord(word.id)}>×</button>
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
              onClick={confirmDeleteDeck} 
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
                Delete deck
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
            className={`primary-btn ${isSaveDisabled ? '' : 'modal-primary-btn'}`} 
            onClick={handleCreateOrUpdateDeck} 
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
              cursor: isSaveDisabled ? 'not-allowed' : 'pointer',
              backgroundColor: isSaveDisabled ? '#f4f4f7' : '#060543',
              border: 'none'
            }}
          >
            <span style={{
              height: '19px',
              fontFamily: "'Noto Sans JP', sans-serif",
              fontSize: '16px',
              fontWeight: 'bold',
              textAlign: 'center',
              color: isSaveDisabled ? '#8f8e96' : '#fcfcfc',
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
