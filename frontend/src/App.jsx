import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import QuestionInput from './components/QuestionInput';
import SpreadBoard from './components/SpreadBoard';
import InterpretationView from './components/InterpretationView';
import HistoryDrawer from './components/HistoryDrawer';
import CardsGallery from './components/CardsGallery';
import Toast from './components/Toast';
import {
  initSession,
  drawSpread,
  interpretSpread,
  fetchRemoteHistory,
  saveRemoteReading,
  deleteRemoteReading,
  clearRemoteHistory,
  toggleRemoteFavorite
} from './services/api';
import {
  getHistory,
  saveReading,
  deleteReading,
  clearHistory,
  toggleFavoriteLocal
} from './services/storage';

export default function App() {
  const [spreadType, setSpreadType] = useState('three_card');
  const [positionTheme, setPositionTheme] = useState('past_present_future');
  const [question, setQuestion] = useState('');
  const [cards, setCards] = useState([]);
  const [spreadId, setSpreadId] = useState('');
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isInterpreting, setIsInterpreting] = useState(false);

  // Interpretation state
  const [interpretation, setInterpretation] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [isMock, setIsMock] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // History & Gallery modal state
  const [history, setHistory] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // Toast feedback state
  const [toast, setToast] = useState(null);

  const showToast = (toastData) => {
    setToast(toastData);
  };

  // Load user session & history on mount
  useEffect(() => {
    const loadInitialData = async () => {
      await initSession();
      const remoteHistory = await fetchRemoteHistory();
      if (remoteHistory && Array.isArray(remoteHistory)) {
        setHistory(remoteHistory);
      } else {
        setHistory(getHistory());
      }
    };
    loadInitialData();
  }, []);

  const handleSpreadTypeChange = (newType) => {
    setSpreadType(newType);
  };

  const handleThemeChange = (newTheme) => {
    setPositionTheme(newTheme);
  };

  // Draw cards and request AI interpretation end-to-end
  const handleDrawAndInterpret = async () => {
    setIsDrawing(true);
    setIsInterpreting(true);
    setInterpretation('');
    setErrorMessage('');

    const count = spreadType === 'one_card' ? 1 : spreadType === 'celtic_cross' ? 10 : 3;

    try {
      const data = await drawSpread(spreadType, count, positionTheme);
      setCards(data.cards);
      setSpreadId(data.spread_id);
      setFlippedIndices(Array.from({ length: count }, (_, i) => i));

      // Trigger AI interpretation
      const res = await interpretSpread(data.cards, question);
      setInterpretation(res.interpretation);
      setCreatedAt(res.created_at);
      setIsMock(Boolean(res.is_mock));

      const newReading = {
        spread_id: data.spread_id || 'spread-' + Date.now(),
        spread_type: spreadType,
        position_theme: positionTheme,
        question: question.trim(),
        cards: data.cards,
        interpretation: res.interpretation,
        created_at: res.created_at,
        is_mock: res.is_mock,
        is_favorite: false
      };

      // Save remotely and locally
      await saveRemoteReading(newReading);
      const updated = saveReading(newReading);
      setHistory(updated);

      showToast({ message: 'Reading saved to your history', type: 'success' });
    } catch (err) {
      console.error('Failed to draw or interpret spread', err);
      setErrorMessage(err.message || 'Unable to generate interpretation. Please try again.');
      showToast({ message: 'Failed to generate interpretation', type: 'error' });
    } finally {
      setIsDrawing(false);
      setIsInterpreting(false);
    }
  };

  const handleFlipCard = (index) => {
    setFlippedIndices(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleSelectHistoryReading = (reading) => {
    setCards(reading.cards || []);
    setSpreadId(reading.spread_id);
    setQuestion(reading.question || '');
    setInterpretation(reading.interpretation || '');
    setCreatedAt(reading.created_at || reading.savedAt);
    setIsMock(Boolean(reading.is_mock));
    setSpreadType(reading.spread_type || 'three_card');
    setFlippedIndices(Array.from({ length: reading.cards?.length || 3 }, (_, i) => i));
    if (reading.position_theme) {
      setPositionTheme(reading.position_theme);
    }
    setIsHistoryOpen(false);
  };

  const handleDeleteHistoryReading = async (id) => {
    await deleteRemoteReading(id);
    const updated = deleteReading(id);
    setHistory(updated);
    showToast({ message: 'Reading removed from history', type: 'info' });
  };

  const handleClearHistory = async () => {
    await clearRemoteHistory();
    clearHistory();
    setHistory([]);
    showToast({ message: 'All reading history cleared', type: 'info' });
  };

  const handleToggleFavorite = async (id, forcedStatus) => {
    // Optimistically update local state & storage
    const updated = toggleFavoriteLocal(id, forcedStatus);
    setHistory(updated);

    // Call backend endpoint
    await toggleRemoteFavorite(id, forcedStatus);

    const isFav = updated.find(i => i.spread_id === id)?.is_favorite;
    showToast({
      message: isFav ? 'Added to favorites' : 'Removed from favorites',
      type: 'success'
    });
  };

  const handleBackToNewReading = () => {
    setInterpretation('');
    setErrorMessage('');
    setIsHistoryOpen(false);
  };

  const handleResetNewReading = () => {
    setInterpretation('');
    setErrorMessage('');
    setQuestion('');
    setCards([]);
    setIsHistoryOpen(false);
  };

  const isReadingResult = Boolean(interpretation || isInterpreting || errorMessage);

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col justify-between font-sans selection:bg-gray-200 selection:text-black">
      {/* Top Minimalist Header */}
      <Header
        positionTheme={positionTheme}
        setPositionTheme={handleThemeChange}
        onOpenHistory={(open) => setIsHistoryOpen(open)}
        isHistoryOpen={isHistoryOpen}
        historyCount={history.length}
        onOpenGallery={() => setIsGalleryOpen(true)}
        onNewReading={handleResetNewReading}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {isHistoryOpen ? (
          /* PAGE 3: HISTORY VIEW */
          <HistoryDrawer
            isOpen={true}
            onClose={() => setIsHistoryOpen(false)}
            history={history}
            onSelectReading={handleSelectHistoryReading}
            onDeleteReading={handleDeleteHistoryReading}
            onClearHistory={handleClearHistory}
            onToggleFavorite={handleToggleFavorite}
          />
        ) : isReadingResult ? (
          /* PAGE 2: SPREAD RESULT VIEW */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Drawn Cards */}
            <div className="lg:col-span-7">
              <SpreadBoard
                cards={cards}
                flippedIndices={flippedIndices}
                onFlipCard={handleFlipCard}
                onDrawNewSpread={handleDrawAndInterpret}
                isDrawing={isDrawing}
                isInterpreting={isInterpreting}
                hasInterpretation={true}
                question={question}
                createdAt={createdAt}
                onBackToNewReading={handleBackToNewReading}
                spreadType={spreadType}
              />
            </div>

            {/* Right: AI Interpretation */}
            <div className="lg:col-span-5">
              <InterpretationView
                interpretation={interpretation}
                createdAt={createdAt}
                isMock={isMock}
                isLoading={isInterpreting}
                onNewReading={handleResetNewReading}
                onShowToast={showToast}
                errorMessage={errorMessage}
                onRetry={handleDrawAndInterpret}
              />
            </div>
          </div>
        ) : (
          /* PAGE 1: NEW READING FORM VIEW */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: New Reading Form */}
            <div className="lg:col-span-7">
              <QuestionInput
                question={question}
                setQuestion={setQuestion}
                disabled={isDrawing || isInterpreting}
                onDrawCards={handleDrawAndInterpret}
                isDrawing={isDrawing}
                spreadType={spreadType}
                onSelectSpreadType={handleSpreadTypeChange}
              />
            </div>

            {/* Right: Spread Preview Outline Box */}
            <div className="lg:col-span-5">
              <SpreadBoard
                cards={cards}
                flippedIndices={flippedIndices}
                onFlipCard={handleFlipCard}
                onDrawNewSpread={handleDrawAndInterpret}
                isDrawing={isDrawing}
                isInterpreting={isInterpreting}
                hasInterpretation={false}
                question={question}
                createdAt={createdAt}
                spreadType={spreadType}
              />
            </div>
          </div>
        )}
      </main>

      {/* Clean Minimalist Footer */}
      <footer className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 text-xs text-gray-400">
        <p>Free · No sign-up · History stays in your browser</p>
      </footer>

      {/* 78-Card Encyclopedia Modal */}
      <CardsGallery
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
      />

      {/* Toast Feedback */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
