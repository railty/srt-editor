/**
 * Utility to recover data from the old database structure
 * This is a temporary solution to migrate data from the old structure to the new one
 */

/**
 * Try to read data from the old database structure
 * @param {string} key - Key to read from the old database
 * @returns {Promise<any>} - The data or null if not found
 */
export const recoverFromOldDatabase = () => {
  return new Promise((resolve, reject) => {
    try {
      // Attempt to open the old database
      const request = indexedDB.open('srt-editor-db');
      
      request.onerror = (event) => {
        console.error('Error opening old database:', event.target.error);
        resolve(null);
      };
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        console.log(`Successfully opened old database: ${db.name}, version: ${db.version}`);
        
        try {
          // Check if the old structure's stores exist
          const storeNames = Array.from(db.objectStoreNames);
          console.log(`Available stores in old database: ${storeNames.join(', ')}`);
          
          // Collect all data
          const recoveredData = {};
          
          // Process each store
          let storesProcessed = 0;
          let hasErrors = false;
          
          if (storeNames.length === 0) {
            console.log('No stores found in old database');
            db.close();
            resolve(null);
            return;
          }
          
          storeNames.forEach(storeName => {
            try {
              const transaction = db.transaction(storeName, 'readonly');
              const store = transaction.objectStore(storeName);
              const getAllRequest = store.getAll();
              
              getAllRequest.onsuccess = (event) => {
                const data = event.target.result;
                if (data && data.length > 0) {
                  recoveredData[storeName] = data;
                }
                
                // Check if we've processed all stores
                storesProcessed++;
                if (storesProcessed === storeNames.length) {
                  db.close();
                  if (hasErrors) {
                    resolve(null);
                  } else {
                    resolve(Object.keys(recoveredData).length > 0 ? recoveredData : null);
                  }
                }
              };
              
              getAllRequest.onerror = (event) => {
                console.error(`Error reading from store ${storeName}:`, event.target.error);
                hasErrors = true;
                storesProcessed++;
                if (storesProcessed === storeNames.length) {
                  db.close();
                  resolve(null);
                }
              };
            } catch (error) {
              console.error(`Error creating transaction for store ${storeName}:`, error);
              hasErrors = true;
              storesProcessed++;
              if (storesProcessed === storeNames.length) {
                db.close();
                resolve(null);
              }
            }
          });
        } catch (error) {
          console.error('Error processing old database:', error);
          db.close();
          resolve(null);
        }
      };
    } catch (error) {
      console.error('Unexpected error recovering old data:', error);
      resolve(null);
    }
  });
};

/**
 * Attempts to recover app state from localStorage as a fallback
 * @returns {Object|null} Recovered app data or null if not found
 */
export const recoverFromLocalStorage = () => {
  try {
    // Check for app data
    const appDataKey = 'srt-editor-storage';
    const appData = localStorage.getItem(appDataKey);
    
    // Check for audio data
    const audioDataKey = 'srt-editor-audio-storage';
    const audioData = localStorage.getItem(audioDataKey);
    
    // Check for legacy fallback keys
    const legacyKeys = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i))
      .filter(key => key.startsWith('srt-editor-db_fallback_'));
    
    const legacyData = {};
    legacyKeys.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          legacyData[key] = JSON.parse(value);
        }
      } catch (e) {
        console.error(`Error parsing localStorage key ${key}:`, e);
      }
    });
    
    const recoveredData = {
      app: appData ? JSON.parse(appData) : null,
      audio: audioData ? JSON.parse(audioData) : null,
      legacy: Object.keys(legacyData).length > 0 ? legacyData : null
    };
    
    return Object.values(recoveredData).some(v => v !== null) ? recoveredData : null;
  } catch (error) {
    console.error('Error recovering from localStorage:', error);
    return null;
  }
};

/**
 * Add a debugging UI to the page to show recovered data
 * @param {Object} data - The recovered data
 */
export const showRecoveredDataUI = (data) => {
  if (!data) return;
  
  // Create a container
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.bottom = '20px';
  container.style.right = '20px';
  container.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
  container.style.border = '1px solid #ccc';
  container.style.borderRadius = '5px';
  container.style.padding = '10px';
  container.style.maxWidth = '300px';
  container.style.maxHeight = '200px';
  container.style.overflow = 'auto';
  container.style.zIndex = '9999';
  container.style.fontSize = '12px';
  container.style.fontFamily = 'monospace';
  
  // Add a title
  const title = document.createElement('div');
  title.textContent = 'Recovered Data';
  title.style.fontWeight = 'bold';
  title.style.marginBottom = '5px';
  container.appendChild(title);
  
  // Add a close button
  const closeButton = document.createElement('button');
  closeButton.textContent = 'X';
  closeButton.style.position = 'absolute';
  closeButton.style.top = '5px';
  closeButton.style.right = '5px';
  closeButton.style.border = 'none';
  closeButton.style.background = 'none';
  closeButton.style.cursor = 'pointer';
  closeButton.onclick = () => {
    document.body.removeChild(container);
  };
  container.appendChild(closeButton);
  
  // Add data overview
  const overview = document.createElement('div');
  overview.innerHTML = `
    <div>Found data types:</div>
    <ul>
      ${Object.keys(data).map(key => `
        <li>${key}: ${data[key] ? 'Yes' : 'No'}</li>
      `).join('')}
    </ul>
  `;
  container.appendChild(overview);
  
  // Add a button to show data details in console
  const detailsButton = document.createElement('button');
  detailsButton.textContent = 'Log Details to Console';
  detailsButton.style.marginTop = '5px';
  detailsButton.style.padding = '3px 5px';
  detailsButton.style.fontSize = '11px';
  detailsButton.onclick = () => {
    console.group('Recovered Data Details');
    Object.keys(data).forEach(key => {
      console.group(key);
      console.log(data[key]);
      console.groupEnd();
    });
    console.groupEnd();
    alert('Data logged to console. Open developer tools to view.');
  };
  container.appendChild(detailsButton);
  
  // Add to page
  document.body.appendChild(container);
};
