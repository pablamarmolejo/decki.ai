import React, { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import StudyDecks from './pages/StudyDecks';
import MasteryPractice from './pages/MasteryPractice';
import CreateCustomDeck from './pages/CreateCustomDeck';
import Flashcards from './pages/Flashcards';
import LevelSelection from './pages/LevelSelection';
import { AppProvider } from './AppContext';
import './index.css';

type Page = 'STUDY_DECKS' | 'MASTERY_PRACTICE' | 'CREATE_CUSTOM_DECK' | 'FLASHCARDS' | 'LEVEL_SELECTION';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('LEVEL_SELECTION');
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Scroll to top on page change
  React.useEffect(() => {
    window.scrollTo(0, 0);
    // Also reset minimalist container scroll if it exists
    const container = document.querySelector('.minimalist-mode-container');
    if (container) container.scrollTop = 0;
  }, [currentPage]);

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
                      Study decks
                    </button>
                    <button
                      className={`section-btn ${currentPage === 'MASTERY_PRACTICE' ? 'active' : ''}`}
                      onClick={() => setCurrentPage('MASTERY_PRACTICE')}
                    >
                      Mastery practice
                    </button>
                  </div>
                </div>
              )}
              {renderPage()}
            </main>
            {toast && <div className="toast-notification">{toast}</div>}
          </div>
          {!isMinimalistMode && <Footer />}
        </>
      </AppProvider>
    );
  };

export default App;
