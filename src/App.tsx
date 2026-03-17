import React, { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import StudyDecks from './pages/StudyDecks';
import MasteryPractice from './pages/MasteryPractice';
import CreateCustomDeck from './pages/CreateCustomDeck';
import Flashcards from './pages/Flashcards';
import LevelSelection from './pages/LevelSelection';
import { AppProvider } from './AppContext';
import icDecks from './assets/ic_round-style.svg';
import icPractice from './assets/ic_round-edit-note.svg';
import icPlus from './assets/ic_round-plus.svg';
import './index.css';

type Page = 'STUDY_DECKS' | 'MASTERY_PRACTICE' | 'CREATE_CUSTOM_DECK' | 'FLASHCARDS' | 'LEVEL_SELECTION';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    const saved = localStorage.getItem('decki-current-page');
    const pages: Page[] = ['STUDY_DECKS', 'MASTERY_PRACTICE', 'CREATE_CUSTOM_DECK', 'FLASHCARDS', 'LEVEL_SELECTION'];
    return (saved && pages.includes(saved as Page)) ? (saved as Page) : 'LEVEL_SELECTION';
  });
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(() => localStorage.getItem('decki-selected-deck-id'));
  const [editingDeckId, setEditingDeckId] = useState<string | null>(() => localStorage.getItem('decki-editing-deck-id'));
  const [toast, setToast] = useState<string | null>(null);

  // Persistence effects
  React.useEffect(() => {
    localStorage.setItem('decki-current-page', currentPage);
  }, [currentPage]);

  React.useEffect(() => {
    if (selectedDeckId) localStorage.setItem('decki-selected-deck-id', selectedDeckId);
    else localStorage.removeItem('decki-selected-deck-id');
  }, [selectedDeckId]);

  React.useEffect(() => {
    if (editingDeckId) localStorage.setItem('decki-editing-deck-id', editingDeckId);
    else localStorage.removeItem('decki-editing-deck-id');
  }, [editingDeckId]);

  // Scroll to top on page change
  React.useEffect(() => {
    window.scrollTo(0, 0);
    // Also reset minimalist container scroll if it exists
    const container = document.querySelector('.minimalist-mode-container');
    if (container) container.scrollTop = 0;
  }, [currentPage]);

  // Safety redirect: If on FLASHCARDS but no deck selected, go to STUDY_DECKS
  React.useEffect(() => {
    if (currentPage === 'FLASHCARDS' && !selectedDeckId) {
      setCurrentPage('STUDY_DECKS');
    }
  }, [currentPage, selectedDeckId]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const navigateToDeck = (deckId: string) => {
    setSelectedDeckId(deckId);
    setCurrentPage('FLASHCARDS');
  };

  const handleEditDeck = (deckId: string) => {
    setEditingDeckId(deckId);
    setCurrentPage('CREATE_CUSTOM_DECK');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'LEVEL_SELECTION':
        return <LevelSelection onLevelSelected={() => setCurrentPage('STUDY_DECKS')} />;
      case 'STUDY_DECKS':
        return <StudyDecks onNavigateToCreate={() => { setEditingDeckId(null); setCurrentPage('CREATE_CUSTOM_DECK'); }} onNavigateToDeck={navigateToDeck} onEditDeck={handleEditDeck} />;
      case 'MASTERY_PRACTICE':
        return <MasteryPractice onNavigateToStudy={() => setCurrentPage('STUDY_DECKS')} />;
      case 'CREATE_CUSTOM_DECK':
        return <CreateCustomDeck onBack={() => setCurrentPage('STUDY_DECKS')} editingDeckId={editingDeckId} showToast={showToast} />;
      case 'FLASHCARDS':
        return selectedDeckId ? <Flashcards deckId={selectedDeckId} onBack={() => setCurrentPage('STUDY_DECKS')} onNavigateToMastery={() => setCurrentPage('MASTERY_PRACTICE')} /> : null;
      default:
        return <StudyDecks onNavigateToCreate={() => { setEditingDeckId(null); setCurrentPage('CREATE_CUSTOM_DECK'); }} onNavigateToDeck={navigateToDeck} onEditDeck={handleEditDeck} />;
    }
  };

    const isMinimalistMode = ['FLASHCARDS', 'CREATE_CUSTOM_DECK'].includes(currentPage);
    const isLevelSelection = currentPage === 'LEVEL_SELECTION';
  
    return (
      <AppProvider>
        <>
          {!isMinimalistMode && !isLevelSelection && (
            <Header 
              onNavigateToLevelSelection={() => setCurrentPage('LEVEL_SELECTION')}
            />
          )}
          <div className={isLevelSelection ? 'level-selection-page' : isMinimalistMode ? 'minimalist-mode-container' : 'app-container'}>
            <main className="main-content">
              {!isMinimalistMode && !isLevelSelection && (
                <div className="section-selector">
                  <div className="section-nav-pill">
                    <button
                      className={`section-btn ${['STUDY_DECKS', 'FLASHCARDS', 'CREATE_CUSTOM_DECK'].includes(currentPage) ? 'active' : ''}`}
                      onClick={() => setCurrentPage('STUDY_DECKS')}
                    >
                      Decks
                    </button>
                    <button
                      className={`section-btn ${currentPage === 'MASTERY_PRACTICE' ? 'active' : ''}`}
                      onClick={() => setCurrentPage('MASTERY_PRACTICE')}
                    >
                      Practice
                    </button>
                  </div>
                </div>
              )}
              {renderPage()}
            </main>
            {toast && <div className="toast-notification">{toast}</div>}
            {isLevelSelection && <Footer />}
          </div>
          {!isLevelSelection && (
            <div className="mobile-nav-container">
              {currentPage === 'STUDY_DECKS' && (
                <button 
                  className="mobile-create-fab"
                  onClick={() => { setEditingDeckId(null); setCurrentPage('CREATE_CUSTOM_DECK'); }}
                  aria-label="Create custom deck"
                >
                  <img src={icPlus} alt="" className="mobile-create-icon" />
                </button>
              )}
              <div className="mobile-bottom-nav">
                <button
                  className={`mobile-nav-item ${['STUDY_DECKS', 'FLASHCARDS', 'CREATE_CUSTOM_DECK'].includes(currentPage) ? 'active' : ''}`}
                  onClick={() => setCurrentPage('STUDY_DECKS')}
                >
                  <img src={icDecks} alt="Decks" className="mobile-nav-icon" />
                  <span>Decks</span>
                </button>
                <button
                  className={`mobile-nav-item ${currentPage === 'MASTERY_PRACTICE' ? 'active' : ''}`}
                  onClick={() => setCurrentPage('MASTERY_PRACTICE')}
                >
                  <img src={icPractice} alt="Practice" className="mobile-nav-icon" />
                  <span>Practice</span>
                </button>
              </div>
            </div>
          )}
          {!isMinimalistMode && !isLevelSelection && <Footer />}
        </>
      </AppProvider>
    );
  };

export default App;
