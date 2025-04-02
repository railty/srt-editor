import React, { useState } from 'react';

const KeyboardShortcutsHelp = () => {
  const [showHelp, setShowHelp] = useState(false);
  
  return (
    <div className="relative">
      <button
        onClick={() => setShowHelp(!showHelp)}
        className="text-blue-500 hover:text-blue-700 p-1 rounded-md"
        title="Keyboard shortcuts help"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
      </button>
      
      {showHelp && (
        <div className="absolute right-0 z-10 mt-2 bg-white shadow-lg rounded-md p-4 w-64 text-sm">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium">Keyboard Shortcuts</h4>
            <button 
              onClick={() => setShowHelp(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <ul className="space-y-1">
            <li className="flex items-center justify-between">
              <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">Space</span>
              <span>Play/Pause</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">←</span>
              <span>Rewind 5 seconds</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">→</span>
              <span>Forward 5 seconds</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">+</span>
              <span>Zoom in</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">-</span>
              <span>Zoom out</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">0</span>
              <span>Reset zoom</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default KeyboardShortcutsHelp;
