import React, { useState } from 'react';

const PlaybackSpeed = ({ wavesurfer }) => {
  const [speed, setSpeed] = useState(1.0);
  const [isOpen, setIsOpen] = useState(false);
  
  const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
  
  const handleSpeedChange = (newSpeed) => {
    if (wavesurfer) {
      try {
        wavesurfer.setPlaybackRate(newSpeed);
        setSpeed(newSpeed);
      } catch (error) {
        console.warn('Error setting playback rate:', error);
      }
    } else {
      // Still update the UI even if the wavesurfer operation failed
      setSpeed(newSpeed);
    }
    setIsOpen(false);
  };
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center text-blue-500 hover:text-blue-700 p-1 rounded text-sm"
        title="Playback speed"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
        </svg>
        {speed}x
      </button>
      
      {isOpen && (
        <div className="absolute z-10 mt-1 bg-white shadow-lg rounded-md overflow-hidden">
          {speedOptions.map((option) => (
            <button
              key={option}
              onClick={() => handleSpeedChange(option)}
              className={`block w-full text-left px-4 py-2 text-sm ${
                speed === option ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
              }`}
            >
              {option}x
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlaybackSpeed;
