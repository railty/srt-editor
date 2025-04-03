import { create } from 'zustand';

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
  addRegion: (region) => set((state) => ({ 
    regions: [...state.regions, region] 
  })),
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
}));

export default useAudioStore;
