import localCards from '../data/cards.json';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

/**
 * Get or initialize persistent session token
 */
export function getSessionToken() {
  let token = localStorage.getItem('tarot_session_token');
  if (!token) {
    token = 'sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem('tarot_session_token', token);
  }
  return token;
}

function getHeaders(custom = {}) {
  return {
    'Content-Type': 'application/json',
    'X-Session-Token': getSessionToken(),
    ...custom
  };
}

/**
 * Initialize / verify user session with backend
 */
export async function initSession() {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/session`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (res.ok) {
      const data = await res.json();
      if (data.session_token) {
        localStorage.setItem('tarot_session_token', data.session_token);
      }
      return data;
    }
  } catch (err) {
    console.warn('Backend session unavailable, running in client session mode:', err.message);
  }
  return { session_token: getSessionToken(), user_id: 'local_user' };
}

/**
 * Fetch all cards or filtered cards
 */
export async function getCards(arcana = null, suit = null) {
  try {
    const params = new URLSearchParams();
    if (arcana) params.append('arcana', arcana);
    if (suit) params.append('suit', suit);
    const qs = params.toString() ? `?${params.toString()}` : '';

    const res = await fetch(`${API_BASE_URL}/cards${qs}`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Backend unavailable, using local cards dataset:', err.message);
    let cards = Array.isArray(localCards) ? [...localCards] : [...(localCards.cards || [])];
    if (arcana) cards = cards.filter(c => c.arcana.toLowerCase() === arcana.toLowerCase());
    if (suit) cards = cards.filter(c => c.suit && c.suit.toLowerCase() === suit.toLowerCase());
    return cards;
  }
}

/**
 * Draw a spread of cards
 */
export async function drawSpread(spreadType = 'three_card', count = 3, positionTheme = 'past_present_future') {
  if (spreadType === 'one_card') count = 1;
  if (spreadType === 'celtic_cross') count = 10;

  try {
    const res = await fetch(`${API_BASE_URL}/spread`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        spread_type: spreadType,
        count: count,
        position_theme: positionTheme
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Backend unavailable, generating client spread:', err.message);
    const cardsSource = Array.isArray(localCards) ? localCards : (localCards.cards || []);
    const shuffled = [...cardsSource].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count);

    let positions = ['Past', 'Present', 'Future'];
    if (count === 1) {
      positions = ['Card of the Day'];
    } else if (count === 10 || spreadType === 'celtic_cross') {
      positions = [
        "The Present", "The Challenge", "The Past", "The Future",
        "Above (Aspirations)", "Below (Subconscious)", "Advice (Inner Power)",
        "External Environment", "Hopes and Fears", "Outcome"
      ];
    } else if (positionTheme === 'situation_action_outcome') {
      positions = ['Situation', 'Action', 'Outcome'];
    }

    const drawnCards = selected.map((card, idx) => {
      const orientation = Math.random() > 0.5 ? 'upright' : 'reversed';
      const meaning = orientation === 'upright' ? card.upright : card.reversed;
      const posLabel = positions[idx] || `Position ${idx + 1}`;
      return {
        id: card.id,
        name: card.name,
        orientation: orientation,
        meaning: meaning,
        position: posLabel,
        image_url: card.image_url || `/cards/${card.id}.jpg`
      };
    });

    return {
      spread_id: 'local-' + Math.random().toString(36).substring(2, 11),
      spread_type: spreadType,
      cards: drawnCards
    };
  }
}

/**
 * Request AI interpretation for drawn cards (CRITICAL: calls existing AI endpoint without altering prompt logic)
 */
export async function interpretSpread(cards, userQuestion = '') {
  try {
    const res = await fetch(`${API_BASE_URL}/interpret`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        cards: cards,
        user_question: userQuestion.trim() || undefined
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Backend unavailable, generating client fallback interpretation:', err.message);
    const c1 = cards[0];
    const c2 = cards[1] || cards[0];
    const c3 = cards[2] || cards[0];
    const qIntro = userQuestion ? `Regarding your inquiry, "${userQuestion.trim()}", ` : '';

    const text = (
      `${qIntro}Your path is anchored by **${c1.name} (${c1.orientation})**, showing that **${c1.meaning.toLowerCase()}** has set your current foundation. ` +
      `Presently, the presence of **${c2.name} (${c2.orientation})** urges you to navigate **${c2.meaning.toLowerCase()}** with conscious balance and awareness. ` +
      `Looking ahead, **${c3.name} (${c3.orientation})** illuminates an outcome guided by **${c3.meaning.toLowerCase()}**, promising growth if you stay centered. ` +
      `Trust your inner compass and take **deliberate, grounded action** as you move forward.`
    );

    return {
      interpretation: text,
      created_at: new Date().toISOString(),
      is_mock: true
    };
  }
}

/**
 * Fetch reading history from backend
 */
export async function fetchRemoteHistory(spreadType = null, isFavorite = null) {
  try {
    const params = new URLSearchParams();
    if (spreadType) params.append('spread_type', spreadType);
    if (isFavorite !== null && isFavorite !== undefined) params.append('is_favorite', String(isFavorite));
    const qs = params.toString() ? `?${params.toString()}` : '';

    const res = await fetch(`${API_BASE_URL}/history${qs}`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Backend history unavailable:', err.message);
    return null;
  }
}

/**
 * Save reading to backend
 */
export async function saveRemoteReading(reading) {
  try {
    const res = await fetch(`${API_BASE_URL}/history`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(reading)
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Failed to save reading remotely:', err.message);
  }
  return null;
}

/**
 * Delete reading from backend
 */
export async function deleteRemoteReading(spreadId) {
  try {
    const res = await fetch(`${API_BASE_URL}/history/${spreadId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.ok;
  } catch (err) {
    console.warn('Failed to delete remote reading:', err.message);
    return false;
  }
}

/**
 * Clear all remote history
 */
export async function clearRemoteHistory() {
  try {
    const res = await fetch(`${API_BASE_URL}/history`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.ok;
  } catch (err) {
    console.warn('Failed to clear remote history:', err.message);
    return false;
  }
}

/**
 * Toggle favorite status on backend
 */
export async function toggleRemoteFavorite(spreadId, isFavorite = null) {
  try {
    const res = await fetch(`${API_BASE_URL}/history/${spreadId}/favorite`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ is_favorite: isFavorite })
    });
    if (res.ok) {
      const data = await res.json();
      return data.is_favorite;
    }
  } catch (err) {
    console.warn('Failed to toggle remote favorite:', err.message);
  }
  return null;
}

/**
 * User Settings API
 */
export async function fetchUserSettings() {
  try {
    const res = await fetch(`${API_BASE_URL}/settings`, { headers: getHeaders() });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Failed to fetch settings:', err.message);
  }
  return {
    default_spread_type: 'three_card',
    default_position_theme: 'past_present_future',
    preferred_theme: 'light'
  };
}

export async function saveUserSettings(settings) {
  try {
    const res = await fetch(`${API_BASE_URL}/settings`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(settings)
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Failed to save settings:', err.message);
  }
  return settings;
}
