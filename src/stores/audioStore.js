import { create } from 'zustand';

const useAudioStore = create((set) => ({
  // Current audio state
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  zoom: 1,
  
  // Regions
  regions: [],
  
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
    regions: state.regions.filter((region) => region.id !== id)
  })),
  clearRegions: () => set({ regions: [] }),
}));

export default useAudioStore;
