import React, { useState, useEffect } from 'react';
import { X, Search, ArrowUp, ArrowDown } from 'lucide-react';
import { getCards } from '../services/api';

const TABS = [
  { id: 'all', label: 'All (78)', arcana: null, suit: null },
  { id: 'major', label: 'Major (22)', arcana: 'major', suit: null },
  { id: 'cups', label: 'Cups (14)', arcana: 'minor', suit: 'cups' },
  { id: 'pentacles', label: 'Pentacles (14)', arcana: 'minor', suit: 'pentacles' },
  { id: 'swords', label: 'Swords (14)', arcana: 'minor', suit: 'swords' },
  { id: 'wands', label: 'Wands (14)', arcana: 'minor', suit: 'wands' },
];

export default function CardsGallery({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [cards, setCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const tab = TABS.find(t => t.id === activeTab);
    setLoading(true);
    getCards(tab?.arcana, tab?.suit)
      .then(res => setCards(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const filteredCards = cards.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.upright.toLowerCase().includes(search.toLowerCase()) ||
    c.reversed.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />

      <div className="fixed inset-4 sm:inset-10 bg-white border border-gray-200 rounded-2xl flex flex-col overflow-hidden shadow-2xl max-w-5xl mx-auto my-auto h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
              Tarot Deck Encyclopedia
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Explore the artwork and meanings of all 78 Rider-Waite cards</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Tabs */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 space-y-3">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search card name or keyword..."
              className="w-full pl-9 pr-4 py-1.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 outline-none focus:border-gray-900"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-black text-white shadow-xs'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cards Grid with Real Card Images */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="text-center py-20 text-gray-400 text-xs">Loading tarot cards...</div>
          ) : filteredCards.length === 0 ? (
            <div className="text-center py-20 text-gray-400 text-xs">No cards match your filter.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {filteredCards.map(c => {
                const imgUrl = c.image_url || `/cards/${c.id}.jpg`;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCard(c)}
                    className="rounded-xl bg-white border border-gray-200 hover:border-gray-400 p-2.5 flex flex-col justify-between cursor-pointer hover:shadow-xs transition-all group"
                  >
                    <div className="w-full aspect-[2/3.2] rounded-lg overflow-hidden bg-gray-100 mb-2 border border-gray-100">
                      <img
                        src={imgUrl}
                        alt={c.name}
                        loading="lazy"
                        onError={(e) => {
                          if (!e.target.dataset.triedFallback) {
                            e.target.dataset.triedFallback = 'true';
                            e.target.src = `/cards/${c.id}.jpg`;
                          }
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-gray-400 block font-semibold">
                        {c.arcana === 'major' ? 'Major' : c.suit}
                      </span>
                      <h4 className="font-semibold text-xs text-gray-900 mt-0.5 truncate">
                        {c.name}
                      </h4>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Card Modal Detail */}
        {selectedCard && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-20">
            <div className="bg-white border border-gray-200 rounded-2xl max-w-2xl w-full p-6 relative shadow-2xl flex flex-col sm:flex-row gap-6 max-h-[85vh] overflow-y-auto">
              <button
                onClick={() => setSelectedCard(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Large Image on Left */}
              <div className="w-48 sm:w-56 aspect-[2/3.2] rounded-xl overflow-hidden border border-gray-200 shadow-sm flex-shrink-0 mx-auto">
                <img
                  src={selectedCard.image_url || `/cards/${selectedCard.id}.jpg`}
                  alt={selectedCard.name}
                  onError={(e) => {
                    if (!e.target.dataset.triedFallback) {
                      e.target.dataset.triedFallback = 'true';
                      e.target.src = `/cards/${selectedCard.id}.jpg`;
                    }
                  }}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Text Info on Right */}
              <div className="flex-1 flex flex-col justify-center">
                <span className="text-xs uppercase tracking-wider text-gray-400 block font-semibold">
                  {selectedCard.arcana === 'major' ? 'Major Arcana' : `Suit of ${selectedCard.suit}`}
                </span>
                <h3 className="text-2xl font-bold text-gray-900 mt-1 mb-4">
                  {selectedCard.name}
                </h3>

                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5">
                    <div className="flex items-center gap-1.5 text-gray-900 font-semibold mb-1">
                      <ArrowUp className="w-4 h-4 text-emerald-600" />
                      Upright Meaning
                    </div>
                    <p className="text-gray-600 leading-relaxed">{selectedCard.upright}</p>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5">
                    <div className="flex items-center gap-1.5 text-gray-900 font-semibold mb-1">
                      <ArrowDown className="w-4 h-4 text-purple-600" />
                      Reversed Meaning
                    </div>
                    <p className="text-gray-600 leading-relaxed">{selectedCard.reversed}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
