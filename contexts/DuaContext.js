import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const DuaContext = createContext();

export function DuaProvider({ children }) {
  const [myDuas, setMyDuas] = useState([]);
  const [favorites, setFavorites] = useState({});
  const [notes, setNotes] = useState({});

  // Load saved data when the app starts
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const [savedMyDuas, savedFavorites, savedNotes] = await Promise.all([
          AsyncStorage.getItem('myDuas'),
          AsyncStorage.getItem('favorites'),
          AsyncStorage.getItem('notes')
        ]);

        if (savedMyDuas) setMyDuas(JSON.parse(savedMyDuas));
        if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
        if (savedNotes) setNotes(JSON.parse(savedNotes));
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    };

    loadSavedData();
  }, []);

  // Save data whenever it changes
  useEffect(() => {
    const saveData = async () => {
      try {
        await Promise.all([
          AsyncStorage.setItem('myDuas', JSON.stringify(myDuas)),
          AsyncStorage.setItem('favorites', JSON.stringify(favorites)),
          AsyncStorage.setItem('notes', JSON.stringify(notes))
        ]);
      } catch (error) {
        console.error('Error saving data:', error);
      }
    };

    saveData();
  }, [myDuas, favorites, notes]);

  const handleToggleFavorite = (dua) => {
    setFavorites(prev => {
      const newFavorites = { ...prev };
      if (newFavorites[dua.id]) {
        delete newFavorites[dua.id];
        setMyDuas(current => current.filter(d => d.id !== dua.id));
      } else {
        newFavorites[dua.id] = true;
        setMyDuas(current => {
          if (!current.find(d => d.id === dua.id)) {
            return [...current, { 
              ...dua, 
              parentCategory: dua.category,
              note: notes[dua.id]
            }];
          }
          return current;
        });
      }
      return newFavorites;
    });
  };

  const handleAddNote = (duaId, note, currentDua = null) => {
    console.log('Adding note for dua:', duaId, 'note:', note);
    
    // Update notes state
    setNotes(prev => ({
      ...prev,
      [duaId]: note
    }));
    
    // Update or add the dua in myDuas
    setMyDuas(current => {
      const existingDuaIndex = current.findIndex(d => d.id === duaId);
      
      if (existingDuaIndex === -1) {
        // If the dua isn't in myDuas, add it with the note
        if (currentDua) {
          // Use the provided dua data
          return [...current, { 
            ...currentDua,
            note: note,
            parentCategory: currentDua.category || { title: 'Notes', titleAr: 'ملاحظات' }
          }];
        }
        // Fallback if no dua data is provided
        return [...current, { 
          id: duaId,
          note: note,
          title: 'Dua',
          titleAr: 'دعاء',
          parentCategory: { title: 'Notes', titleAr: 'ملاحظات' }
        }];
      }
      
      // Update existing dua
      const updatedDuas = [...current];
      updatedDuas[existingDuaIndex] = {
        ...updatedDuas[existingDuaIndex],
        note: note
      };
      
      return updatedDuas;
    });

    // Also mark as favorite when adding a note
    setFavorites(prev => ({
      ...prev,
      [duaId]: true
    }));
  };

  const handleAddToCollection = (dua) => {
    setMyDuas(current => {
      const existingDua = current.find(d => d.id === dua.id);
      if (!existingDua) {
        return [...current, { 
          ...dua, 
          parentCategory: dua.category,
          addedToCollection: true,
          note: notes[dua.id]
        }];
      }
      return current;
    });

    setFavorites(prev => ({
      ...prev,
      [dua.id]: true
    }));
  };

  const getDuaNote = (duaId) => {
    return notes[duaId] || '';
  };

  return (
    <DuaContext.Provider 
      value={{
        myDuas,
        favorites,
        notes,
        onToggleFavorite: handleToggleFavorite,
        onAddNote: handleAddNote,
        onAddToCollection: handleAddToCollection,
        getDuaNote
      }}
    >
      {children}
    </DuaContext.Provider>
  );
}

export const useDua = () => useContext(DuaContext); 