import React from 'react';

export default function Header({
  positionTheme,
  setPositionTheme,
  onOpenHistory,
  historyCount,
  onOpenGallery,
  isHistoryOpen = false,
  onNewReading
}) {
  return (
    <header className="border-b border-gray-100 bg-white sticky top-0 z-30 transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onNewReading || (() => onOpenHistory && onOpenHistory(false))}
            className="text-left group cursor-pointer"
          >
            <h1 className="font-sans text-lg sm:text-xl font-bold tracking-tight text-gray-900">
              Tarot AI
            </h1>
          </button>
        </div>

        {/* Right Navigation Pills */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onNewReading || (() => onOpenHistory && onOpenHistory(false))}
            className={`px-3.5 py-1.5 text-sm font-medium rounded-xl transition-all ${
              !isHistoryOpen
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            New reading
          </button>

          <button
            onClick={() => onOpenHistory && onOpenHistory(true)}
            className={`px-3.5 py-1.5 text-sm font-medium rounded-xl transition-all ${
              isHistoryOpen
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            History
          </button>
        </div>
      </div>
    </header>
  );
}
