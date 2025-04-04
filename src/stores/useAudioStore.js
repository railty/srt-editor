import { create } from 'zustand';
import { parseSRTWithSpeakers, createRegionLabel, getSpeakerColor } from '../utils/srt/SrtParser';

const useAudioStore = create((set) => ({
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
    // Check if a region with this ID already exists
    const exists = state.regions.some(r => r.id === region.id);
    if (exists) {
      // Region already exists, don't add it again
      return { regions: state.regions };
    }
    // Add the new region
    return { regions: [...state.regions, region] };
  }),
  updateRegion: (id, updatedRegion) => set((state) => ({
    regions: state.regions.map((region) => 
      region.id === id ? { ...region, ...updatedRegion } : region
    )
  })),
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
    if (!srtContent) return [];
    
    const regions = [];
    const subtitles = parseSRTWithSpeakers(srtContent);
    let regionCounter = 0;
    
    // Convert each subtitle to a region data object
    subtitles.forEach((subtitle) => {
      regionCounter++;
      
      // Create a region label
      const regionLabel = createRegionLabel(regionCounter, subtitle.displayText);
      
      // Get a color based on the speaker
      const color = getSpeakerColor(subtitle.speaker);
      
      // Add the region data
      regions.push({
        id: `srt-region-${regionCounter}`,
        start: subtitle.startTime,
        end: subtitle.endTime,
        color: color,
        label: regionLabel,
        speaker: subtitle.speaker,
        text: subtitle.text,
        displayText: subtitle.displayText,
        fromSRT: true
      });
    });
    
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
}));

export default useAudioStore;
