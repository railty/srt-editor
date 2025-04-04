import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAudioStore, useAppStore } from '../../stores';
import RegionsList from './RegionsList';
import { setupAudioKeyboardShortcuts } from '../../utils/keyboardShortcuts';
import { parseSRTWithSpeakers, createRegionLabel, getSpeakerColor } from '../../utils/srt/SrtParser';

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
    
    console.log("Creating regions from SRT file");
    
    const regions = parseSRTWithSpeakers(subtitleFile.textContent);
    let regionCounter = 0;
    
    // Add each subtitle as a region
    regions.forEach((subtitle) => {
      try {
        regionCounter++;
        
        // Create a region label
        const regionLabel = createRegionLabel(regionCounter, subtitle.displayText);
        
        // Get a color based on the speaker
        const color = getSpeakerColor(subtitle.speaker);
        
        // Calculate vertical position based on speaker
        // Speaker 0 on top half, Speaker 1 on bottom half
        let top, height;
        
        const speakerIdx = subtitle.speaker % 2; // Ensure we only use 0 or 1
        
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