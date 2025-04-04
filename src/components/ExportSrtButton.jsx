import React from 'react';
import { useAudioStore } from '../stores';

/**
 * Button component that allows exporting the current regions as an SRT file
 */
const ExportSrtButton = () => {
  const { regions, exportSrt } = useAudioStore();
  
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
  );
};

export default ExportSrtButton;
