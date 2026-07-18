const KEY = 'onearete.strategos.v03';
const createInitialState = () => ({ profile: null, history: [], current: null, deltaTotal: 0 });

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return { ...createInitialState(), ...parsed };
  } catch (error) {
    console.warn('Strategos state was reset because stored data was invalid.', error);
    try { localStorage.removeItem(KEY); } catch (_) {}
    return createInitialState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Strategos could not persist state.', error);
  }
}

export function resetState() {
  try { localStorage.removeItem(KEY); } catch (_) {}
}
