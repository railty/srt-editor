/**
 * Utility functions for file handling
 */

/**
 * Creates a File object from stored file data
 * @param {Object} fileData - The file data with content and metadata
 * @returns {File|null} - A reconstructed File object or null if the data is invalid
 */
export const createFileFromStored = (fileData) => {
  if (!fileData || !fileData.content) return null;
  
  // Convert the array back to Uint8Array
  const uint8Array = new Uint8Array(fileData.content);
  
  // Create a Blob from the Uint8Array
  const blob = new Blob([uint8Array], { type: fileData.type });
  
  // Create a File object from the Blob
  const file = new File([blob], fileData.name, {
    type: fileData.type,
    lastModified: fileData.lastModified
  });
  
  return file;
};

/**
 * Creates a URL for a stored file that can be used for playback or download
 * @param {Object} fileData - The file data with content and metadata
 * @returns {string|null} - A blob URL for the file or null if the data is invalid
 */
export const createURLFromStored = (fileData) => {
  if (!fileData || !fileData.content) return null;
  
  const uint8Array = new Uint8Array(fileData.content);
  const blob = new Blob([uint8Array], { type: fileData.type });
  
  return URL.createObjectURL(blob);
};

/**
 * Gets the text content from a stored subtitle file
 * @param {Object} fileData - The subtitle file data
 * @returns {Promise<string|null>} - The text content or null if invalid
 */
export const getSubtitleTextContent = async (fileData) => {
  if (!fileData) return null;
  
  // If the subtitle is stored as text, return it directly
  if (fileData.textContent) {
    return fileData.textContent;
  }
  
  // Fallback to the older format for backwards compatibility
  if (fileData.content) {
    const uint8Array = new Uint8Array(fileData.content);
    const blob = new Blob([uint8Array], { type: 'text/plain' });
    
    try {
      return await blob.text();
    } catch (error) {
      console.error('Error reading subtitle text:', error);
      return null;
    }
  }
  
  return null;
};
