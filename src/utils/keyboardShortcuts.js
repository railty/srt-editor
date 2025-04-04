/**
 * Keyboard shortcuts utility for audio controls
 */
import { ZOOM_LEVELS, getCurrentZoomIndex } from './zoomUtils';

/**
 * Sets up keyboard shortcuts for audio waveform navigation and control
 * @param {Object} wavesurfer - The WaveSurfer instance
 * @param {Function} setZoom - Function to set zoom level
 * @param {Number} zoom - Current zoom level
 * @returns {Function} - Cleanup function to remove event listeners
 */
export const setupAudioKeyboardShortcuts = (wavesurfer, setZoom, zoom) => {
  if (!wavesurfer) return () => {};
  
  const handleKeyDown = (e) => {
    // Only handle if not in input or textarea
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      return;
    }
    
    // Space - Play/Pause
    if (e.code === 'Space') {
      e.preventDefault(); // Prevent scrolling with space
      try {
        wavesurfer.playPause();
      } catch (error) {
        console.warn('Error handling keyboard shortcut (play/pause):', error);
      }
    }
    
    // Left Arrow - Rewind 5 seconds
    if (e.code === 'ArrowLeft') {
      e.preventDefault();
      try {
        const currentTime = wavesurfer.getCurrentTime();
        wavesurfer.setTime(Math.max(0, currentTime - 5));
      } catch (error) {
        console.warn('Error handling keyboard shortcut (rewind):', error);
      }
    }
    
    // Right Arrow - Forward 5 seconds
    if (e.code === 'ArrowRight') {
      e.preventDefault();
      try {
        const currentTime = wavesurfer.getCurrentTime();
        const duration = wavesurfer.getDuration() || 0;
        wavesurfer.setTime(Math.min(duration, currentTime + 5));
      } catch (error) {
        console.warn('Error handling keyboard shortcut (forward):', error);
      }
    }
    
    // Zoom in: = or +
    if (e.code === 'Equal') {
      e.preventDefault();
      // Get current index
      const currentIndex = getCurrentZoomIndex(zoom);
      // Get next zoom level
      const newIndex = Math.min(currentIndex + 1, ZOOM_LEVELS.length - 1);
      setZoom(ZOOM_LEVELS[newIndex]);
    }
    
    // Zoom out: -
    if (e.code === 'Minus') {
      e.preventDefault();
      // Get current index
      const currentIndex = getCurrentZoomIndex(zoom);
      // Get previous zoom level
      const newIndex = Math.max(currentIndex - 1, 0);
      setZoom(ZOOM_LEVELS[newIndex]);
    }
    
    // Reset zoom: 0
    if (e.code === 'Digit0') {
      e.preventDefault();
      setZoom(1);
    }
  };
  
  // Add event listener
  window.addEventListener('keydown', handleKeyDown);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('keydown', handleKeyDown);
  };
};
