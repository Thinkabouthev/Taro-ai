import React from 'react';
import TarotCard from './TarotCard';

export default function SpreadBoard({
  cards = [],
  flippedIndices,
  onFlipCard,
  onRevealAll,
  onDrawNewSpread,
  onInterpret,
  isDrawing,
  isInterpreting,
  hasInterpretation,
  question,
  createdAt,
  onBackToNewReading,
  spreadType = 'three_card'
}) {
  // Page 2: Three-card spread / result view
  if (hasInterpretation || isInterpreting) {
    const formattedDate = createdAt
      ? new Date(createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }) + ' · ' + new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      : new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }) + ' · ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

    const spreadTitle = cards.length === 1
      ? 'Single-card reading'
      : cards.length === 10
      ? 'Celtic Cross spread'
      : 'Three-card spread';

    return (
      <div className="w-full">
        {/* Top Link: Back to new reading */}
        {onBackToNewReading && (
          <button
            type="button"
            onClick={onBackToNewReading}
            className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1 font-medium mb-6 cursor-pointer"
          >
            ‹ Back to new reading
          </button>
        )}

        {/* Heading & Question / Timestamp */}
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              {spreadTitle}
            </h1>
            <p className="text-sm text-gray-600 font-medium mt-1">
              {question ? `“${question}”` : '“What should I focus on this week?”'}
            </p>
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {formattedDate}
          </span>
        </div>

        {/* Drawn Cards Grid */}
        <div className={`grid gap-3 sm:gap-4 ${
          cards.length === 1
            ? 'grid-cols-1 max-w-xs mx-auto'
            : cards.length === 10
            ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5'
            : 'grid-cols-3'
        }`}>
          {cards.map((card, idx) => (
            <TarotCard
              key={card.id + idx}
              card={card}
              index={idx}
              isFlipped={flippedIndices ? flippedIndices.includes(idx) : true}
              onFlip={() => onFlipCard && onFlipCard(idx)}
            />
          ))}
        </div>
      </div>
    );
  }

  // Page 1: Empty Preview state (Cards appear here after you draw)
  const isOneCard = spreadType === 'one_card';
  const isCeltic = spreadType === 'celtic_cross';

  const previewSlots = isOneCard
    ? ['CARD OF THE DAY']
    : isCeltic
    ? ['PRESENT', 'CHALLENGE', 'PAST', 'FUTURE', 'ABOVE', 'BELOW', 'ADVICE', 'ENV', 'HOPES', 'OUTCOME']
    : ['PAST', 'PRESENT', 'FUTURE'];

  const previewTitle = isOneCard
    ? 'Card of the Day'
    : isCeltic
    ? 'Celtic Cross · 10 Cards'
    : 'Past · Present · Future';

  const previewSubtitle = isOneCard
    ? 'Quick reflection for immediate clarity'
    : isCeltic
    ? 'Comprehensive spread for deep life inquiries'
    : 'The most popular spread for everyday questions';

  return (
    <div className="w-full bg-[#fbfbfb] border border-gray-200 rounded-2xl p-6 sm:p-8 flex flex-col justify-between min-h-[460px]">
      {/* Header */}
      <div>
        <h3 className="font-semibold text-base text-gray-900">
          {previewTitle}
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">
          {previewSubtitle}
        </p>
      </div>

      {/* Dashed Card Slots */}
      <div className={`grid gap-3 sm:gap-4 my-8 ${
        isOneCard
          ? 'grid-cols-1 max-w-[150px] mx-auto w-full'
          : isCeltic
          ? 'grid-cols-5'
          : 'grid-cols-3'
      }`}>
        {previewSlots.map((pos) => (
          <div key={pos} className="flex flex-col items-center">
            <div className="w-full aspect-[2/3.2] rounded-xl border border-dashed border-gray-300 bg-white" />
            <span className="text-[9px] sm:text-[10px] font-semibold text-gray-400 text-center tracking-wider mt-2 uppercase truncate max-w-full">
              {pos}
            </span>
          </div>
        ))}
      </div>

      {/* Bottom Text */}
      <p className="text-xs text-gray-400 text-center">
        Cards appear here after you draw
      </p>
    </div>
  );
}
