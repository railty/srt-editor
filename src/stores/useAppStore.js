import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Custom IndexedDB storage adapter for Zustand
const indexedDBStorage = {
  // Database configuration
  dbName: 'srt-editor-db',
  storeName: 'store',
  version: 2, // Increased version number to trigger onupgradeneeded

  // Get the IndexedDB database instance
  getDB: () => {
    return new Promise((resolve, reject) => {
      // Try to delete the database first if there's an issue
      let deleteRequest;
      
      try {
        // Check if the database exists
        const checkRequest = indexedDB.open(indexedDBStorage.dbName);
        
        checkRequest.onsuccess = (event) => {
          const db = event.target.result;
          const currentVersion = db.version;
          
          // Close the database connection
          db.close();
          
          // Open with the proper version
          const request = indexedDB.open(indexedDBStorage.dbName, indexedDBStorage.version);
          
          request.onerror = (event) => {
            console.error('IndexedDB error:', event.target.error);
            reject(event.target.error);
          };
          
          request.onsuccess = (event) => {
            const db = event.target.result;
            
            // Double check that our store exists
            if (!db.objectStoreNames.contains(indexedDBStorage.storeName)) {
              // Store doesn't exist, we need to close and reopen with a higher version
              db.close();
              
              // Try deleting the database to start fresh
              deleteRequest = indexedDB.deleteDatabase(indexedDBStorage.dbName);
              
              deleteRequest.onsuccess = () => {
                console.log('Database deleted successfully, recreating with proper schema');
                // Recreate the database with the store
                const recreateRequest = indexedDB.open(indexedDBStorage.dbName, indexedDBStorage.version);
                
                recreateRequest.onupgradeneeded = (event) => {
                  const db = event.target.result;
                  db.createObjectStore(indexedDBStorage.storeName);
                };
                
                recreateRequest.onsuccess = (event) => {
                  resolve(event.target.result);
                };
                
                recreateRequest.onerror = (event) => {
                  console.error('Error recreating database:', event.target.error);
                  reject(event.target.error);
                };
              };
              
              deleteRequest.onerror = (event) => {
                console.error('Error deleting database:', event.target.error);
                reject(event.target.error);
              };
            } else {
              // Store exists, resolve with the db
              resolve(db);
            }
          };
          
          request.onupgradeneeded = (event) => {
            const db = event.target.result;
            // Create object store if it doesn't exist
            if (!db.objectStoreNames.contains(indexedDBStorage.storeName)) {
              db.createObjectStore(indexedDBStorage.storeName);
            }
          };
        };
        
        checkRequest.onerror = (event) => {
          console.error('Error checking database:', event.target.error);
          
          // Try opening with upgrade directly
          const request = indexedDB.open(indexedDBStorage.dbName, indexedDBStorage.version);
          
          request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(indexedDBStorage.storeName)) {
              db.createObjectStore(indexedDBStorage.storeName);
            }
          };
          
          request.onsuccess = (event) => {
            resolve(event.target.result);
          };
          
          request.onerror = (event) => {
            reject(event.target.error);
          };
        };
      } catch (error) {
        console.error('Unexpected error initializing IndexedDB:', error);
        reject(error);
      }
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
        try {
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
        } catch (error) {
          console.error('Transaction error:', error);
          reject(error);
        }
      });
    } catch (error) {
      console.error('Failed to save item to IndexedDB:', error);
      // Use localStorage as fallback
      try {
        localStorage.setItem(
          `${indexedDBStorage.dbName}_fallback_${key}`,
          JSON.stringify(value)
        );
      } catch (lsError) {
        console.error('Also failed to use localStorage fallback:', lsError);
      }
    }
  },
  
  removeItem: async (key) => {
    try {
      const db = await indexedDBStorage.getDB();
      return new Promise((resolve, reject) => {
        try {
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
        } catch (error) {
          console.error('Transaction error in removeItem:', error);
          reject(error);
        }
      });
    } catch (error) {
      console.error('Failed to remove item from IndexedDB:', error);
      // Try removing from localStorage fallback
      try {
        localStorage.removeItem(`${indexedDBStorage.dbName}_fallback_${key}`);
      } catch (lsError) {
        console.error('Also failed to remove from localStorage fallback:', lsError);
      }
    }
  }
};

// Alternative implementation with localStorage if IndexedDB continues to fail
const createFallbackStorage = () => {
  // First try to use IndexedDB
  return {
    getItem: async (key) => {
      try {
        return await indexedDBStorage.getItem(key);
      } catch (error) {
        // Fall back to localStorage
        try {
          const value = localStorage.getItem(`${indexedDBStorage.dbName}_fallback_${key}`);
          return value ? JSON.parse(value) : null;
        } catch (lsError) {
          console.error('Error using localStorage fallback:', lsError);
          return null;
        }
      }
    },
    setItem: async (key, value) => {
      try {
        await indexedDBStorage.setItem(key, value);
      } catch (error) {
        // Fall back to localStorage
        try {
          localStorage.setItem(
            `${indexedDBStorage.dbName}_fallback_${key}`,
            JSON.stringify(value)
          );
        } catch (lsError) {
          console.error('Error using localStorage fallback:', lsError);
        }
      }
    },
    removeItem: async (key) => {
      try {
        await indexedDBStorage.removeItem(key);
      } catch (error) {
        // Fall back to localStorage
        try {
          localStorage.removeItem(`${indexedDBStorage.dbName}_fallback_${key}`);
        } catch (lsError) {
          console.error('Error using localStorage fallback:', lsError);
        }
      }
    }
  };
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
      storage: createJSONStorage(() => createFallbackStorage()),
      partialize: (state) => ({
        // Only persist these states
        audioFile: state.audioFile,
        subtitleFile: state.subtitleFile
      }),
    }
  )
);

export default useAppStore;