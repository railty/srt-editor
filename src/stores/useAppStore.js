import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Custom IndexedDB storage adapter for Zustand
const indexedDBStorage = {
  // Database configuration
  dbName: 'srt-editor-db',
  storeName: 'store',
  version: 1,

  // Get the IndexedDB database instance
  getDB: () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(indexedDBStorage.dbName, indexedDBStorage.version);
      
      request.onerror = (event) => {
        console.error('IndexedDB error:', event.target.error);
        reject(event.target.error);
      };
      
      request.onsuccess = (event) => {
        resolve(event.target.result);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(indexedDBStorage.storeName)) {
          db.createObjectStore(indexedDBStorage.storeName);
        }
      };
    });
  },

  // Implementation of the required storage methods for Zustand
  getItem: async (key) => {
    try {
      const db = await indexedDBStorage.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(indexedDBStorage.storeName, 'readonly');
        const store = transaction.objectStore(indexedDBStorage.storeName);
        const request = store.get(key);
        
        request.onerror = (event) => {
          console.error('Error getting item:', event.target.error);
          reject(event.target.error);
        };
        
        request.onsuccess = (event) => {
          resolve(event.target.result);
        };
      });
    } catch (error) {
      console.error('Failed to get item from IndexedDB:', error);
      return null;
    }
  },
  
  setItem: async (key, value) => {
    try {
      const db = await indexedDBStorage.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(indexedDBStorage.storeName, 'readwrite');
        const store = transaction.objectStore(indexedDBStorage.storeName);
        const request = store.put(value, key);
        
        request.onerror = (event) => {
          console.error('Error setting item:', event.target.error);
          reject(event.target.error);
        };
        
        request.onsuccess = (event) => {
          resolve();
        };
      });
    } catch (error) {
      console.error('Failed to save item to IndexedDB:', error);
    }
  },
  
  removeItem: async (key) => {
    try {
      const db = await indexedDBStorage.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(indexedDBStorage.storeName, 'readwrite');
        const store = transaction.objectStore(indexedDBStorage.storeName);
        const request = store.delete(key);
        
        request.onerror = (event) => {
          console.error('Error removing item:', event.target.error);
          reject(event.target.error);
        };
        
        request.onsuccess = (event) => {
          resolve();
        };
      });
    } catch (error) {
      console.error('Failed to remove item from IndexedDB:', error);
    }
  }
};

const useAppStore = create(
  persist(
    (set) => ({
      // UI state
      currentPage: 'home',
      status: 'Ready',
      
      // File state
      audioFile: null, // Will store file metadata, not the full File object
      subtitleFile: null, // Will store file metadata, not the full File object
      
      // Actions
      setCurrentPage: (page) => set({ currentPage: page }),
      setStatus: (status) => set({ status }),
      
      // File actions
      setFiles: async (audioFile, subtitleFile) => {
        // Create file metadata and extract content as Uint8Array
        let audioFileData = null;
        let subtitleFileData = null;
        
        if (audioFile) {
          const audioBuffer = await audioFile.arrayBuffer();
          const audioContent = new Uint8Array(audioBuffer);
          
          audioFileData = {
            name: audioFile.name,
            size: audioFile.size,
            type: audioFile.type,
            lastModified: audioFile.lastModified,
            content: Array.from(audioContent) // Convert to regular array for JSON serialization
          };
        }
        
        if (subtitleFile) {
          // For SRT files, we can just read them as text
          const text = await subtitleFile.text(); // More efficient for text files
          
          subtitleFileData = {
            name: subtitleFile.name,
            size: subtitleFile.size,
            type: subtitleFile.type,
            lastModified: subtitleFile.lastModified,
            textContent: text // Store as string instead of binary
          };
        }
        
        set({
          audioFile: audioFileData,
          subtitleFile: subtitleFileData
        });
      },
      
      clearFiles: () => set({
        audioFile: null,
        subtitleFile: null
      })
    }),
    {
      name: 'srt-editor-storage', // unique name for the storage key
      storage: createJSONStorage(() => indexedDBStorage),
      partialize: (state) => ({
        // Only persist these states
        audioFile: state.audioFile,
        subtitleFile: state.subtitleFile
      }),
    }
  )
);

export default useAppStore;