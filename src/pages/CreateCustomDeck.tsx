import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAppContext } from '../AppContext';
import type { Deck, Flashcard } from '../types';
import leftArrow from '../assets/ic_round-keyboard-arrow-left.svg';
import plusIcon from '../assets/ic_round-plus.svg';
import deleteIcon from '../assets/ic_round-delete-outline.svg';
import dragIcon from '../assets/ic_round-drag-indicator.svg';

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
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  
  // Track initial state to detect changes
  const initialDataRef = useRef<{ name: string, words: Flashcard[] }>({ name: '', words: [] });
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // State for master input row and drag-and-drop reordering
  const [masterFormData, setMasterFormData] = useState({
    kanji: '',
    kana: '',
    meaning: '',
    example: ''
  });
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const masterWordInputRef = useRef<HTMLInputElement>(null);

  // State for spreadsheet import modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importRawText, setImportRawText] = useState('');

  // Helper to parse spreadsheet TSV data
  const parseSpreadsheetText = (rawText: string) => {
    if (!rawText.trim()) return [];
    const lines = rawText.split(/\r\n|\n|\r/).filter(line => line.trim().length > 0);
    if (lines.length === 0) return [];

    // Check if first row is a header row
    const headerKeywords = ['kanji', 'kana', 'meaning', 'word', 'example', 'definition', 'translation', 'vocabulary', 'english', 'japanese'];
    const firstLineCols = lines[0].split('\t').map(c => c.trim().toLowerCase());
    const hasHeader = firstLineCols.some(col => headerKeywords.some(kw => col.includes(kw)));
    const startIndex = hasHeader ? 1 : 0;

    const results: { kanji: string; kana: string; meaning: string; example: string; isValid: boolean }[] = [];
    for (let i = startIndex; i < lines.length; i++) {
      const cols = lines[i].split('\t').map(c => c.trim());
      let kanji = '';
      let kana = '';
      let meaning = '';
      let example = '';

      if (cols.length >= 4) {
        kanji = cols[0];
        kana = cols[1];
        meaning = cols[2];
        example = cols[3];
      } else if (cols.length === 3) {
        kanji = cols[0];
        kana = cols[1];
        meaning = cols[2];
      } else if (cols.length === 2) {
        kana = cols[0];
        meaning = cols[1];
      } else if (cols.length === 1) {
        kana = cols[0];
      }

      const isValid = !!kanji && !!kana && !!meaning;
      results.push({ kanji, kana, meaning, example, isValid });
    }
    return results;
  };

  const parsedImportRows = useMemo(() => parseSpreadsheetText(importRawText), [importRawText]);
  const validImportRows = useMemo(() => parsedImportRows.filter(r => r.isValid), [parsedImportRows]);

  const handleConfirmImport = () => {
    if (validImportRows.length === 0) return;
    const newCards: Flashcard[] = validImportRows.map((r, idx) => ({
      id: `custom-card-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      kanji: r.kanji,
      kana: r.kana,
      meaning: r.meaning,
      example: r.example,
      state: 'to-be-learnt'
    }));

    setSelectedWords(prev => [...newCards, ...prev]);
    showToast(`Imported ${newCards.length} card${newCards.length > 1 ? 's' : ''} from spreadsheet.`);
    setIsImportModalOpen(false);
    setImportRawText('');
  };

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
    if (confirmAction || isImportModalOpen) {
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
  }, [confirmAction, isImportModalOpen]);

  const handleAddCardFromMaster = () => {
    if (!masterFormData.kanji.trim() || !masterFormData.kana.trim() || !masterFormData.meaning.trim()) {
      showToast('Word, Kana, and Meaning are required.');
      return;
    }

    const cardToAdd: Flashcard = {
      id: `custom-card-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      kanji: masterFormData.kanji.trim(),
      kana: masterFormData.kana.trim(),
      meaning: masterFormData.meaning.trim(),
      example: masterFormData.example.trim(),
      state: 'to-be-learnt'
    };

    setSelectedWords(prev => [cardToAdd, ...prev]);
    setMasterFormData({ kanji: '', kana: '', meaning: '', example: '' });
    showToast('Card added.');
    masterWordInputRef.current?.focus();
  };

  const handleMasterKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCardFromMaster();
    }
  };

  const handleUpdateCardField = (id: string, field: keyof Flashcard, value: string) => {
    setSelectedWords(prev => prev.map(card => 
      card.id === id ? { ...card, [field]: value } : card
    ));
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragEnter = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    setSelectedWords(prev => {
      const updated = [...prev];
      const [movedItem] = updated.splice(draggedIndex, 1);
      updated.splice(targetIndex, 0, movedItem);
      return updated;
    });
    setDraggedIndex(targetIndex);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
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

  const isSaveDisabled = !deckName.trim() || selectedWords.length === 0;

  return (
    <div className="sensei-ai-view">
      {confirmAction && (
        <div className="modal-overlay" onClick={() => handleCancelAction(false)}>
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
            <div className="modal-button-container" style={{ 
              display: 'flex', 
              gap: '16px', 
              alignSelf: 'flex-end',
              width: '100%',
              justifyContent: 'flex-end',
              flexDirection: confirmAction.type === 'unsaved' ? 'row-reverse' : 'row'
            }}>
              <button 
                className={`primary-btn ${confirmAction.type === 'unsaved' ? 'modal-primary-btn' : 'modal-delete-btn'}`} 
                onClick={handleConfirmAction}
                style={{ 
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
                  cursor: 'pointer',
                  minWidth: '160px'
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
              <button 
                className="secondary-btn modal-secondary-btn" 
                onClick={() => handleCancelAction(true)}
                style={{ 
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
                  cursor: 'pointer',
                  minWidth: '160px'
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
            </div>
          </div>
        </div>
      )}

      {/* Spreadsheet Import Modal */}
      {isImportModalOpen && (
        <div className="modal-overlay" onClick={() => { setIsImportModalOpen(false); setImportRawText(''); }}>
          <div 
            className="confirmation-modal" 
            onClick={(e) => e.stopPropagation()} 
            style={{
              width: 'min(660px, 92vw)',
              maxHeight: '88vh',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              gap: '20px',
              padding: '32px',
              borderRadius: '12px',
              border: 'solid 1px #ededf0',
              backgroundColor: '#fcfcfc',
              boxSizing: 'border-box',
              overflowY: 'auto'
            }}
          >
            <div>
              <div style={{
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: '20px',
                fontWeight: 'bold',
                textAlign: 'left',
                color: '#060543',
                marginBottom: '6px'
              }}>
                Import cards from spreadsheet
              </div>
              <div style={{
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: '14px',
                color: '#2f2f3b',
                lineHeight: '1.4'
              }}>
                Copy rows from Excel or Google Sheets (Cmd+C / Ctrl+C) and paste them below to add cards in bulk.
              </div>
            </div>

            {/* Column Guide Box */}
            <div style={{
              backgroundColor: '#f4f4f7',
              border: '1px solid #ededf0',
              borderRadius: '8px',
              padding: '12px 16px',
              boxSizing: 'border-box'
            }}>
              <div style={{
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: '12px',
                fontWeight: 'bold',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                color: '#060543',
                marginBottom: '8px'
              }}>
                Expected Column Order:
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
                marginBottom: '8px'
              }}>
                <div style={{ background: '#ffffff', padding: '6px 8px', borderRadius: '4px', border: '1px solid #ededf0', fontSize: '12px' }}>
                  <span style={{ color: '#8F8E96', fontSize: '10px', display: 'block' }}>Col 1</span>
                  <strong style={{ color: '#4F46E5' }}>Word *</strong>
                </div>
                <div style={{ background: '#ffffff', padding: '6px 8px', borderRadius: '4px', border: '1px solid #ededf0', fontSize: '12px' }}>
                  <span style={{ color: '#8F8E96', fontSize: '10px', display: 'block' }}>Col 2</span>
                  <strong style={{ color: '#4F46E5' }}>Kana *</strong>
                </div>
                <div style={{ background: '#ffffff', padding: '6px 8px', borderRadius: '4px', border: '1px solid #ededf0', fontSize: '12px' }}>
                  <span style={{ color: '#8F8E96', fontSize: '10px', display: 'block' }}>Col 3</span>
                  <strong style={{ color: '#4F46E5' }}>Meaning *</strong>
                </div>
                <div style={{ background: '#ffffff', padding: '6px 8px', borderRadius: '4px', border: '1px solid #ededf0', fontSize: '12px' }}>
                  <span style={{ color: '#8F8E96', fontSize: '10px', display: 'block' }}>Col 4</span>
                  <strong style={{ color: '#060543' }}>Example</strong>
                </div>
              </div>
              <div style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: '12px', color: '#8F8E96', lineHeight: '1.4' }}>
                * Required fields (Word, Kana, and Meaning). Header rows are automatically detected and skipped.
              </div>
            </div>

            {/* Paste Textarea */}
            <div>
              <div className="field-label" style={{ marginBottom: '8px' }}>Paste spreadsheet cells</div>
              <textarea
                value={importRawText}
                onChange={(e) => setImportRawText(e.target.value)}
                placeholder="Paste copied cells here (Cmd+V or Ctrl+V)..."
                rows={4}
                style={{
                  width: '100%',
                  height: '110px',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #ededf0',
                  backgroundColor: '#ffffff',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                  outline: 'none',
                  resize: 'vertical'
                }}
                className="deck-table-input"
              />
            </div>

            {/* Parsed Preview Table */}
            {parsedImportRows.length > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div className="field-label" style={{ margin: 0 }}>
                    Preview ({validImportRows.length} valid / {parsedImportRows.length} total)
                  </div>
                  {validImportRows.length < parsedImportRows.length && (
                    <span style={{ fontSize: '12px', color: '#d73d3d', fontWeight: 'bold' }}>
                      {parsedImportRows.length - validImportRows.length} row(s) missing required fields
                    </span>
                  )}
                </div>
                <div style={{
                  maxHeight: '150px',
                  overflowY: 'auto',
                  border: '1px solid #ededf0',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#f8f8fa', borderBottom: '1px solid #ededf0', color: '#8F8E96' }}>
                        <th style={{ padding: '8px 10px', fontWeight: 'bold' }}>Word *</th>
                        <th style={{ padding: '8px 10px', fontWeight: 'bold' }}>Kana *</th>
                        <th style={{ padding: '8px 10px', fontWeight: 'bold' }}>Meaning *</th>
                        <th style={{ padding: '8px 10px', fontWeight: 'bold' }}>Example</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedImportRows.map((r, i) => (
                        <tr key={i} style={{
                          borderBottom: '1px solid #f4f4f7',
                          backgroundColor: r.isValid ? 'transparent' : '#fff5f5'
                        }}>
                          <td style={{ padding: '8px 10px', color: r.kanji ? '#060543' : '#d73d3d', fontWeight: r.kanji ? 'normal' : 'bold' }}>
                            {r.kanji || '(missing)'}
                          </td>
                          <td style={{ padding: '8px 10px', color: r.kana ? '#060543' : '#d73d3d', fontWeight: r.kana ? 'normal' : 'bold' }}>
                            {r.kana || '(missing)'}
                          </td>
                          <td style={{ padding: '8px 10px', color: r.meaning ? '#060543' : '#d73d3d', fontWeight: r.meaning ? 'normal' : 'bold' }}>
                            {r.meaning || '(missing)'}
                          </td>
                          <td style={{ padding: '8px 10px', color: '#64748B', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {r.example || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="modal-button-container" style={{ 
              display: 'flex', 
              gap: '16px', 
              alignSelf: 'flex-end',
              width: '100%',
              justifyContent: 'flex-end',
              marginTop: '6px'
            }}>
              <button 
                className="secondary-btn modal-secondary-btn" 
                onClick={() => { setIsImportModalOpen(false); setImportRawText(''); }}
                style={{ 
                  height: '44px', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  padding: '12px 24px', 
                  borderRadius: '6px',
                  backgroundColor: '#f4f4f7',
                  border: 'none',
                  cursor: 'pointer',
                  minWidth: '120px'
                }}
              >
                <span style={{
                  fontFamily: "'Noto Sans JP', sans-serif",
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#060543'
                }}>
                  Cancel
                </span>
              </button>
              <button 
                className="primary-btn modal-primary-btn" 
                onClick={handleConfirmImport}
                disabled={validImportRows.length === 0}
                style={{ 
                  height: '44px', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  gap: '8px', 
                  padding: '12px 24px', 
                  borderRadius: '8px',
                  cursor: validImportRows.length === 0 ? 'not-allowed' : 'pointer',
                  backgroundColor: validImportRows.length === 0 ? '#ededf0' : '#060543',
                  border: 'none',
                  minWidth: '160px'
                }}
              >
                <span style={{
                  fontFamily: "'Noto Sans JP', sans-serif",
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: validImportRows.length === 0 ? '#8F8E96' : '#fcfcfc'
                }}>
                  {validImportRows.length > 0 ? `Add ${validImportRows.length} card${validImportRows.length > 1 ? 's' : ''}` : 'Add cards'}
                </span>
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
          margin: '0 0 8px 0'
        }}>
          {editingDeckId ? 'Edit custom deck' : 'Create your own decks'}
        </h2>
        <p style={{
          fontFamily: "'Noto Sans JP', sans-serif",
          fontSize: '16px',
          color: '#8F8E96',
          margin: '0 0 32px 0',
          fontWeight: '500'
        }}>
          Build custom decks that suit your study needs
        </p>
        
        <div className="deck-name-input" style={{ marginBottom: '32px' }}>
          <div className="field-label">Deck name</div>
          <input 
            type="text" 
            value={deckName} 
            onChange={(e) => setDeckName(e.target.value)} 
            placeholder="Give a name to your deck"
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

        <div className="words-table-section" style={{ width: '100%', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ 
              fontFamily: "'Noto Sans JP', sans-serif",
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#060543', 
              margin: 0 
            }}>
              Flashcards ({selectedWords.length})
            </h3>
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #ededf0',
                backgroundColor: '#ffffff',
                color: '#060543',
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#4F46E5';
                e.currentTarget.style.color = '#4F46E5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#ededf0';
                e.currentTarget.style.color = '#060543';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="3" y1="15" x2="21" y2="15"></line>
                <line x1="9" y1="3" x2="9" y2="21"></line>
                <line x1="15" y1="3" x2="15" y2="21"></line>
              </svg>
              Import from spreadsheet
            </button>
          </div>

          <div className="deck-table-container">
            <div className="deck-table-content">
              {/* Table Column Headers */}
              <div className="deck-table-header">
                <div className="field-label" style={{ margin: 0 }}>Word *</div>
                <div className="field-label" style={{ margin: 0 }}>Kana *</div>
                <div className="field-label" style={{ margin: 0 }}>Meaning *</div>
                <div className="field-label" style={{ margin: 0 }}>Example</div>
                <div className="field-label" style={{ margin: 0, textAlign: 'right' }}>Action</div>
              </div>

              {/* Master Row (Always visible by default at the top) */}
              <div className="deck-table-master-row">
                <input
                  ref={masterWordInputRef}
                  type="text"
                  value={masterFormData.kanji}
                  onChange={(e) => setMasterFormData({ ...masterFormData, kanji: e.target.value })}
                  onKeyDown={handleMasterKeyDown}
                  placeholder="e.g., 食べる"
                  className="deck-table-input"
                />
                <input
                  type="text"
                  value={masterFormData.kana}
                  onChange={(e) => setMasterFormData({ ...masterFormData, kana: e.target.value })}
                  onKeyDown={handleMasterKeyDown}
                  placeholder="e.g., たべる"
                  className="deck-table-input"
                />
                <input
                  type="text"
                  value={masterFormData.meaning}
                  onChange={(e) => setMasterFormData({ ...masterFormData, meaning: e.target.value })}
                  onKeyDown={handleMasterKeyDown}
                  placeholder="e.g., to eat"
                  className="deck-table-input"
                />
                <input
                  type="text"
                  value={masterFormData.example}
                  onChange={(e) => setMasterFormData({ ...masterFormData, example: e.target.value })}
                  onKeyDown={handleMasterKeyDown}
                  placeholder="e.g., りんごを食べる。"
                  className="deck-table-input"
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="primary-btn add-word-btn"
                    onClick={handleAddCardFromMaster}
                    style={{
                      height: '38px',
                      padding: '0 14px',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: '#fcfcfc',
                      border: '1px solid #4F46E5',
                      color: '#4F46E5',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <img
                      src={plusIcon}
                      alt=""
                      style={{
                        width: '16px',
                        height: '16px',
                        filter: 'brightness(0) saturate(100%) invert(26%) sepia(89%) saturate(5943%) hue-rotate(238deg) brightness(92%) contrast(98%)'
                      }}
                    />
                    Add card
                  </button>
                </div>
              </div>

              {/* Added Cards Rows */}
              {selectedWords.length === 0 ? (
                <div className="deck-table-empty">
                  No cards added yet. Enter word details in the row above and click "Add card" or press Enter.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedWords.map((card, index) => {
                    const isDragging = draggedIndex === index;
                    return (
                      <div
                        key={card.id}
                        onDragEnter={(e) => handleDragEnter(e, index)}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className={`deck-table-row ${isDragging ? 'dragging' : ''}`}
                      >
                        <input
                          type="text"
                          value={card.kanji || ''}
                          onChange={(e) => handleUpdateCardField(card.id, 'kanji', e.target.value)}
                          placeholder="Word"
                          className="deck-table-input"
                        />
                        <input
                          type="text"
                          value={card.kana || ''}
                          onChange={(e) => handleUpdateCardField(card.id, 'kana', e.target.value)}
                          placeholder="Kana"
                          className="deck-table-input"
                        />
                        <input
                          type="text"
                          value={card.meaning || ''}
                          onChange={(e) => handleUpdateCardField(card.id, 'meaning', e.target.value)}
                          placeholder="Meaning"
                          className="deck-table-input"
                        />
                        <input
                          type="text"
                          value={card.example || ''}
                          onChange={(e) => handleUpdateCardField(card.id, 'example', e.target.value)}
                          placeholder="Example sentence"
                          className="deck-table-input"
                        />
                        <div className="deck-table-actions">
                          <div
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragEnd={handleDragEnd}
                            className="deck-table-drag-handle"
                            title="Drag to reorder"
                          >
                            <img
                              src={dragIcon}
                              alt="Drag to reorder"
                              style={{ width: '18px', height: '18px', opacity: 0.6 }}
                            />
                          </div>
                          <button
                            type="button"
                            className="deck-table-delete-btn"
                            title="Delete card"
                            onClick={() => confirmDeleteWord(card.id)}
                          >
                            <img
                              src={deleteIcon}
                              alt="Delete"
                              style={{
                                width: '18px',
                                height: '18px',
                                filter: 'brightness(0) saturate(100%) invert(34%) sepia(86%) saturate(1914%) hue-rotate(336deg) brightness(89%) contrast(91%)'
                              }}
                            />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="review-actions" style={{ marginTop: '40px', display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
          {editingDeckId && (
            <button 
              className="delete-btn modal-delete-btn" 
              onClick={confirmDeleteDeck} 
              style={{ 
                marginRight: 'auto',
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
            className={`primary-btn save-deck-btn ${isSaveDisabled ? '' : 'modal-primary-btn'}`} 
            onClick={handleCreateOrUpdateDeck} 
            style={{ 
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
