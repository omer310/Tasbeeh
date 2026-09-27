import { TASBIH_LIBRARY, DEFAULT_COLLECTIONS } from '../data/tasbihCollections';

const FIRST = Object.keys(TASBIH_LIBRARY)[0];
const integer = (value, fallback = 0) => Number.isFinite(Number(value)) ? Math.max(0, Math.min(1000000, Math.floor(Number(value)))) : fallback;
export const initialTasbihState = { dhikrs: TASBIH_LIBRARY, selected: FIRST, collections: DEFAULT_COLLECTIONS, activeCollection: null, sessions: {}, hydrated: false };
export function hydrateTasbih(saved = {}) {
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) saved = {};
  const dhikrs = { ...TASBIH_LIBRARY };
  for (const [key, value] of Object.entries(saved.dhikrs || {})) if (typeof value?.ar === 'string' && value.ar.trim()) dhikrs[key] = { ...value, count: integer(value.count), goal: integer(value.goal) };
  const collections = new Map(DEFAULT_COLLECTIONS.map(item => [item.id, item]));
  for (const value of Array.isArray(saved.collections) ? saved.collections : []) {
    if (!value?.id || typeof value.title !== 'string' || !value.title.trim() || !Array.isArray(value.items)) continue;
    const items = value.items.filter(item => typeof item?.dhikr === 'string' && (dhikrs[item.dhikr] || (typeof item.ar === 'string' && item.ar.trim()))).map((item, index) => ({ ...item, id: item.id || `${value.id}-${index}`, ar: item.ar || dhikrs[item.dhikr].ar, en: item.en || dhikrs[item.dhikr]?.en || '', target: Math.max(1, integer(item.target, 1)) }));
    if (items.length) collections.set(value.id, { ...value, items });
  }
  const sessions = {};
  for (const [id, session] of Object.entries(saved.sessions || {})) {
    if (!collections.has(id) || !Array.isArray(session?.steps) || !session.steps.length || !session.steps.every(step => typeof step.ar === 'string' && Number.isFinite(step.target) && step.target > 0)) continue;
    const counts = session.steps.map((step, index) => Math.min(step.target, integer(session.counts?.[index])));
    sessions[id] = { ...session, index: Math.min(session.steps.length - 1, integer(session.index)), counts, complete: counts.every((count, index) => count >= session.steps[index].target) };
  }
  return { dhikrs, selected: dhikrs[saved.selected] ? saved.selected : FIRST, collections: [...collections.values()], activeCollection: sessions[saved.activeCollection] ? saved.activeCollection : null, sessions, hydrated: true };
}
export function currentTasbih(state) {
  const session = state.sessions[state.activeCollection];
  if (session) { const step = session.steps[session.index]; return { ...step, count: session.counts[session.index] || 0, goal: step.target }; }
  return state.dhikrs[state.selected] || state.dhikrs[FIRST];
}
export function tasbihReducer(state, action) {
  if (action.type === 'hydrate') return hydrateTasbih(action.value);
  if (!state.hydrated) return state;
  const id = state.activeCollection, session = state.sessions[id];
  const replaceSession = value => ({ ...state, sessions: { ...state.sessions, [id]: value } });
  if (action.type === 'select') return state.dhikrs[action.id] ? { ...state, selected: action.id, activeCollection: null } : state;
  if (action.type === 'end') return { ...state, activeCollection: null };
  if (action.type === 'start') {
    const collection = state.collections.find(item => item.id === action.id);
    if (!collection) return state;
    const old = state.sessions[collection.id];
    const next = old && !old.complete && !action.restart ? old : { steps: collection.items.map(item => ({ ...item })), counts: collection.items.map(() => 0), index: 0, complete: false };
    return { ...state, activeCollection: collection.id, sessions: { ...state.sessions, [collection.id]: next } };
  }
  if (action.type === 'advance') {
    if (!session || action.id !== id || action.index !== session.index || session.counts[session.index] < session.steps[session.index].target) return state;
    return replaceSession(session.index + 1 < session.steps.length ? { ...session, index: session.index + 1 } : { ...session, complete: true });
  }
  if (action.type === 'count' || action.type === 'reset' || action.type === 'goal') {
    if (session) {
      if (session.complete && action.type === 'count') return state;
      const steps = [...session.steps], counts = [...session.counts];
      if (action.type === 'goal') { steps[session.index] = { ...steps[session.index], target: Math.max(1, integer(action.value, 1)) }; counts[session.index] = Math.min(counts[session.index], steps[session.index].target); }
      else counts[session.index] = action.type === 'reset' ? 0 : Math.min(steps[session.index].target, counts[session.index] + 1);
      return replaceSession({ ...session, steps, counts, complete: false });
    }
    const value = state.dhikrs[state.selected];
    if (action.type === 'count' && value.goal && value.count >= value.goal) return state;
    const patch = action.type === 'goal' ? { goal: integer(action.value) } : { count: action.type === 'reset' ? 0 : value.goal ? Math.min(value.goal, value.count + 1) : value.count + 1 };
    return { ...state, dhikrs: { ...state.dhikrs, [state.selected]: { ...value, ...patch } } };
  }
  if (action.type === 'saveCollection') {
    const collection = action.collection;
    const sessions = { ...state.sessions }; delete sessions[collection.id];
    const collections = state.collections.some(item => item.id === collection.id) ? state.collections.map(item => item.id === collection.id ? collection : item) : [...state.collections, collection];
    return { ...state, dhikrs: { ...state.dhikrs, ...action.dhikrs }, collections, sessions, activeCollection: id === collection.id ? null : id };
  }
  if (action.type === 'deleteCollection') {
    if (!state.collections.some(item => item.id === action.id && !item.preset)) return state;
    const sessions = { ...state.sessions }; delete sessions[action.id];
    return { ...state, collections: state.collections.filter(item => item.id !== action.id), sessions, activeCollection: id === action.id ? null : id };
  }
  if (action.type === 'addDhikr') return { ...state, dhikrs: { ...state.dhikrs, [action.id]: action.value }, selected: action.id, activeCollection: null };
  return state;
}
