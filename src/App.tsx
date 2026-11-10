import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate, useLocation, useParams } from 'react-router-dom';
import { AppProvider } from './AppContext';
import Header from './components/Header';
import Footer from './components/Footer';
import StudyDecks from './pages/StudyDecks';
import MasteryPractice from './pages/MasteryPractice';
import Quiz from './pages/Quiz';
import CreateCustomDeck from './pages/CreateCustomDeck';
import Flashcards from './pages/Flashcards';
import LevelSelection from './pages/LevelSelection';
import NotFound from './pages/NotFound';
import icDecks from './assets/ic_round-style.svg';
import icPractice from './assets/ic_round-edit-note.svg';
import icQuiz from './assets/ic_round-school.svg';
import icPlus from './assets/ic_round-plus.svg';
import './index.css';

// ─── Toast context ──────────────────────────────────────────────────────────
const ToastContext = React.createContext<(msg: string) => void>(() => {});
export const useToast = () => React.useContext(ToastContext);

// ─── Shell layout (header + section nav + footer) ───────────────────────────
const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [toast, setToast] = React.useState<string | null>(null);

  const showToast = React.useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const isDecksActive = location.pathname.startsWith('/decks');
  const isQuizActive = location.pathname.startsWith('/quiz');
  const isPracticeActive = location.pathname === '/practice';

  return (
    <ToastContext.Provider value={showToast}>
      <Header onNavigateToLevelSelection={() => navigate('/level')} />
      <div className="app-container">
        <main className="main-content">
          <div className="section-selector">
            <div className="section-nav-pill">
              <NavLink
                to="/decks"
                className={() => `section-btn${isDecksActive ? ' active' : ''}`}
              >
                Decks
              </NavLink>
              <NavLink
                to="/quiz"
                className={() => `section-btn${isQuizActive ? ' active' : ''}`}
              >
                Quiz
              </NavLink>
              <NavLink
                to="/practice"
                className={() => `section-btn${isPracticeActive ? ' active' : ''}`}
              >
                Practice
              </NavLink>
            </div>
          </div>
          {children}
        </main>
        {toast && <div className="toast-notification">{toast}</div>}
        <Footer />
      </div>
      {/* Mobile bottom nav */}
      <div className="mobile-nav-container">
        {isDecksActive && location.pathname === '/decks' && (
          <button
            className="mobile-create-fab"
            onClick={() => navigate('/decks/new')}
            aria-label="Create custom deck"
          >
            <img src={icPlus} alt="" className="mobile-create-icon" />
          </button>
        )}
        <div className="mobile-bottom-nav">
          <button
            className={`mobile-nav-item${isDecksActive ? ' active' : ''}`}
            onClick={() => navigate('/decks')}
          >
            <img src={icDecks} alt="Decks" className="mobile-nav-icon" />
            <span>Decks</span>
          </button>
          <button
            className={`mobile-nav-item${isQuizActive ? ' active' : ''}`}
            onClick={() => navigate('/quiz')}
          >
            <img src={icQuiz} alt="Quiz" className="mobile-nav-icon" />
            <span>Quiz</span>
          </button>
          <button
            className={`mobile-nav-item${isPracticeActive ? ' active' : ''}`}
            onClick={() => navigate('/practice')}
          >
            <img src={icPractice} alt="Practice" className="mobile-nav-icon" />
            <span>Practice</span>
          </button>
        </div>
      </div>
    </ToastContext.Provider>
  );
};

// ─── Minimalist layout (no nav — used for flashcards & create deck) ──────────
const MinimalistShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = React.useState<string | null>(null);

  const showToast = React.useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      <div className="minimalist-mode-container">
        <main className="main-content">
          {children}
        </main>
        {toast && <div className="toast-notification">{toast}</div>}
      </div>
    </ToastContext.Provider>
  );
};

// ─── Level selection layout ──────────────────────────────────────────────────
const LevelShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="level-selection-page">
    <main className="main-content">{children}</main>
    <Footer />
  </div>
);

// ─── Root redirect: first-time users go to /level, returning users to /decks ─
const RootRedirect: React.FC = () => {
  const hasLevel = Boolean(localStorage.getItem('decki-current-level'));
  return <Navigate to={hasLevel ? '/decks' : '/level'} replace />;
};

// ─── Route wrapper: reads :deckId and passes settings from router state ───────
const FlashcardsRoute: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const settings = (location.state as { settings?: unknown } | null)?.settings as Parameters<typeof Flashcards>[0]['settings'];

  if (!deckId) return <Navigate to="/decks" replace />;

  return (
    <Flashcards
      deckId={deckId}
      settings={settings}
      onBack={() => navigate('/decks')}
      onNavigateToMastery={() => navigate('/practice')}
    />
  );
};

// ─── Route wrapper: reads :deckId for edit mode ───────────────────────────────
const CreateCustomDeckEdit: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();
  if (!deckId) return <Navigate to="/decks" replace />;
  return <CreateCustomDeck editingDeckId={deckId} />;
};

// ─── App ─────────────────────────────────────────────────────────────────────
const App: React.FC = () => (
  <AppProvider>
    <BrowserRouter basename="/decki.ai">
      <Routes>
        {/* Root — smart redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* Level selection — full-page layout */}
        <Route
          path="/level"
          element={
            <LevelShell>
              <LevelSelection />
            </LevelShell>
          }
        />

        {/* Main app shell — shared header + section nav + footer */}
        <Route
          path="/decks"
          element={
            <Shell>
              <StudyDecks />
            </Shell>
          }
        />
        <Route
          path="/quiz"
          element={
            <Shell>
              <Quiz />
            </Shell>
          }
        />
        <Route
          path="/practice"
          element={
            <Shell>
              <MasteryPractice />
            </Shell>
          }
        />

        {/* Minimalist shell — no header/nav */}
        <Route
          path="/decks/new"
          element={
            <MinimalistShell>
              <CreateCustomDeck editingDeckId={null} />
            </MinimalistShell>
          }
        />
        <Route
          path="/decks/:deckId/edit"
          element={
            <MinimalistShell>
              <CreateCustomDeckEdit />
            </MinimalistShell>
          }
        />
        <Route
          path="/decks/:deckId"
          element={
            <MinimalistShell>
              <FlashcardsRoute />
            </MinimalistShell>
          }
        />

        {/* Quiz active session — minimalist layout */}
        <Route
          path="/quiz/session"
          element={
            <MinimalistShell>
              <Quiz sessionMode />
            </MinimalistShell>
          }
        />

        {/* 404 catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </AppProvider>
);

export default App;
