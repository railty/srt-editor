/**
 * Utility functions for handling zoom in the audio waveform
 */

// Logarithmic zoom levels
export const ZOOM_LEVELS = [0.0625, 0.125, 0.25, 0.5, 1, 2, 4, 8, 16];

/**
 * Gets the current zoom index from the zoom levels array
 * @param {number} zoom - Current zoom value
 * @returns {number} - Index of the current zoom in the zoom levels array
 */
export const getCurrentZoomIndex = (zoom) => {
  const index = ZOOM_LEVELS.findIndex(level => Math.abs(level - zoom) < 0.001);
  return index !== -1 ? index : ZOOM_LEVELS.indexOf(1); // Default to index of 1x zoom if not found
};

/**
 * Formats the zoom display value
 * @param {number} zoomValue - Current zoom value
 * @returns {string} - Formatted zoom display string
 */
export const formatZoomDisplay = (zoomValue) => {
  if (zoomValue < 1) {
    return `1/${Math.round(1/zoomValue)}`;
  }
  return `${zoomValue}x`;
};
