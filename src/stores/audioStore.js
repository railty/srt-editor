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
}));

export default useAudioStore;
