/**
 * Utility functions for parsing SRT files
 */

/**
 * Converts SRT time format (HH:MM:SS,mmm) to seconds
 * @param {string} timeStr - Time string in SRT format (e.g., "00:01:23,456")
 * @returns {number} - Time in seconds
 */
export const timeToSeconds = (timeStr) => {
  const [time, millisStr] = timeStr.split(',');
  const [hours, minutes, seconds] = time.split(':').map(Number);
  const millis = parseInt(millisStr, 10);
  
  return hours * 3600 + minutes * 60 + seconds + (millis / 1000);
};

/**
 * Formats seconds to MM:SS format
 * @param {number} time - Time in seconds
 * @returns {string} - Formatted time string
 */
export const formatTime = (time) => {
  if (!time && time !== 0) return '00:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Formats seconds to MM:SS.mmm format
 * @param {number} time - Time in seconds
 * @returns {string} - Formatted time string with milliseconds
 */
export const formatTimeWithMs = (time) => {
  if (!time && time !== 0) return '00:00.000';
  
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  const milliseconds = Math.floor((time % 1) * 1000);
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
};

/**
 * Parse SRT content with speaker detection
 * @param {string} srtContent - Raw SRT file content
 * @returns {Array} - Array of subtitle objects
 */
export const parseSRTWithSpeakers = (srtContent) => {
  console.log("Parsing SRT content:", srtContent ? `${srtContent.substring(0, 100)}... (${srtContent.length} bytes)` : "No content");
  if (!srtContent) return [];

  // Split the content by double newline to get individual subtitle entries
  const entries = srtContent.split(/\r?\n\r?\n/);
  const subtitles = [];

  // Try to detect the speaker pattern
  let speakerPattern = null;
  
  // Check the first few entries to detect the pattern
  for (let i = 0; i < Math.min(5, entries.length); i++) {
    const entry = entries[i];
    if (!entry.trim()) continue;
    
    const lines = entry.split(/\r?\n/);
    if (lines.length < 3) continue;
    
    // Try different patterns
    const text = lines.slice(2).join("\n");
    
    // Pattern 1: "Speaker X:"
    if (text.match(/^Speaker\s+\d+:/)) {
      speakerPattern = "prefix";
      break;
    }
    
    // Pattern 2: "[Speaker X]"
    if (text.match(/^\[Speaker\s+\d+\]/)) {
      speakerPattern = "brackets";
      break;
    }
    
    // Pattern 3: Simply the number at the beginning
    if (text.match(/^(\d+):/)) {
      speakerPattern = "number";
      break;
    }
  }

  // Parse each entry
  for (const entry of entries) {
    // Skip empty entries
    if (!entry.trim()) continue;

    // Split each entry into lines
    const lines = entry.split(/\r?\n/);
    
    // We need at least 3 lines (index, time, and text)
    if (lines.length < 3) continue;

    // Extract info (skip the first line which is just the index)
    const timeString = lines[1];
    
    // Extract start and end times
    const timeMatch = timeString.match(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/);
    if (!timeMatch) continue;
    
    const startTimeStr = timeMatch[1];
    const endTimeStr = timeMatch[2];
    
    // Convert the time format to seconds
    const startTime = timeToSeconds(startTimeStr);
    const endTime = timeToSeconds(endTimeStr);

    // Get subtitle text (could be multiple lines)
    const text = lines.slice(2).join("\n");
    
    // Determine the speaker
    let speaker = null;
    
    if (speakerPattern === "prefix") {
      const match = text.match(/^Speaker\s+(\d+):/);
      if (match) {
        speaker = parseInt(match[1], 10);
      }
    } else if (speakerPattern === "brackets") {
      const match = text.match(/^\[Speaker\s+(\d+)\]/);
      if (match) {
        speaker = parseInt(match[1], 10);
      }
    } else if (speakerPattern === "number") {
      const match = text.match(/^(\d+):/);
      if (match) {
        speaker = parseInt(match[1], 10);
      }
    }
    
    // If we couldn't determine the speaker, default to 0
    if (speaker === null) {
      // Try a more generic approach - look for any number followed by a colon
      const genericMatch = text.match(/^(\d+):/);
      if (genericMatch) {
        speaker = parseInt(genericMatch[1], 10);
      } else {
        speaker = 0;
      }
    }

    // Extract clean text (without speaker prefix)
    let displayText = text;
    if (text.match(/^Speaker\s+\d+:/)) {
      displayText = text.replace(/^Speaker\s+\d+:\s*/, '');
    } else if (text.match(/^\[Speaker\s+\d+\]/)) {
      displayText = text.replace(/^\[Speaker\s+\d+\]\s*/, '');
    } else if (text.match(/^\d+:/)) {
      displayText = text.replace(/^\d+:\s*/, '');
    }

    subtitles.push({
      startTime,
      endTime,
      text,
      displayText,
      speaker
    });
  }

  return subtitles;
};

/**
 * Create a region label from subtitle text
 * @param {number} index - Region index
 * @param {string} text - Subtitle text 
 * @returns {string} - Truncated label
 */
export const createRegionLabel = (index, text) => {
  const truncatedText = text.substring(0, 20) + (text.length > 20 ? '...' : '');
  return `${index}: ${truncatedText}`;
};

/**
 * Get speaker badge color based on speaker ID
 * @param {number} speaker - Speaker ID
 * @returns {string} - Tailwind CSS classes for the badge
 */
export const getSpeakerBadgeColor = (speaker) => {
  if (speaker === 0) {
    return 'bg-red-100 text-red-800';
  } else if (speaker === 1) {
    return 'bg-blue-100 text-blue-800';
  } else {
    return 'bg-gray-100 text-gray-800';
  }
};

//2 sets, each sets has max 4 speakers
const speakerColors = {
  0: [
    'rgba(255, 99, 132, 0.5)',  // red
    'rgba(255, 159, 64, 0.5)',  // orange
    'rgba(255, 206, 86, 0.5)',  // yellow
    'rgba(75, 192, 192, 0.5)',  // teal
  ],
  1: [
    'rgba(54, 162, 235, 0.5)',  // blue
    'rgba(153, 102, 255, 0.5)', // purple
    'rgba(46, 204, 113, 0.5)',  // green
    'rgba(236, 64, 122, 0.5)',  // pink
  ]
};

/**
 * Get a color for a region based on speaker ID
 * @param {number} speaker - Speaker ID //0 or 1
 * @returns {string} - RGBA color string
 */
export const getSpeakerColor = (speaker) => {
  return speakerColors[1][speaker]; //0, 1, ,2, 3
};

/**
 * Get an inverted color for a region
 * @param {string} rgbaColor - Original RGBA color string 
 * @returns {string} - Inverted RGBA color string
 */
export const getInvertedColor = (rgbaColor) => {
  // Parse the RGBA color
  const match = rgbaColor.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
  if (!match) {
    return rgbaColor; // Return original if not valid RGBA
  }
  
  // Extract RGBA components
  const [, r, g, b, a] = match.map(v => parseFloat(v));
  
  // Invert RGB values (255 - value)
  const invertedR = 255 - r;
  const invertedG = 255 - g;
  const invertedB = 255 - b;
  
  // For more dramatic contrast, increase the alpha
  const newAlpha = Math.min(a * 2, 0.9); // Increase opacity but cap at 0.9
  
  // Return new RGBA string with increased alpha for better visibility
  return `rgba(${invertedR}, ${invertedG}, ${invertedB}, ${newAlpha})`;
};