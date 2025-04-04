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

  // Function to create regions from SRT file with speaker detection
  const createRegionsFromSRT = useCallback(() => {
    if (!subtitleFile || !subtitleFile.textContent || !wavesurferRef.current || !regionsPluginRef.current) {
      return;
    }
    
    console.log("Creating regions from persisted state or SRT file");
    
    // Get the current persisted regions from the store
    const { regions, importSrt } = useAudioStore.getState();
    
    // If we have persisted regions, use those instead of re-parsing the SRT file
    const regionDataList = regions.length > 0 
      ? regions // Use persisted regions that might contain user edits
      : importSrt(subtitleFile.textContent); // Only import SRT if no persisted regions exist
    
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
        addRegion({
          id: region.id,
          start: regionData.start,
          end: regionData.end,
          color: regionData.color,
          label: regionData.label,
          speaker: regionData.speaker,
          text: regionData.text,
          displayText: regionData.displayText
        });
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
        createRegionsFromSRT();
      }, 100); // Small delay to ensure WaveSurfer is fully initialized
    }
  }, [createRegionsFromSRT]);

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