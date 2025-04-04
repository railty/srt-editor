import React, { useState } from 'react';
import { useAudioStore } from '../stores';

/**
 * Button component that allows exporting the current regions as an SRT file
 * Also includes utilities to check if persistence is working
 */
const ExportSrtButton = () => {
  const { regions, exportSrt } = useAudioStore();
  const [status, setStatus] = useState('');
  
  // Helper to check if IndexedDB is actually working
  const checkStorage = async () => {
    try {
      // Check if IndexedDB is supported
      if (!window.indexedDB) {
        setStatus('IndexedDB is not supported in this browser');
        return;
      }
      
      // Try opening the audio store database
      const dbName = 'srt-editor-audio-store';
      const request = indexedDB.open(dbName);
      
      request.onerror = (event) => {
        setStatus(`Error opening database: ${event.target.error.message}`);
      };
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        setStatus(`Successfully opened database: ${db.name}, version: ${db.version}, stores: ${Array.from(db.objectStoreNames).join(', ')}`);
        db.close();
      };
    } catch (error) {
      setStatus(`Error checking storage: ${error.message}`);
    }
  };
  
  const handleExport = () => {
    // Get the SRT content from the store
    const srtContent = exportSrt({ regions });
    
    // Create a blob with the SRT content
    const blob = new Blob([srtContent], { type: 'text/plain' });
    
    // Create a download link
    const url = URL.createObjectURL(blob);
    
    // Create an anchor element for downloading
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subtitles.srt';
    
    // Append to the body, click it, and remove it
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  return (
    <div className="flex flex-col space-y-2">
      <button
        onClick={handleExport}
        disabled={regions.length === 0}
        className={`px-4 py-2 rounded ${
          regions.length === 0
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        Export SRT
      </button>
      
      {/* Add debug button to check storage */}
      <button
        onClick={checkStorage}
        className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 text-xs"
      >
        Check Storage
      </button>
      
      {status && (
        <div className="text-xs text-gray-500 max-w-md overflow-hidden">
          {status}
        </div>
      )}
    </div>
  );
};

export default ExportSrtButton;
