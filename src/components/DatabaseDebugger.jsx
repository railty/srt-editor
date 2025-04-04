import React, { useState, useEffect } from 'react';
import { recoverFromOldDatabase, recoverFromLocalStorage, showRecoveredDataUI } from '../utils/recoverOldData';

/**
 * A utility component to help debug and recover from database issues
 */
const DatabaseDebugger = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [databaseInfo, setDatabaseInfo] = useState({});
  const [isChecking, setIsChecking] = useState(false);
  const [recoveredData, setRecoveredData] = useState(null);

  // Check all IndexedDB databases
  const checkDatabases = async () => {
    setIsChecking(true);
    
    try {
      // Check if indexedDB.databases() is supported
      if (indexedDB.databases) {
        const databases = await indexedDB.databases();
        console.log('All databases:', databases);
        
        // Collect info about each database
        const dbInfos = {};
        
        for (const db of databases) {
          try {
            const request = indexedDB.open(db.name);
            
            request.onsuccess = (event) => {
              const dbInstance = event.target.result;
              dbInfos[db.name] = {
                name: db.name,
                version: dbInstance.version,
                stores: Array.from(dbInstance.objectStoreNames)
              };
              
              // If we've processed all databases, update state
              if (Object.keys(dbInfos).length === databases.length) {
                setDatabaseInfo(dbInfos);
                setIsChecking(false);
              }
              
              dbInstance.close();
            };
            
            request.onerror = (event) => {
              console.error(`Error opening database ${db.name}:`, event.target.error);
              dbInfos[db.name] = {
                name: db.name,
                error: event.target.error.message
              };
              
              // If we've processed all databases, update state
              if (Object.keys(dbInfos).length === databases.length) {
                setDatabaseInfo(dbInfos);
                setIsChecking(false);
              }
            };
          } catch (error) {
            console.error(`Error processing database ${db.name}:`, error);
            dbInfos[db.name] = {
              name: db.name,
              error: error.message
            };
            
            // If we've processed all databases, update state
            if (Object.keys(dbInfos).length === databases.length) {
              setDatabaseInfo(dbInfos);
              setIsChecking(false);
            }
          }
        }
      } else {
        // Legacy approach - try to open known databases
        const knownDatabases = [
          'srt-editor-db',
          'srt-editor-app-store',
          'srt-editor-audio-store'
        ];
        
        const dbInfos = {};
        
        for (const dbName of knownDatabases) {
          try {
            const request = indexedDB.open(dbName);
            
            request.onsuccess = (event) => {
              const dbInstance = event.target.result;
              dbInfos[dbName] = {
                name: dbName,
                version: dbInstance.version,
                stores: Array.from(dbInstance.objectStoreNames)
              };
              
              // If we've processed all databases, update state
              if (Object.keys(dbInfos).length === knownDatabases.length) {
                setDatabaseInfo(dbInfos);
                setIsChecking(false);
              }
              
              dbInstance.close();
            };
            
            request.onerror = (event) => {
              console.error(`Error opening database ${dbName}:`, event.target.error);
              dbInfos[dbName] = {
                name: dbName,
                error: event.target.error.message
              };
              
              // If we've processed all databases, update state
              if (Object.keys(dbInfos).length === knownDatabases.length) {
                setDatabaseInfo(dbInfos);
                setIsChecking(false);
              }
            };
          } catch (error) {
            console.error(`Error processing database ${dbName}:`, error);
            dbInfos[dbName] = {
              name: dbName,
              error: error.message
            };
            
            // If we've processed all databases, update state
            if (Object.keys(dbInfos).length === knownDatabases.length) {
              setDatabaseInfo(dbInfos);
              setIsChecking(false);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking databases:', error);
      setIsChecking(false);
    }
  };

  // Attempt to recover data from the old database structure
  const recoverData = async () => {
    setIsChecking(true);
    
    try {
      // First try to recover from IndexedDB
      const oldData = await recoverFromOldDatabase();
      
      // Then try localStorage as a fallback
      const localStorageData = await recoverFromLocalStorage();
      
      const allRecoveredData = {
        indexedDB: oldData,
        localStorage: localStorageData
      };
      
      setRecoveredData(allRecoveredData);
      
      // Show a UI with the recovered data
      if (oldData || localStorageData) {
        showRecoveredDataUI(allRecoveredData);
      }
    } catch (error) {
      console.error('Error recovering data:', error);
    } finally {
      setIsChecking(false);
    }
  };

  // Delete a database
  const deleteDatabase = (dbName) => {
    if (window.confirm(`Are you sure you want to delete the database "${dbName}"? This action cannot be undone.`)) {
      const request = indexedDB.deleteDatabase(dbName);
      
      request.onsuccess = () => {
        console.log(`Database "${dbName}" deleted successfully`);
        // Remove from state
        setDatabaseInfo((prev) => {
          const newState = { ...prev };
          delete newState[dbName];
          return newState;
        });
      };
      
      request.onerror = (event) => {
        console.error(`Error deleting database "${dbName}":`, event.target.error);
        alert(`Error deleting database: ${event.target.error.message}`);
      };
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded shadow"
      >
        Debug DB
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 shadow-lg rounded-lg p-4 w-80 max-h-96 overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold">Database Debugger</h3>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-2">
        <button
          onClick={checkDatabases}
          disabled={isChecking}
          className="bg-blue-500 text-white text-xs px-3 py-1 rounded disabled:bg-blue-300"
        >
          {isChecking ? 'Checking...' : 'Check Databases'}
        </button>
        
        <button
          onClick={recoverData}
          disabled={isChecking}
          className="bg-green-500 text-white text-xs px-3 py-1 rounded disabled:bg-green-300 ml-2"
        >
          {isChecking ? 'Recovering...' : 'Recover Data'}
        </button>
      </div>
      
      {Object.keys(databaseInfo).length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-semibold mb-2">Databases:</h4>
          <div className="space-y-2">
            {Object.values(databaseInfo).map((db) => (
              <div key={db.name} className="text-xs border border-gray-200 rounded p-2">
                <div className="flex justify-between">
                  <span className="font-bold">{db.name}</span>
                  <button
                    onClick={() => deleteDatabase(db.name)}
                    className="text-red-500 text-xs hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
                {db.error ? (
                  <div className="text-red-500">Error: {db.error}</div>
                ) : (
                  <>
                    <div>Version: {db.version}</div>
                    <div>
                      Stores: {db.stores.length > 0 ? db.stores.join(', ') : 'None'}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {recoveredData && (
        <div className="mt-4">
          <h4 className="text-xs font-semibold mb-2">Recovered Data:</h4>
          <div className="text-xs border border-gray-200 rounded p-2">
            <div>IndexedDB: {recoveredData.indexedDB ? 'Available' : 'None'}</div>
            <div>localStorage: {recoveredData.localStorage ? 'Available' : 'None'}</div>
            <button
              onClick={() => {
                console.log('Recovered Data:', recoveredData);
                alert('Recovered data logged to console');
              }}
              className="mt-2 bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded"
            >
              Log Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseDebugger;
