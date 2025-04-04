import React from 'react';
import { useAudioStore } from '../../stores';
import PlaybackSpeed from './PlaybackSpeed';
import { formatTime } from '../../utils/srt/SrtParser';
import { ZOOM_LEVELS, getCurrentZoomIndex, formatZoomDisplay } from '../../utils/zoomUtils';

/**
 * Component for waveform playback controls
 */
const WaveformControls = ({ wavesurfer, isLoading }) => {
  // Get state and actions from audio store
  const { 
    isPlaying, 
    currentTime, 
    duration, 
    zoom, 
    setZoom,
    clearRegions 
  } = useAudioStore();

  // Handle play/pause
  const togglePlayPause = () => {
    if (wavesurfer && !isLoading) {
      try {
        wavesurfer.playPause();
      } catch (error) {
        console.warn('Error toggling play/pause:', error);
      }
    }
  };

  // Handle zoom in (double the current zoom)
  const handleZoomIn = () => {
    // We just need to update the zoom state
    // All the redrawing, region refresh logic is handled in the AudioWaveform component
    const currentIndex = getCurrentZoomIndex(zoom);
    const newIndex = Math.min(currentIndex + 1, ZOOM_LEVELS.length - 1);
    setZoom(ZOOM_LEVELS[newIndex]);
  };

  // Handle zoom out (halve the current zoom)
  const handleZoomOut = () => {
    const currentIndex = getCurrentZoomIndex(zoom);
    const newIndex = Math.max(currentIndex - 1, 0);
    setZoom(ZOOM_LEVELS[newIndex]);
  };

  // Reset zoom to default (1x)
  const resetZoom = () => {
    setZoom(1);
  };

  // Clear all regions
  const handleClearRegions = () => {
    if (wavesurfer && !isLoading) {
      try {
        // Find the regions plugin first - safely
        const regionsPlugin = wavesurfer.plugins.find(
          plugin => plugin.getRegions && typeof plugin.getRegions === 'function'
        );
        
        if (regionsPlugin) {
          regionsPlugin.clearRegions();
        }
      } catch (error) {
        console.warn('Error clearing regions:', error);
      }
      // Always clear regions in store
      clearRegions();
    }
  };

  return (
    <div className="flex items-center justify-between mt-2">
      <div className="flex items-center">
        <div className="text-sm text-gray-600 mr-3">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
        <PlaybackSpeed wavesurfer={wavesurfer} />
      </div>
      
      <div className="flex items-center space-x-2">
        <button
          onClick={handleZoomOut}
          disabled={getCurrentZoomIndex(zoom) === 0}
          className={`p-1 rounded-md ${getCurrentZoomIndex(zoom) === 0 ? 'text-gray-400' : 'text-blue-500 hover:bg-blue-50'}`}
          title="Zoom out"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            <path fillRule="evenodd" d="M5 8a1 1 0 011-1h4a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </button>
        <span className="text-sm text-gray-600">{formatZoomDisplay(zoom)}</span>
        <button
          onClick={handleZoomIn}
          disabled={getCurrentZoomIndex(zoom) === ZOOM_LEVELS.length - 1}
          className={`p-1 rounded-md ${getCurrentZoomIndex(zoom) === ZOOM_LEVELS.length - 1 ? 'text-gray-400' : 'text-blue-500 hover:bg-blue-50'}`}
          title="Zoom in"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            <path fillRule="evenodd" d="M5 8a1 1 0 011-1h4a1 1 0 010 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
            <path fillRule="evenodd" d="M8 5a1 1 0 011 1v4a1 1 0 01-2 0V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </button>
        <button
          onClick={resetZoom}
          className="text-blue-500 hover:bg-blue-50 p-1 rounded-md ml-1"
          title="Reset zoom"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
        </button>
        <button
          onClick={handleClearRegions}
          className="text-red-500 hover:bg-red-50 p-1 rounded-md ml-1"
          title="Clear regions"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      <button
        onClick={togglePlayPause}
        className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 transition-colors"
      >
        {isPlaying ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        )}
      </button>
    </div>
  );
};

export default WaveformControls;