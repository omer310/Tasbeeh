const initialDuaState = { myDuas: [], favorites: {}, notes: {}, hydrated: false };
function duaReducer(state, action) {
  const upsert = dua => state.myDuas.some(item => item.id === dua.id)
    ? state.myDuas.map(item => item.id === dua.id ? { ...item, ...dua } : item)
    : [...state.myDuas, dua];
  switch (action.type) {
    case 'hydrate': return { ...initialDuaState, ...action.value, hydrated: true };
    case 'favorite': {
      const dua = action.dua;
      const favorites = { ...state.favorites };
      if (favorites[dua.id]) {
        delete favorites[dua.id];
        return { ...state, favorites, myDuas: state.myDuas.filter(item => item.id !== dua.id || item.isCustom || item.addedToCollection || state.notes[item.id]?.trim() || item.note?.trim()) };
      }
      favorites[dua.id] = true;
      return { ...state, favorites, myDuas: upsert({ ...dua, parentCategory: dua.parentCategory || dua.category, note: state.notes[dua.id] || dua.note }) };
    }
    case 'note': return { ...state, notes: { ...state.notes, [action.dua.id]: action.note }, myDuas: upsert({ ...action.dua, note: action.note }) };
    case 'collect': return { ...state, myDuas: upsert({ ...action.dua, addedToCollection: true }) };
    case 'custom': return { ...state, myDuas: upsert({ ...action.dua, isCustom: true }) };
    default: return state;
  }
}
module.exports = { initialDuaState, duaReducer };
