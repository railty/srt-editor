import React from 'react';
import KeyboardShortcutsHelp from './KeyboardShortcutsHelp';

/**
 * Component for waveform header section, including title and speaker legend
 */
const WaveformHeader = () => {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <div className="font-medium">Audio Waveform</div>
        <KeyboardShortcutsHelp />
      </div>
      
      {/* Speaker legend */}
      <div className="flex items-center space-x-4 mb-2 text-xs text-gray-700">
        <div className="flex items-center">
          <div className="w-4 h-4 mr-1 bg-red-300 rounded-sm"></div>
          <span>Speaker 0 (Top)</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 mr-1 bg-blue-300 rounded-sm"></div>
          <span>Speaker 1 (Bottom)</span>
        </div>
      </div>
      
      <div className="text-xs text-gray-500 mt-1">
        <p>Click a region to select it. Drag region edges to resize.</p>
      </div>
    </div>
  );
};

export default WaveformHeader;