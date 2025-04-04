import React, { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline';
import useAudioStore from '../../stores/useAudioStore';
import { formatTime } from '../../utils/srt/SrtParser';

/**
 * Component that renders the waveform visualization
 */
const WaveformDisplay = ({ 
  audioURL, 
  setIsLoading, 
  isLoading, 
  wavesurferRef, 
  regionsPluginRef,
  waveformRef, 
  onRegionsReady 
}) => {
  // Get state and actions from store
  const {
    setDuration,
    setIsPlaying,
    setCurrentTime,
    selectedRegionId,
  } = useAudioStore();

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
  }, [selectedRegionId, isLoading, regionsPluginRef]);

  // Initialize WaveSurfer when component mounts
  useEffect(() => {
    let wavesurfer = null;
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
              box-shadow: 0 0 0 3px yellow !important;
              border: 2px solid #ff0000 !important;
              z-index: 10 !important;
            }
            /* Disable dragging the region center */
            .wavesurfer-region > .resize-center {
              pointer-events: none !important;
            }
            /* Disable resize handles for non-selected regions */
            .wavesurfer-region > .resize-w,
            .wavesurfer-region > .resize-e {
              pointer-events: none !important;
            }
            /* Only enable resize handles for selected regions */
            .wavesurfer-region.region-selected > .resize-w,
            .wavesurfer-region.region-selected > .resize-e {
              pointer-events: auto !important;
              background-color: rgba(255, 255, 0, 0.8) !important;
              width: 6px !important;
              cursor: col-resize !important;
            }
          `;
          document.head.appendChild(style);
          
          // Create the regions plugin first
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
            
            // Call the callback when wavesurfer is ready
            if (typeof onRegionsReady === 'function') {
              console.log("WaveformDisplay ready - calling onRegionsReady callback");
              onRegionsReady();
              
              // Double-check after a delay that regions are loaded
              // This helps with race conditions
              setTimeout(() => {
                try {
                  const { regions } = useAudioStore.getState();
                  const regionsInWave = regionsPlugin.getRegions().length;
                  console.log(`After ready check: Store regions: ${regions.length}, Wavesurfer regions: ${regionsInWave}`);
                  
                  // If we have regions in store but none in wavesurfer, call onRegionsReady again
                  if (regions.length > 0 && regionsInWave === 0) {
                    console.log("Auto-fixing regions after wavesurfer ready");
                    onRegionsReady();
                  }
                } catch (error) {
                  console.error("Error in post-ready regions check:", error);
                }
              }, 500);
            }
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
      } else {
        // No audio URL, set loading to false
        setIsLoading(false);
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
  }, [audioURL, setDuration, setIsPlaying, setCurrentTime, onRegionsReady, setIsLoading]);

  return (
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
      
      <div id="timeline" className="w-full h-10"></div>
    </div>
  );
};

export default WaveformDisplay;