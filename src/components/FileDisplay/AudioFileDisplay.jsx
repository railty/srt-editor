import React, { useState, useEffect } from 'react';
import { createURLFromStored } from '../../utils/fileUtils';

const AudioFileDisplay = ({ file }) => {
  if (!file) return null;
  
  const [audioURL, setAudioURL] = useState(null);
  
  // Create blob URL for audio playback when component mounts
  useEffect(() => {
    if (file && file.content) {
      const url = createURLFromStored(file);
      setAudioURL(url);
      
      // Clean up URL on unmount
      return () => {
        if (url) URL.revokeObjectURL(url);
      };
    }
  }, [file]);
  
  // Format file size in MB
  const formatSize = (bytes) => {
    return (bytes / (1024 * 1024)).toFixed(2);
  };
  
  return (
    <div className="bg-blue-50 p-4 rounded-md">
      <div className="flex items-center">
        <svg className="h-6 w-6 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
        <div>
          <h4 className="font-medium">Audio File</h4>
          <p className="text-sm text-gray-600">{file.name}</p>
          <p className="text-xs text-gray-500">
            Size: {formatSize(file.size)} MB
          </p>
          {audioURL && (
            <div className="mt-2">
              <audio 
                controls 
                className="w-full mt-2"
                src={audioURL}
              ></audio>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AudioFileDisplay;
