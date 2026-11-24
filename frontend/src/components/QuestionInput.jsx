import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

export default function QuestionInput({
  question,
  setQuestion,
  disabled,
  onDrawCards,
  isDrawing,
  spreadType = 'three_card',
  onSelectSpreadType
}) {
  const SPREAD_OPTIONS = [
    { id: 'one_card', label: '1 card', desc: 'Quick daily reflection' },
    { id: 'three_card', label: '3 cards', desc: 'Past · Present · Future' },
    { id: 'celtic_cross', label: 'Celtic Cross', desc: 'In-depth 10-card spread' }
  ];

  return (
    <div className="w-full">
      {/* Title & Subtitle */}
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
        New reading
      </h1>
      <p className="text-sm text-gray-500 mt-2">
        Pick a spread, ask a question and get an AI interpretation in seconds.
      </p>

      {/* Spread Type Selector */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-2.5">
          <label className="block text-xs font-semibold text-gray-700">
            Spread type
          </label>
          <span className="text-[11px] text-gray-400">
            {SPREAD_OPTIONS.find(s => s.id === spreadType)?.desc}
          </span>
        </div>
        
        <div className="grid grid-cols-3 gap-2.5 max-w-lg">
          {SPREAD_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelectSpreadType && onSelectSpreadType(opt.id)}
              disabled={disabled || isDrawing}
              className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-medium border text-center transition-all cursor-pointer ${
                spreadType === opt.id
                  ? 'bg-black text-white border-black shadow-sm'
                  : 'bg-white border-gray-200 text-gray-800 hover:border-gray-400 hover:bg-gray-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Your Question Input */}
      <div className="mt-6">
        <label className="block text-xs font-semibold text-gray-700 mb-2">
          Your question (optional)
        </label>
        <div className="relative">
          <textarea
            name="user_question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={disabled || isDrawing}
            rows={4}
            placeholder="e.g. What should I focus on this week?"
            className="w-full p-3.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all resize-y"
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          A specific question gives a more personal interpretation
        </p>
      </div>

      {/* Draw Cards Button */}
      {onDrawCards && (
        <div className="mt-8">
          <button
            type="button"
            onClick={onDrawCards}
            disabled={disabled || isDrawing}
            className="bg-black hover:bg-neutral-800 disabled:opacity-50 text-white font-medium px-8 py-3.5 rounded-xl text-sm transition-all shadow-sm active:scale-95 cursor-pointer flex items-center gap-2"
          >
            {isDrawing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Drawing cards...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-gray-300" />
                <span>Draw {spreadType === 'one_card' ? '1 card' : spreadType === 'celtic_cross' ? '10 cards' : '3 cards'}</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
