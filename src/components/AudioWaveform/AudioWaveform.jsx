import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline';
import { useAudioStore, useAppStore } from '../../stores';
import RegionsList from './RegionsList';
import KeyboardShortcutsHelp from './KeyboardShortcutsHelp';
import PlaybackSpeed from './PlaybackSpeed';
import { setupAudioKeyboardShortcuts } from '../../utils/keyboardShortcuts';

// Helper function to parse SRT files with speaker detection
const parseSRTWithSpeakers = (srtContent) => {
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

    subtitles.push({
      startTime,
      endTime,
      text,
      speaker
    });
  }

  return subtitles;
};

// Helper function to convert SRT time format (HH:MM:SS,mmm) to seconds
const timeToSeconds = (timeStr) => {
  const [time, millisStr] = timeStr.split(',');
  const [hours, minutes, seconds] = time.split(':').map(Number);
  const millis = parseInt(millisStr, 10);
  
  return hours * 3600 + minutes * 60 + seconds + (millis / 1000);
};

const AudioWaveform = ({ audioURL }) => {
  const waveformRef = useRef(null);
  const wavesurferRef = useRef(null);
  const regionsPluginRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get the subtitle file from the app store
  const { subtitleFile } = useAppStore();
  
  // Get state and actions from our Zustand store
  const {
    zoom, setZoom,
    isPlaying, setIsPlaying,
    duration, setDuration,
    currentTime, setCurrentTime,
    addRegion, removeRegion, clearRegions,
    selectedRegionId, selectRegion
  } = useAudioStore();

  // Function to create regions from SRT file with speaker detection
  const createRegionsFromSRT = () => {
    if (!subtitleFile || !subtitleFile.textContent || !wavesurferRef.current || !regionsPluginRef.current) {
      return;
    }
    
    const regions = parseSRTWithSpeakers(subtitleFile.textContent);
    let regionCounter = 0;
    
    // Colors for different speakers
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
    
    // Add each subtitle as a region
    regions.forEach((subtitle) => {
      try {
        regionCounter++;
        // Extract just the text without the speaker prefix
        let displayText = subtitle.text;
        if (displayText.match(/^Speaker\s+\d+:/)) {
          displayText = displayText.replace(/^Speaker\s+\d+:\s*/, '');
        } else if (displayText.match(/^\[Speaker\s+\d+\]/)) {
          displayText = displayText.replace(/^\[Speaker\s+\d+\]\s*/, '');
        } else if (displayText.match(/^\d+:/)) {
          displayText = displayText.replace(/^\d+:\s*/, '');
        }
        
        const regionLabel = `${regionCounter}: ${displayText.substring(0, 20)}${displayText.length > 20 ? '...' : ''}`;
        
        // Determine which colors to use based on speaker
        const speakerIdx = subtitle.speaker % 2; // Ensure we only use 0 or 1
        const colorSet = speakerColors[speakerIdx] || speakerColors[0];
        const color = colorSet[Math.floor(Math.random() * colorSet.length)];
        
        // Calculate vertical position based on speaker
        // Speaker 0 on top half, Speaker 1 on bottom half
        let top, height;
        
        if (speakerIdx === 0) {
          // Speaker 0: Top half
          top = 0;
          height = 50; // 50% of the height
        } else {
          // Speaker 1: Bottom half
          top = 50;
          height = 50; // 50% of the height
        }
        
        // Create the region with custom positioning
        const region = regionsPluginRef.current.addRegion({
          start: subtitle.startTime,
          end: subtitle.endTime,
          color: color,
          drag: true,
          resize: true,
          // Custom options for positioning
          customAttributes: {
            speaker: subtitle.speaker,
            fromSRT: true // Mark this region as created from SRT to avoid duplication
          }
        });
        
        // Manually set the region's position after it's created
        if (region && region.element) {
          // Add the label as a data attribute
          region.element.setAttribute('data-label', regionLabel);
          
          // Apply CSS to position the region vertically
          region.element.style.top = `${top}%`;
          region.element.style.height = `${height}%`;
          
          // Add speaker class for styling
          region.element.classList.add(`speaker-${speakerIdx}`);
        }
        
        // Add the region to our Zustand store with speaker info
        addRegion({
          id: region.id,
          start: subtitle.startTime,
          end: subtitle.endTime,
          color: color,
          label: regionLabel,
          speaker: subtitle.speaker
        });
      } catch (error) {
        console.error('Error creating region from SRT:', error);
      }
    });
  };

  // Initialize WaveSurfer when component mounts
  useEffect(() => {
    let wavesurfer = null;
    let regionCounter = 0;
    let isComponentMounted = true; // Flag to track if component is still mounted
    
    const initWaveSurfer = async () => {
      setIsLoading(true);
      
      if (audioURL && waveformRef.current) {
        try {        
          // Add custom CSS for region labels
          const style = document.createElement('style');
          style.textContent = `
            .wavesurfer-region::before {
              content: attr(data-label);
              position: absolute;
              top: 0;
              left: 2px;
              color: #000;
              font-size: 10px;
              font-weight: bold;
              background-color: rgba(255, 255, 255, 0.7);
              padding: 0 4px;
              border-radius: 2px;
              pointer-events: none;
              z-index: 2;
            }
            .wavesurfer-region.speaker-0 {
              top: 0 !important;
              height: 50% !important;
            }
            .wavesurfer-region.speaker-1 {
              top: 50% !important;
              height: 50% !important;
            }
            .wavesurfer-region.region-selected {
              box-shadow: 0 0 0 2px #ffff00 !important;
              border: 2px solid #ffff00 !important;
              z-index: 5 !important;
            }
          `;
          document.head.appendChild(style);
          
          // Create the regions plugin first - without dragSelection to disable drag functionality
          const regionsPlugin = RegionsPlugin.create();
          
          // Store reference to regions plugin
          regionsPluginRef.current = regionsPlugin;
          
          // Create WaveSurfer instance
          wavesurfer = WaveSurfer.create({
            container: waveformRef.current,
            waveColor: '#4a83ff',
            progressColor: '#1a56db',
            cursorColor: '#f87171',
            barWidth: 2,
            barRadius: 3,
            cursorWidth: 1,
            height: 100,
            barGap: 2,
            responsive: true,
            normalize: true,
            plugins: [
              // Timeline plugin for time indicators
              TimelinePlugin.create({
                container: '#timeline',
                timeInterval: 0.5,
                primaryLabelInterval: 5,
                secondaryLabelInterval: 1,
                formatTimeCallback: (seconds) => {
                  return formatTime(seconds);
                },
              }),
              // Add our regions plugin
              regionsPlugin
            ],
          });

          // Store the instance
          wavesurferRef.current = wavesurfer;

          // Add event listeners
          wavesurfer.on('ready', () => {
            if (!isComponentMounted) return; // Skip if component unmounted
            setDuration(wavesurfer.getDuration());
            setIsLoading(false);
            
            // We're disabling drag selection as requested
            // Instead, create regions from SRT file
            createRegionsFromSRT();
          });

          wavesurfer.on('play', () => {
            if (!isComponentMounted) return; // Skip if component unmounted
            setIsPlaying(true);
          });

          wavesurfer.on('pause', () => {
            if (!isComponentMounted) return; // Skip if component unmounted
            setIsPlaying(false);
          });

          wavesurfer.on('audioprocess', () => {
            if (!isComponentMounted) return; // Skip if component unmounted
            setCurrentTime(wavesurfer.getCurrentTime());
          });

          wavesurfer.on('seek', () => {
            if (!isComponentMounted) return; // Skip if component unmounted
            setCurrentTime(wavesurfer.getCurrentTime());
          });
          
          // Set up region events
          if (regionsPlugin) {
            // Regions events
            regionsPlugin.on('region-created', (region) => {
              // We'll check if this region was created by our createRegionsFromSRT function
              // If it has a customAttributes.fromSRT property, we've already added it to the store
              if (region.customAttributes && region.customAttributes.fromSRT) {
                // Region was created by our SRT parser, already in store
                return;
              }
              
              // This is for manually created regions (if we ever re-enable that feature)
              // Increment counter for each new region
              regionCounter++;
              const regionLabel = `Region ${regionCounter}`;
              
              // Set a more distinct color with higher contrast for the region
              const colors = [
                'rgba(255, 99, 132, 0.5)',   // red
                'rgba(54, 162, 235, 0.5)',   // blue
                'rgba(255, 206, 86, 0.5)',   // yellow
                'rgba(75, 192, 192, 0.5)',   // teal
                'rgba(153, 102, 255, 0.5)',  // purple
                'rgba(255, 159, 64, 0.5)',   // orange
                'rgba(46, 204, 113, 0.5)',   // green
                'rgba(236, 64, 122, 0.5)',   // pink
              ];
              const color = colors[Math.floor(Math.random() * colors.length)];
              
              // Configure the region with our options
              try {
                region.setOptions({
                  color: color,
                  drag: true,
                  resize: true
                });
                
                // Add the label as a data attribute to the region element
                if (region.element) {
                  region.element.setAttribute('data-label', regionLabel);
                }
                
                if (isComponentMounted) {
                  // Store the region in our Zustand store
                  addRegion({
                    id: region.id,
                    start: region.start,
                    end: region.end,
                    color: color,
                    label: regionLabel
                  });
                }
              } catch (error) {
                console.error('Error configuring region:', error);
              }
            });
            
            regionsPlugin.on('region-clicked', (region) => {
              if (!isComponentMounted) return; // Skip if component unmounted
              
              // Instead of playing, select the region
              selectRegion(region.id);
              
              // Apply highlighting to the selected region
              if (regionsPlugin && regionsPlugin.getRegions) {
                const regions = regionsPlugin.getRegions();
                
                // Reset all regions to their original colors
                regions.forEach(r => {
                  if (r.element && r.id !== region.id) {
                    // Remove selection class if it exists
                    r.element.classList.remove('region-selected');
                  }
                });
                
                // Add selection style to clicked region
                if (region.element) {
                  region.element.classList.add('region-selected');
                }
              }
            });
            
            regionsPlugin.on('region-removed', (region) => {
              if (!isComponentMounted) return; // Skip if component unmounted
              // Remove the region from our store
              removeRegion(region.id);
            });
          }

          // Load audio with error handling
          try {
            // Create an AbortController to manage the fetch request
            const controller = new AbortController();
            const signal = controller.signal;
            
            // Store the controller in a ref so we can abort it during cleanup
            const abortRef = { controller };
            
            // Start loading the audio
            await wavesurfer.load(audioURL, null, signal);
            
            // Clean up the abort controller if component unmounts during load
            return () => {
              try {
                if (abortRef.controller) {
                  abortRef.controller.abort();
                }
              } catch (error) {
                console.warn('Error aborting audio load:', error);
              }
            };
          } catch (error) {
            // Only log and set loading state if component is still mounted
            if (isComponentMounted) {
              if (error.name !== 'AbortError') {
                console.error('Error loading audio:', error);
              }
              setIsLoading(false);
            }
          }
        } catch (error) {
          if (isComponentMounted) {
            console.error('Error initializing WaveSurfer:', error);
            setIsLoading(false);
          }
        }
      }
    };

    const cleanup = initWaveSurfer();

    // Clean up on unmount
    return () => {
      isComponentMounted = false; // Mark component as unmounted
      
      // Execute any cleanup returned from initWaveSurfer (for aborting audio load)
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }
      
      // It's important to first set the state references to null before destroying
      // to prevent other useEffect hooks from triggering errors
      const wavesurferInstance = wavesurferRef.current;
      wavesurferRef.current = null;
      regionsPluginRef.current = null;
      
      // Then destroy the wavesurfer instance if it exists
      if (wavesurferInstance) {
        try {
          // Use setTimeout to ensure this happens after other effects have processed
          setTimeout(() => {
            try {
              wavesurferInstance.destroy();
            } catch (error) {
              // Don't log AbortErrors as they're expected during unmount
              if (error.name !== 'AbortError') {
                console.warn('Error destroying WaveSurfer:', error);
              }
            }
          }, 0);
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.warn('Error in cleanup function:', error);
          }
        }
      }
    };
  }, [audioURL, addRegion, removeRegion, setDuration, setIsPlaying, setCurrentTime, subtitleFile, selectRegion]);

  // Apply selection styling when selectedRegionId changes
  useEffect(() => {
    if (regionsPluginRef.current && selectedRegionId && !isLoading) {
      try {
        const regions = regionsPluginRef.current.getRegions();
        
        // Reset all regions
        regions.forEach(region => {
          if (region.element) {
            region.element.classList.remove('region-selected');
          }
        });
        
        // Find and highlight the selected region
        const selectedRegion = regions.find(r => r.id === selectedRegionId);
        if (selectedRegion && selectedRegion.element) {
          selectedRegion.element.classList.add('region-selected');
        }
      } catch (error) {
        console.warn('Error updating region selection:', error);
      }
    }
  }, [selectedRegionId, isLoading]);
  
  // Update zoom when it changes
  useEffect(() => {
    if (wavesurferRef.current && !isLoading && wavesurferRef.current.getDecodedData) {
      try {
        // Only set zoom if audio is actually loaded
        if (wavesurferRef.current.getDecodedData()) {
          wavesurferRef.current.zoom(zoom * 50);
        }
      } catch (error) {
        console.warn('Error setting zoom:', error);
      }
    }
  }, [zoom, isLoading]);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (wavesurferRef.current && !isLoading && waveformRef.current) {
        try {
          // Make sure drawer exists before accessing containerWidth
          if (wavesurferRef.current.drawer) {
            wavesurferRef.current.drawer.containerWidth = waveformRef.current.clientWidth;
            wavesurferRef.current.drawBuffer();
          }
        } catch (error) {
          console.warn('Error during resize:', error);
        }
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isLoading]);
  
  // Start/stop time updates based on playing state
  useEffect(() => {
    // Using a ref for the animation frame ID so we can cancel it later
    let animationFrameId;
    
    // Function to update time while playing
    const updateCurrentTimeWhilePlaying = () => {
      if (wavesurferRef.current && isPlaying) {
        setCurrentTime(wavesurferRef.current.getCurrentTime());
        animationFrameId = requestAnimationFrame(updateCurrentTimeWhilePlaying);
      }
    };
    
    if (isPlaying) {
      animationFrameId = requestAnimationFrame(updateCurrentTimeWhilePlaying);
    }
    
    // Clean up animation frame on unmount or when isPlaying changes
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isPlaying, setCurrentTime]);
  
  // Setup keyboard shortcuts
  useEffect(() => {
    if (wavesurferRef.current) {
      const cleanup = setupAudioKeyboardShortcuts(wavesurferRef.current, setZoom, zoom);
      return cleanup;
    }
  }, [zoom, setZoom]);

  // Handle play/pause
  const togglePlayPause = () => {
    if (wavesurferRef.current && !isLoading) {
      try {
        wavesurferRef.current.playPause();
      } catch (error) {
        console.warn('Error toggling play/pause:', error);
        // Manually toggle the play state if wavesurfer fails
        setIsPlaying(!isPlaying);
      }
    }
  };

  // Handle zoom in
  const handleZoomIn = () => {
    setZoom(Math.min(zoom + 1, 10));
  };

  // Handle zoom out
  const handleZoomOut = () => {
    setZoom(Math.max(zoom - 1, 1));
  };

  // Format time in MM:SS format
  const formatTime = (time) => {
    if (!time) return '00:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Reset zoom to default
  const resetZoom = () => {
    setZoom(1);
  };

  // Clear all regions
  const handleClearRegions = () => {
    if (regionsPluginRef.current && !isLoading) {
      try {
        regionsPluginRef.current.clearRegions();
      } catch (error) {
        console.warn('Error clearing regions:', error);
      }
      // Always clear regions in store
      clearRegions();
    }
  };

  return (
    <div className="mt-4 bg-white p-4 rounded-md shadow-sm">
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
        
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-50 z-10">
              <div className="flex items-center space-x-2">
                <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm text-blue-500">Loading waveform...</span>
              </div>
            </div>
          )}
          
          {/* Horizontal divider line to separate speakers */}
          <div className="absolute top-1/2 left-0 right-0 border-t border-gray-300 z-10 pointer-events-none"></div>
          
          <div 
            ref={waveformRef} 
            className="w-full bg-gray-50 rounded-md"
          ></div>
        </div>
        <div id="timeline" className="w-full h-10"></div>
        <div className="text-xs text-gray-500 mt-1">
          <p>Click a region to play it. Drag region edges to resize.</p>
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center">
          <div className="text-sm text-gray-600 mr-3">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
          <PlaybackSpeed wavesurfer={wavesurferRef.current} />
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 1}
            className={`p-1 rounded-md ${zoom <= 1 ? 'text-gray-400' : 'text-blue-500 hover:bg-blue-50'}`}
            title="Zoom out"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M5 8a1 1 0 011-1h4a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
          <span className="text-sm text-gray-600">{zoom}x</span>
          <button
            onClick={handleZoomIn}
            disabled={zoom >= 10}
            className={`p-1 rounded-md ${zoom >= 10 ? 'text-gray-400' : 'text-blue-500 hover:bg-blue-50'}`}
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
      
      {/* Regions List */}
      <RegionsList wavesurfer={wavesurferRef.current} />
    </div>
  );
};

export default AudioWaveform;
