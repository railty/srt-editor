import { create } from 'zustand';

const useAppStore = create((set) => ({
  // UI state
  currentPage: 'home',
  status: 'Ready',
  
  // Actions
  setCurrentPage: (page) => set({ currentPage: page }),
  setStatus: (status) => set({ status: status }),
}));

export default useAppStore;
