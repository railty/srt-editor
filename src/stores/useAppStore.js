import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createIndexedDBStorage } from '../utils/indexedDBStorage';

// Create IndexedDB storage for app store (separate database approach)
const indexedDBStorage = createIndexedDBStorage('app-store');

// Use the imported createIndexedDBStorage utility directly

const useAppStore = create(
  persist(
    (set) => ({
      // UI state
      currentPage: 'home',
      status: 'Ready',
      
      // File state
      audioFile: null, // Will store file metadata, not the full File object
      subtitleFile: null, // Will store file metadata, not the full File object
      
      // Actions
      setCurrentPage: (page) => set({ currentPage: page }),
      setStatus: (status) => set({ status }),
      
      // File actions
      setFiles: async (audioFile, subtitleFile) => {
        // Create file metadata and extract content as Uint8Array
        let audioFileData = null;
        let subtitleFileData = null;
        
        if (audioFile) {
          const audioBuffer = await audioFile.arrayBuffer();
          const audioContent = new Uint8Array(audioBuffer);
          
          audioFileData = {
            name: audioFile.name,
            size: audioFile.size,
            type: audioFile.type,
            lastModified: audioFile.lastModified,
            content: Array.from(audioContent) // Convert to regular array for JSON serialization
          };
        }
        
        if (subtitleFile) {
          // For SRT files, we can just read them as text
          const text = await subtitleFile.text(); // More efficient for text files
          
          subtitleFileData = {
            name: subtitleFile.name,
            size: subtitleFile.size,
            type: subtitleFile.type,
            lastModified: subtitleFile.lastModified,
            textContent: text // Store as string instead of binary
          };
        }
        
        set({
          audioFile: audioFileData,
          subtitleFile: subtitleFileData
        });
      },
      
      clearFiles: () => set({
        audioFile: null,
        subtitleFile: null
      })
    }),
    {
      name: 'srt-editor-storage', // unique name for the storage key
      storage: indexedDBStorage,
      partialize: (state) => ({
        // Only persist these states
        audioFile: state.audioFile,
        subtitleFile: state.subtitleFile
      }),
    }
  )
);

export default useAppStore;