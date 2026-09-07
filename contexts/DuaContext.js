import React, { createContext, useReducer, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initialDuaState, duaReducer } from '../utils/duaState';
export const DuaContext = createContext();
export function DuaProvider({ children }) {
  const [state, dispatch] = useReducer(duaReducer, initialDuaState);
  const [storageError, setStorageError] = useState('');
  const saving = useRef(Promise.resolve());
  useEffect(() => {
    let active = true;
    AsyncStorage.multiGet(['myDuas', 'favorites', 'notes']).then(entries => {
      const saved = Object.fromEntries(entries);
      const value = { myDuas: JSON.parse(saved.myDuas || '[]'), favorites: JSON.parse(saved.favorites || '{}'), notes: JSON.parse(saved.notes || '{}') };
      if (!Array.isArray(value.myDuas) || !value.favorites || !value.notes) throw new Error('Saved Duas could not be read.');
      if (active) dispatch({ type: 'hydrate', value });
    }).catch(() => { if (active) setStorageError('Your saved Duas could not be loaded. Reopen the app to try again.'); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!state.hydrated) return;
    const entries = ['myDuas', 'favorites', 'notes'].map(key => [key, JSON.stringify(state[key])]);
    saving.current = saving.current.catch(() => {}).then(() => AsyncStorage.multiSet(entries))
      .catch(() => setStorageError('Your latest Duas changes could not be saved. Please try again.'));
  }, [state]);
  const update = action => { if (state.hydrated) dispatch(action); };
  return <DuaContext.Provider value={{ ...state, storageError,
    onToggleFavorite: dua => update({ type: 'favorite', dua }),
    onAddNote: (id, note, dua) => update({ type: 'note', dua: dua || state.myDuas.find(item => item.id === id) || { id, title: 'Dua' }, note }),
    onAddToCollection: dua => update({ type: 'collect', dua }),
    onAddCustomDua: dua => update({ type: 'custom', dua: { ...dua, id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` } }),
    getDuaNote: id => state.notes[id] || '',
  }}>{children}</DuaContext.Provider>;
}
export const useDua = () => useContext(DuaContext);
