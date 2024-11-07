import AsyncStorage from '@react-native-async-storage/async-storage';

class BookmarkManager {
  static async getBookmarks() {
    try {
      const savedBookmarks = await AsyncStorage.getItem('quranBookmarks');
      if (!savedBookmarks) return {};
      
      const bookmarks = JSON.parse(savedBookmarks);
      return Object.entries(bookmarks).reduce((acc, [key, value]) => {
        acc[key] = typeof value === 'string' ? { color: value } : value;
        return acc;
      }, {});
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      return {};
    }
  }

  static async saveBookmark(page, color, label = '') {
    try {
      const currentBookmarks = await this.getBookmarks();
      const newBookmarks = Object.entries(currentBookmarks).reduce((acc, [key, value]) => {
        acc[key] = typeof value === 'string' ? { color: value } : value;
        return acc;
      }, {});
      
      newBookmarks[page] = {
        color,
        label,
        timestamp: new Date().toISOString(),
        lastVisited: new Date().toISOString()
      };
      
      await AsyncStorage.setItem('quranBookmarks', JSON.stringify(newBookmarks));
      return newBookmarks;
    } catch (error) {
      console.error('Error saving bookmark:', error);
      throw error;
    }
  }

  static async updateLastVisited(page) {
    try {
      const currentBookmarks = await this.getBookmarks();
      if (currentBookmarks[page]) {
        currentBookmarks[page].lastVisited = new Date().toISOString();
        await AsyncStorage.setItem('quranBookmarks', JSON.stringify(currentBookmarks));
      }
    } catch (error) {
      console.error('Error updating last visited:', error);
    }
  }

  static async getRecentBookmarks(limit = 5) {
    try {
      const bookmarks = await this.getBookmarks();
      return Object.entries(bookmarks)
        .sort((a, b) => new Date(b[1].lastVisited) - new Date(a[1].lastVisited))
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting recent bookmarks:', error);
      return [];
    }
  }

  static async removeBookmark(page) {
    try {
      const currentBookmarks = await this.getBookmarks();
      const newBookmarks = { ...currentBookmarks };
      delete newBookmarks[page];
      await AsyncStorage.setItem('quranBookmarks', JSON.stringify(newBookmarks));
      return newBookmarks;
    } catch (error) {
      console.error('Error removing bookmark:', error);
      throw error;
    }
  }

  static sortSurahs(surahsToSort, currentBookmarks) {
    return [...surahsToSort].sort((a, b) => {
      const aBookmarked = Object.keys(currentBookmarks).some(page => 
        parseInt(page) >= a.pages[0] && parseInt(page) <= a.pages[a.pages.length - 1]
      );
      const bBookmarked = Object.keys(currentBookmarks).some(page => 
        parseInt(page) >= b.pages[0] && parseInt(page) <= b.pages[b.pages.length - 1]
      );
      
      if (aBookmarked && !bBookmarked) return -1;
      if (!aBookmarked && bBookmarked) return 1;
      return a.id - b.id;
    });
  }
}

export default BookmarkManager; 