const STORAGE_KEY = 'tarot_ai_history';
const MAX_HISTORY_ITEMS = 50;

/**
 * Retrieve saved readings from localStorage
 * @returns {Array} List of reading objects
 */
export function getHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load history from localStorage', err);
    return [];
  }
}

/**
 * Save a new reading to localStorage (capped at 50 items)
 * @param {Object} reading - Reading object
 * @returns {Array} Updated history list
 */
export function saveReading(reading) {
  try {
    const history = getHistory();
    // Check if item with spread_id already exists
    const filtered = history.filter(item => item.spread_id !== reading.spread_id);
    const updated = [
      {
        ...reading,
        is_favorite: Boolean(reading.is_favorite),
        savedAt: reading.savedAt || new Date().toISOString(),
      },
      ...filtered
    ].slice(0, MAX_HISTORY_ITEMS); // STRICT: max 50 items

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to save reading to localStorage', err);
    return getHistory();
  }
}

/**
 * Toggle favorite status in localStorage
 */
export function toggleFavoriteLocal(spreadId, forcedStatus = null) {
  try {
    const history = getHistory();
    const updated = history.map(item => {
      if (item.spread_id === spreadId) {
        return {
          ...item,
          is_favorite: forcedStatus !== null ? Boolean(forcedStatus) : !item.is_favorite
        };
      }
      return item;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to toggle favorite in localStorage', err);
    return getHistory();
  }
}

/**
 * Delete a single reading by its ID or spread_id
 */
export function deleteReading(spreadId) {
  try {
    const history = getHistory();
    const updated = history.filter(item => item.spread_id !== spreadId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to delete reading', err);
    return getHistory();
  }
}

/**
 * Clear all history
 */
export function clearHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  } catch (err) {
    console.error('Failed to clear history', err);
    return [];
  }
}
