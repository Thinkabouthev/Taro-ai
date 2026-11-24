import React, { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';

const NUM_TO_WORD = {
  '1': 'ace', '2': 'two', '3': 'three', '4': 'four', '5': 'five',
  '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine', '10': 'ten',
  '11': 'page', '12': 'knight', '13': 'queen', '14': 'king'
};
const WORD_TO_NUM = {
  'ace': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
  'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10',
  'page': '11', 'knight': '12', 'queen': '13', 'king': '14'
};

export default function TarotCard({ card, isFlipped = true, onFlip, index = 0 }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentSrcIndex, setCurrentSrcIndex] = useState(0);

  const isReversed = card?.orientation === 'reversed';

  // Build candidate image paths
  const getCandidateSources = () => {
    if (!card?.id) return [];
    const candidates = [];
    if (card.image_url) candidates.push(card.image_url);
    candidates.push(`/cards/${card.id}.jpg`);

    // Add alternate word/num variations
    const parts = card.id.split('_');
    if (parts.length === 2) {
      const [suit, rank] = parts;
      if (NUM_TO_WORD[rank]) {
        candidates.push(`/cards/${suit}_${NUM_TO_WORD[rank]}.jpg`);
      }
      if (WORD_TO_NUM[rank]) {
        candidates.push(`/cards/${suit}_${WORD_TO_NUM[rank]}.jpg`);
      }
      if (suit === 'major') {
        const intRank = parseInt(rank, 10);
        if (!isNaN(intRank)) {
          candidates.push(`/cards/major_${intRank}.jpg`);
          candidates.push(`/cards/major_${String(intRank).padStart(2, '0')}.jpg`);
        }
      }
    }

    // Backend static paths
    candidates.push(`/static/cards/${card.id}.jpg`);

    return [...new Set(candidates)];
  };

  const sources = getCandidateSources();
  const activeSrc = sources[currentSrcIndex] || null;

  // Reset image loading states when card changes
  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
    setCurrentSrcIndex(0);
  }, [card?.id]);

  const handleImageError = () => {
    if (currentSrcIndex < sources.length - 1) {
      setCurrentSrcIndex(prev => prev + 1);
    } else {
      setImageError(true);
    }
  };

  return (
    <div className="flex flex-col w-full select-none">
      {/* Position Label on Top */}
      <div className="mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          {card?.position || (index === 0 ? 'PAST' : index === 1 ? 'PRESENT' : 'FUTURE')}
        </span>
      </div>

      {/* Card Box with 3D Flip Container */}
      <div
        onClick={onFlip}
        className="w-full aspect-[2/3.4] rounded-xl border border-gray-200 bg-white relative overflow-hidden shadow-sm hover:border-gray-400 hover:shadow-md transition-all cursor-pointer group"
      >
        {!isFlipped ? (
          /* Card Back (Facedown) */
          <div className="w-full h-full bg-[#181c2e] border-2 border-amber-600/30 p-2.5 flex flex-col items-center justify-center relative">
            <div className="w-full h-full border border-amber-500/20 rounded-lg flex flex-col items-center justify-center p-3 text-center">
              <div className="w-16 h-16 rounded-full border border-amber-500/30 flex items-center justify-center mb-2">
                <div className="w-10 h-10 border border-purple-400/30 rotate-45 flex items-center justify-center" />
              </div>
              <span className="text-[10px] tracking-widest text-amber-200/80 uppercase font-medium">
                TAROT
              </span>
            </div>
          </div>
        ) : (
          /* Card Front (Faceup - Real Card Image) */
          <div className="w-full h-full relative flex items-center justify-center bg-gray-50 overflow-hidden">
            {/* Loading placeholder skeleton */}
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
                <Eye className="w-6 h-6 text-gray-300" />
              </div>
            )}

            {activeSrc && !imageError ? (
              <img
                key={activeSrc}
                src={activeSrc}
                alt={card?.name || 'Tarot Card'}
                onLoad={() => setImageLoaded(true)}
                onError={handleImageError}
                className={`w-full h-full object-cover transition-transform duration-500 ${
                  isReversed ? 'rotate-180' : ''
                } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              />
            ) : (
              /* Fallback if image path not found */
              <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                <Eye className="w-8 h-8 text-gray-400 mb-2" />
                <span className="font-semibold text-xs text-gray-800">{card?.name}</span>
                {isReversed && (
                  <span className="text-[10px] text-gray-500 mt-1">Reversed</span>
                )}
              </div>
            )}

            {/* Subtle Orientation Watermark Badge */}
            {isReversed && (
              <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-xs text-white text-[9px] font-medium px-2 py-0.5 rounded-md shadow-xs pointer-events-none">
                Reversed
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card Metadata Below */}
      <div className="mt-2.5">
        <h4 className="font-semibold text-sm text-gray-900 leading-tight">
          {card?.name || '[Card name]'}
          {isReversed && (
            <span className="text-gray-500 font-normal"> · Reversed</span>
          )}
        </h4>
        <p className="text-xs text-gray-500 mt-0.5 leading-snug line-clamp-2">
          {card?.meaning || '[One-line meaning]'}
        </p>
      </div>
    </div>
  );
}
