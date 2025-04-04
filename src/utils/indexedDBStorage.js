import { createJSONStorage } from 'zustand/middleware';

/**
 * Creates an IndexedDB storage adapter for Zustand persist middleware with localStorage fallback
 * @param {string} storeName - Name of the object store within the IndexedDB
 * @returns {Object} - Storage adapter compatible with Zustand's persist middleware
 */
export const createIndexedDBStorage = (storeName) => {
  // Basic configuration
  const config = {
    dbNamePrefix: 'srt-editor-new-',
    version: 1,
    objectStoreName: 'data', // We'll use a fixed object store name
  };

  // Each store gets its own database to avoid conflicts (with a new prefix to avoid conflicts with old data)
  const dbName = `${config.dbNamePrefix}${storeName}`;

  // Create the IndexedDB storage adapter
  const indexedDBStorage = {
    // Database configuration
    dbName: dbName,
    objectStoreName: config.objectStoreName,
    version: config.version,
    storeName: storeName, // Keep for reference

    // Get the IndexedDB database instance
    getDB: () => {
      return new Promise((resolve, reject) => {
        try {
          // Open the database
          const request = indexedDB.open(indexedDBStorage.dbName, indexedDBStorage.version);
          
          // Handle database upgrade (creating stores if needed)
          request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Create object store if it doesn't exist
            if (!db.objectStoreNames.contains(indexedDBStorage.objectStoreName)) {
              db.createObjectStore(indexedDBStorage.objectStoreName);
            }
          };
          
          request.onerror = (event) => {
            console.error(`Error opening database ${indexedDBStorage.dbName}:`, event.target.error);
            reject(event.target.error);
          };
          
          request.onsuccess = (event) => {
            const db = event.target.result;
            resolve(db);
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
          try {
            const transaction = db.transaction(indexedDBStorage.objectStoreName, 'readonly');
            const store = transaction.objectStore(indexedDBStorage.objectStoreName);
            const request = store.get(key);
            
            request.onerror = (event) => {
              console.error('Error getting item:', event.target.error);
              db.close();
              reject(event.target.error);
            };
            
            request.onsuccess = (event) => {
              const result = event.target.result;
              db.close();
              resolve(result);
            };
          } catch (error) {
            console.error('Transaction error in getItem:', error);
            db.close();
            reject(error);
          }
        });
      } catch (error) {
        console.error('Failed to get item from IndexedDB:', error);
        
        // Fall back to localStorage
        try {
          const value = localStorage.getItem(
            `${indexedDBStorage.dbName}_fallback_${key}`
          );
          return value ? JSON.parse(value) : null;
        } catch (lsError) {
          console.error('Also failed to use localStorage fallback:', lsError);
          return null;
        }
      }
    },
    
    setItem: async (key, value) => {
      try {
        const db = await indexedDBStorage.getDB();
        return new Promise((resolve, reject) => {
          try {
            const transaction = db.transaction(indexedDBStorage.objectStoreName, 'readwrite');
            const store = transaction.objectStore(indexedDBStorage.objectStoreName);
            const request = store.put(value, key);
            
            // Add transaction complete event for better reliability
            transaction.oncomplete = (event) => {
              //console.log(`IndexedDB transaction completed successfully for key ${key}`);
              db.close();
              resolve();
            };
            
            transaction.onerror = (event) => {
              console.error('Transaction error in setItem:', event.target.error);
              db.close();
              reject(event.target.error);
            };
            
            request.onerror = (event) => {
              console.error('Error setting item:', event.target.error);
              // Don't close DB here, let transaction handlers handle it
              reject(event.target.error);
            };
            
            request.onsuccess = (event) => {
              // Just log success, let transaction.oncomplete close the DB
              //console.log(`IndexedDB item set successfully for key ${key}`);
            };
          } catch (error) {
            console.error('Transaction error in setItem:', error);
            db.close();
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
          console.log(`Fallback to localStorage for key ${key}`);
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
            const transaction = db.transaction(indexedDBStorage.objectStoreName, 'readwrite');
            const store = transaction.objectStore(indexedDBStorage.objectStoreName);
            const request = store.delete(key);
            
            request.onerror = (event) => {
              console.error('Error removing item:', event.target.error);
              db.close();
              reject(event.target.error);
            };
            
            request.onsuccess = (event) => {
              db.close();
              resolve();
            };
          } catch (error) {
            console.error('Transaction error in removeItem:', error);
            db.close();
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

  // Return the storage with Zustand's JSONStorage wrapper
  return createJSONStorage(() => indexedDBStorage);
};
