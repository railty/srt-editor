import React, { useState, useEffect } from 'react';
import { createURLFromStored } from '../../utils/fileUtils';
import AudioWaveform from '../AudioWaveform';

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
        <div className="w-full">
          <p className="text-sm text-gray-600">{file.name}</p>
          <p className="text-xs text-gray-500">
            Size: {formatSize(file.size)} MB
          </p>
          {audioURL && (
            <div className="mt-2">
              <AudioWaveform audioURL={audioURL} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AudioFileDisplay;
