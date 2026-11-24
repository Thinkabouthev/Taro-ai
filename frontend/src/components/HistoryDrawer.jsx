import React, { useState } from 'react';
import { Star, Trash2 } from 'lucide-react';

export default function HistoryDrawer({
  isOpen,
  onClose,
  history = [],
  onSelectReading,
  onDeleteReading,
  onClearHistory,
  onToggleFavorite
}) {
  const [filter, setFilter] = useState('all');

  if (!isOpen) return null;

  // Counts for filters
  const counts = {
    all: history.length,
    three_card: history.filter(i => (i.cards?.length === 3 || i.spread_type === 'three_card')).length,
    one_card: history.filter(i => (i.cards?.length === 1 || i.spread_type === 'one_card')).length,
    favorites: history.filter(i => Boolean(i.is_favorite)).length,
  };

  // Filter items
  const filteredHistory = history.filter((item) => {
    if (filter === 'three_card') {
      return item.spread_type === 'three_card' || item.cards?.length === 3;
    }
    if (filter === 'one_card') {
      return item.spread_type === 'one_card' || item.cards?.length === 1;
    }
    if (filter === 'favorites') {
      return Boolean(item.is_favorite);
    }
    return true;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recently';
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`;
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="w-full">
      {/* Title & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            History
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Last 50 readings · saved in this browser
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-black text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            All {counts.all > 0 && `(${counts.all})`}
          </button>
          <button
            type="button"
            onClick={() => setFilter('three_card')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-all cursor-pointer ${
              filter === 'three_card'
                ? 'bg-black text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            3 cards {counts.three_card > 0 && `(${counts.three_card})`}
          </button>
          <button
            type="button"
            onClick={() => setFilter('one_card')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-all cursor-pointer ${
              filter === 'one_card'
                ? 'bg-black text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            1 card {counts.one_card > 0 && `(${counts.one_card})`}
          </button>
          <button
            type="button"
            onClick={() => setFilter('favorites')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-all cursor-pointer flex items-center gap-1 ${
              filter === 'favorites'
                ? 'bg-black text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span>Favorites</span>
            {counts.favorites > 0 && <span>({counts.favorites})</span>}
          </button>
        </div>
      </div>

      {/* History Grid */}
      {filteredHistory.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
          <p className="text-sm text-gray-600 font-medium">No readings found</p>
          <p className="text-xs text-gray-400 mt-1">
            {filter === 'favorites'
              ? 'Star a reading to save it to your favorites.'
              : 'Readings you perform will appear here automatically.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredHistory.map((item) => {
            const cardCount = item.cards?.length || 3;
            const isFav = Boolean(item.is_favorite);

            return (
              <div
                key={item.spread_id}
                onClick={() => onSelectReading && onSelectReading(item)}
                className="bg-white border border-gray-200 hover:border-gray-400 rounded-2xl p-5 flex flex-col justify-between cursor-pointer transition-all min-h-[170px] shadow-2xs group relative"
              >
                {/* Top: Mini Card Icons & Favorite Star */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(cardCount, 3) }).map((_, i) => (
                      <div
                        key={i}
                        className="w-5 h-7 border border-gray-300 rounded bg-gray-50 overflow-hidden flex items-center justify-center text-[7px] text-gray-400 font-bold"
                      >
                        {i + 1}
                      </div>
                    ))}
                    {cardCount > 3 && (
                      <span className="text-[10px] text-gray-400 ml-0.5">+{cardCount - 3}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onDeleteReading) onDeleteReading(item.spread_id);
                      }}
                      className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Delete reading"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Interactive Star Favorite Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onToggleFavorite) onToggleFavorite(item.spread_id, !isFav);
                      }}
                      className="p-1 text-gray-400 hover:text-amber-500 transition-colors cursor-pointer"
                      title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Star
                        className={`w-4 h-4 transition-transform active:scale-125 ${
                          isFav
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-gray-300 fill-transparent hover:text-gray-500'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Question or Default Title */}
                <div className="my-3">
                  <h3 className="font-semibold text-sm text-gray-900 line-clamp-2">
                    {item.question ? item.question : 'No question'}
                  </h3>
                </div>

                {/* Bottom Metadata */}
                <div className="text-xs text-gray-400 flex items-center justify-between">
                  <span>
                    {cardCount} {cardCount === 1 ? 'card' : 'cards'} · {formatDate(item.savedAt || item.created_at)}
                  </span>
                  <span className="text-gray-400 group-hover:text-gray-900 transition-colors text-[11px] font-medium">
                    View →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Clear All Option */}
      {history.length > 0 && onClearHistory && (
        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Clear all local and saved reading history?')) {
                onClearHistory();
              }
            }}
            className="text-xs text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
          >
            Clear all history
          </button>
        </div>
      )}
    </div>
  );
}
