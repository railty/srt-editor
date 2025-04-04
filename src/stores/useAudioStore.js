import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { parseSRTWithSpeakers, createRegionLabel, getSpeakerColor } from '../utils/srt/SrtParser';
import { createIndexedDBStorage } from '../utils/indexedDBStorage';

// Create IndexedDB storage for audio store (separate database approach)
const audioStorage = createIndexedDBStorage('audio-store');

const useAudioStore = create(
  persist(
    (set, get) => ({
      // Current audio state
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      zoom: 1,
      
      // Regions
      regions: [],
      selectedRegionId: null,
      
      // Actions
      setIsPlaying: (isPlaying) => set({ isPlaying }),
      setCurrentTime: (currentTime) => set({ currentTime }),
      setDuration: (duration) => set({ duration }),
      setZoom: (zoom) => set({ zoom }),
      
      // Region actions
      addRegion: (region) => set((state) => {
        // Debug: Log the region being added
        //console.log("Adding region to store:", region.id, "Current count:", state.regions.length);
        
        // Check if a region with this ID already exists
        const exists = state.regions.some(r => r.id === region.id);
        if (exists) {
          // Region already exists, don't add it again
          //console.log("Region already exists, skipping:", region.id);
          return { regions: state.regions };
        }
        // Add the new region
        console.log("Adding new region:", region.id);
        return { regions: [...state.regions, region] };
      }),
      updateRegion: (id, updatedRegion) => {
        // Update the state and let Zustand handle persistence automatically
        set((state) => ({
          regions: state.regions.map((region) => 
            region.id === id ? { ...region, ...updatedRegion } : region
          )
        }));
        
        // Log the update for debugging
        console.log(`Region ${id} updated:`, updatedRegion);
      },
      removeRegion: (id) => set((state) => ({
        regions: state.regions.filter((region) => region.id !== id),
        // If the deleted region was selected, clear the selection
        selectedRegionId: state.selectedRegionId === id ? null : state.selectedRegionId
      })),
      clearRegions: () => set({ regions: [], selectedRegionId: null }),
      
      // Select a region
      selectRegion: (id) => set({ selectedRegionId: id }),
      
      // SRT import/export functions
      importSrt: (srtContent) => {
        //console.log("importSrt called with content:", srtContent ? `length: ${srtContent.length}` : "No content");
        if (!srtContent) return [];
        
        // Parse the SRT content
        const subtitles = parseSRTWithSpeakers(srtContent);
        console.log("Parsed subtitles count:", subtitles.length);
        
        // If no subtitles were parsed, return an empty array
        if (!subtitles || subtitles.length === 0) {
          console.warn("No subtitles parsed from SRT content");
          return [];
        }
        
        // Convert subtitles to region objects and update the state
        const regions = [];
        let regionCounter = 0;
        
        // Convert each subtitle to a region data object
        subtitles.forEach((subtitle) => {
          regionCounter++;
          
          // Create a region label
          const regionLabel = createRegionLabel(regionCounter, subtitle.displayText);
          
          // Get a color based on the speaker
          const color = getSpeakerColor(subtitle.speaker);
          
          // Create the region data
          const region = {
            id: `srt-region-${regionCounter}`,
            start: subtitle.startTime,
            end: subtitle.endTime,
            color: color,
            label: regionLabel,
            speaker: subtitle.speaker,
            text: subtitle.text,
            displayText: subtitle.displayText,
            fromSRT: true
          };
          
          // Add to local array
          regions.push(region);
        });
        
        // Log results
        console.log(`Created ${regions.length} regions from SRT content`);
        
        // Also update the state directly - this is important!
        // This ensures regions are properly saved even if the caller doesn't use the return value
        if (regions.length > 0) {
          set((state) => ({
            regions: regions // Replace existing regions with the newly parsed ones
          }));
        }
        
        return regions;
      },
      
      exportSrt: (state) => {
        // Sort regions by start time
        const sortedRegions = [...state.regions].sort((a, b) => a.start - b.start);
        
        let srtContent = '';
        let index = 1;
        
        sortedRegions.forEach((region) => {
          // Convert seconds to SRT time format (HH:MM:SS,mmm)
          const formatSrtTime = (timeInSeconds) => {
            const hours = Math.floor(timeInSeconds / 3600);
            const minutes = Math.floor((timeInSeconds % 3600) / 60);
            const seconds = Math.floor(timeInSeconds % 60);
            const milliseconds = Math.floor((timeInSeconds % 1) * 1000);
            
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
          };
          
          const startTime = formatSrtTime(region.start);
          const endTime = formatSrtTime(region.end);
          
          // Determine the text to use
          // If we have the original text, use it, otherwise use displayText
          const text = region.text || region.displayText || '';
          
          // Build the SRT entry
          srtContent += `${index}\n${startTime} --> ${endTime}\n${text}\n\n`;
          
          index++;
        });
        
        return srtContent;
      }
    }),
    {
      name: 'srt-editor-audio-storage', // unique name for the storage key
      storage: audioStorage,
      partialize: (state) => {
        //console.log("Persisting audio store state - regions count:", state.regions.length);
        
        // Add debugging for the first few regions
        if (state.regions.length > 0) {
          //console.log("Sample region data being persisted:", state.regions.slice(0, Math.min(3, state.regions.length)).map(r => ({ id: r.id, start: r.start, end: r.end })));
        }
        
        return {
          // Only persist these states
          regions: state.regions,
          selectedRegionId: state.selectedRegionId
        };
      },
      onRehydrateStorage: (state) => {
        return (newState, error) => {
          if (error) {
            console.error('Error rehydrating audio store:', error);
          } else {
            console.log('Audio store successfully rehydrated, regions count:', 
              newState?.regions?.length || 0);
            
            // Log sample of rehydrated regions for debugging
            if (newState?.regions?.length > 0) {
              console.log("Sample rehydrated region data:", 
                newState.regions.slice(0, Math.min(3, newState.regions.length))
                  .map(r => ({ id: r.id, start: r.start, end: r.end }))
              );
            }
          }
        };
      },
    }
  )
);

export default useAudioStore;
