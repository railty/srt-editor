import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAudioStore, useAppStore } from '../../stores';
import RegionsList from './RegionsList';
import { setupAudioKeyboardShortcuts } from '../../utils/keyboardShortcuts';
import { getInvertedColor } from '../../utils/srt/SrtParser';

// Import our new components
import WaveformHeader from './WaveformHeader';
import WaveformDisplay from './WaveformDisplay';
import WaveformControls from './WaveformControls';
import WaveformRegionManager from './WaveformRegionManager';

/**
 * Main AudioWaveform component that coordinates the audio waveform visualization and interaction
 */
const AudioWaveform = ({ audioURL }) => {
  // Refs to store instances
  const waveformRef = useRef(null);
  const wavesurferRef = useRef(null);
  const regionsPluginRef = useRef(null);
  
  // Component state
  const [isLoading, setIsLoading] = useState(true);
  
  // Get state from stores
  const { zoom, setZoom, addRegion } = useAudioStore();
  const { subtitleFile } = useAppStore();
  
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
  
  // Setup keyboard shortcuts
  useEffect(() => {
    if (wavesurferRef.current) {
      const cleanup = setupAudioKeyboardShortcuts(wavesurferRef.current, setZoom, zoom);
      return cleanup;
    }
  }, [zoom, setZoom]);
  
  // Function to completely refresh all regions
  const refreshAllRegions = useCallback(() => {
    if (!wavesurferRef.current || !regionsPluginRef.current || isLoading) {
      return;
    }

    try {
      // Get all regions from the store
      const { regions } = useAudioStore.getState();
      if (!regions || regions.length === 0) return;

      // First, clear all existing regions from the wavesurfer instance
      regionsPluginRef.current.clearRegions();

      // Then recreate all regions from our store data
      regions.forEach((regionData) => {
        try {
          // Calculate speaker positioning
          const speakerIdx = regionData.speaker % 2; // Ensure we only use 0 or 1
          
          // Create the region with all properties
          const region = regionsPluginRef.current.addRegion({
            id: regionData.id,
            start: regionData.start,
            end: regionData.end,
            color: regionData.color,
            drag: false, // Disable dragging the region's center
            resize: false, // Initially disable resize
            // Custom options for positioning
            customAttributes: {
              speaker: regionData.speaker,
              fromSRT: true
            }
          });
          
          // Properly style the region after creation
          if (region && region.element) {
            // Add the label
            region.element.setAttribute('data-label', regionData.label);
            
            // Apply CSS positioning
            const top = speakerIdx === 0 ? 0 : 50;
            const height = 50; // 50% of the height
            region.element.style.top = `${top}%`;
            region.element.style.height = `${height}%`;
            
            // Add speaker class for styling
            region.element.classList.add(`speaker-${speakerIdx}`);
            
            // If this is the selected region, add selection styling
            const { selectedRegionId } = useAudioStore.getState();
            if (region.id === selectedRegionId) {
              region.element.classList.add('region-selected');
              region.setOptions({ resize: true });
            }
          }
        } catch (error) {
          console.error('Error recreating region:', error);
        }
      });

      // Force a redraw of the waveform
      if (wavesurferRef.current && wavesurferRef.current.drawer) {
        wavesurferRef.current.drawer.drawBuffer();
      }
      
    } catch (error) {
      console.error('Error refreshing regions:', error);
    }
  }, [isLoading]);

  // Update zoom when it changes
  useEffect(() => {
    if (wavesurferRef.current && !isLoading && wavesurferRef.current.getDecodedData) {
      try {
        // Only set zoom if audio is actually loaded
        if (wavesurferRef.current.getDecodedData()) {
          // Apply the zoom
          wavesurferRef.current.zoom(zoom * 50);
          
          // After zoom operation finishes, do a complete region refresh with a delay
          setTimeout(() => {
            refreshAllRegions();
            
            // After regions are refreshed, make sure we're at the right scroll position
            setTimeout(() => {
              if (wavesurferRef.current) {
                // Force a seek to the current time to update the view
                const currentTime = wavesurferRef.current.getCurrentTime();
                wavesurferRef.current.seekTo(currentTime / wavesurferRef.current.getDuration());
              }
            }, 50);
          }, 100);
        }
      } catch (error) {
        console.warn('Error setting zoom:', error);
      }
    }
  }, [zoom, isLoading, refreshAllRegions]);
  
  // Monitor subtitleFile changes and reload regions if needed
  useEffect(() => {
    // If we have a subtitle file but no regions in the store, trigger an import
    if (subtitleFile && subtitleFile.textContent) {
      const { regions } = useAudioStore.getState();
      if (!regions || regions.length === 0) {
        console.log("SRT file detected but no regions - automatically importing regions");
        const { importSrt } = useAudioStore.getState();
        importSrt(subtitleFile.textContent);
      }
    }
  }, [subtitleFile]);

  // Listen for changes to the regions in the store
  useEffect(() => {
    // Use the store's subscribe method to listen for changes
    const unsubscribe = useAudioStore.subscribe(
      (state) => state.regions,
      (regions) => {
        console.log("AudioWaveform - regions updated from store:", regions.length);
        
        // If we have regions in the store but none in the wavesurfer, recreate them
        if (regions.length > 0 && regionsPluginRef.current && !isLoading) {
          try {
            const wavesurferRegions = regionsPluginRef.current.getRegions();
            if (wavesurferRegions.length === 0) {
              console.log("Regions in store but not in wavesurfer - refreshing");
              refreshAllRegions();
            } else {
              // Verify that wavesurfer regions and store regions are in sync
              const storeMap = new Map(regions.map(r => [r.id, r]));
              const wsMap = new Map(wavesurferRegions.map(r => [r.id, r]));
              
              // Log any mismatches for debugging
              let mismatchFound = false;
              regions.forEach(storeRegion => {
                const wsRegion = wsMap.get(storeRegion.id);
                if (wsRegion) {
                  // Check if start/end times match
                  if (Math.abs(storeRegion.start - wsRegion.start) > 0.001 || 
                      Math.abs(storeRegion.end - wsRegion.end) > 0.001) {
                    console.warn(`Region ${storeRegion.id} mismatch - ` +
                      `Store: [${storeRegion.start}, ${storeRegion.end}], ` + 
                      `WaveSurfer: [${wsRegion.start}, ${wsRegion.end}]`);
                    mismatchFound = true;
                  }
                }
              });
              
              // If mismatches were found, refresh all regions to ensure consistency
              if (mismatchFound) {
                console.log("Mismatches found between store and wavesurfer - refreshing all regions");
                refreshAllRegions();
              }
            }
          } catch (error) {
            console.error("Error checking wavesurfer regions:", error);
          }
        }
      }
    );
    
    // Clean up subscription on unmount
    return () => unsubscribe();
  }, [refreshAllRegions, isLoading]);

  // Function to create regions from SRT file with speaker detection
  const createRegionsFromSRT = useCallback(() => {
    if (!subtitleFile || !subtitleFile.textContent || !wavesurferRef.current || !regionsPluginRef.current) {
      console.log("Cannot create regions - missing required data", {
        hasSubtitleFile: !!subtitleFile,
        hasTextContent: !!(subtitleFile && subtitleFile.textContent),
        hasWavesurfer: !!wavesurferRef.current,
        hasRegionsPlugin: !!regionsPluginRef.current
      });
      return;
    }
    
    console.log("Creating regions from persisted state or SRT file");
    
    // Get the current persisted regions from the store
    const { regions, importSrt } = useAudioStore.getState();
    console.log("Current regions in store:", regions.length);
    
    // If we have persisted regions, use those instead of re-parsing the SRT file
    const regionDataList = regions.length > 0 
      ? regions // Use persisted regions that might contain user edits
      : importSrt(subtitleFile.textContent); // Only import SRT if no persisted regions exist
      
    console.log("Regions data list to create:", regionDataList.length);
    
    // Create WaveSurfer regions from the data
    regionDataList.forEach((regionData) => {
      try {
        // Calculate vertical position based on speaker
        const speakerIdx = regionData.speaker % 2; // Ensure we only use 0 or 1
        
        // Calculate position values
        const top = speakerIdx === 0 ? 0 : 50;
        const height = 50; // 50% of the height
        
        // Create the region with custom positioning
        const region = regionsPluginRef.current.addRegion({
          id: regionData.id,
          start: regionData.start,
          end: regionData.end,
          color: regionData.color,
          drag: false, // Disable dragging the region's center
          resize: false, // Disable resize by default - will be enabled for selected region via CSS
          // Custom options for positioning
          customAttributes: {
            speaker: regionData.speaker,
            fromSRT: true // Mark this region as created from SRT to avoid duplication
          }
        });
        
        // Manually set the region's position after it's created
        if (region && region.element) {
          // Add the label as a data attribute
          region.element.setAttribute('data-label', regionData.label);
          
          // Apply CSS to position the region vertically
          region.element.style.top = `${top}%`;
          region.element.style.height = `${height}%`;
          
          // Add speaker class for styling
          region.element.classList.add(`speaker-${speakerIdx}`);
        }
        
        // Add the region to our Zustand store
        const regionToAdd = {
          id: region.id,
          start: regionData.start,
          end: regionData.end,
          color: regionData.color,
          label: regionData.label,
          speaker: regionData.speaker,
          text: regionData.text,
          displayText: regionData.displayText
        };
        //console.log("Adding region to store from SRT:", regionToAdd.id, regionToAdd.label);
        addRegion(regionToAdd);
        
        // Verify the region was added
        setTimeout(() => {
          const { regions } = useAudioStore.getState();
          //console.log("Current regions after add:", regions.length);
        }, 100);
      } catch (error) {
        console.error('Error creating region from SRT:', error);
      }
    });
  }, [subtitleFile, addRegion]);
  
  // Handle region creation from SRT file when wavesurfer is ready
  const handleRegionsReady = useCallback(() => {
    // Call our create regions function directly
    if (regionsPluginRef.current && wavesurferRef.current) {
      setTimeout(() => {
        // First check if regions exist in the store
        const { regions } = useAudioStore.getState();
        // If regions array is empty but we have an SRT file, force a re-import
        if ((!regions || regions.length === 0) && subtitleFile && subtitleFile.textContent) {
          console.log("No regions found in store but we have SRT data - force importing");
          // Ensure any stale regions are cleared first
          regionsPluginRef.current.clearRegions();
          // Clear the store regions too
          useAudioStore.getState().clearRegions();
          // Try to import the SRT data again
          createRegionsFromSRT();
        } else {
          // Normal flow - create regions from persisted state or SRT file
          createRegionsFromSRT();
        }
      }, 100); // Small delay to ensure WaveSurfer is fully initialized
    }
  }, [createRegionsFromSRT, subtitleFile]);

  return (
    <div className="mt-4 bg-white p-4 rounded-md shadow-sm">
      {/* Header with title and keyboard shortcuts */}
      <WaveformHeader />
      
      {/* Waveform Display */}
      <WaveformDisplay 
        audioURL={audioURL} 
        setIsLoading={setIsLoading} 
        isLoading={isLoading}
        wavesurferRef={wavesurferRef}
        regionsPluginRef={regionsPluginRef}
        waveformRef={waveformRef}
        onRegionsReady={handleRegionsReady}
      />
      
      {/* Non-visual component to manage regions */}
      <WaveformRegionManager 
        wavesurferRef={wavesurferRef}
        regionsPluginRef={regionsPluginRef}
        isLoading={isLoading}
      />
      
      {/* Playback Controls */}
      <WaveformControls 
        wavesurfer={wavesurferRef.current}
        isLoading={isLoading}
      />
      
      {/* Regions List */}
      <RegionsList 
        wavesurfer={wavesurferRef.current} 
      />
    </div>
  );
};

export default AudioWaveform;