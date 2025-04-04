# SRT Editor - API Reference

This document provides a reference for the key APIs, components, and utilities in the SRT Editor application.

## State Management (Zustand Stores)

### App Store (`useAppStore.js`)

The main application store for managing application state.

#### State

| Property | Type | Description |
|----------|------|-------------|
| `currentPage` | String | Current active page ('home', 'upload', 'about', 'settings') |
| `status` | String | Application status message |
| `audioFile` | Object | Metadata and content of the uploaded audio file |
| `subtitleFile` | Object | Metadata and content of the uploaded subtitle file |

#### Actions

| Method | Parameters | Description |
|--------|------------|-------------|
| `setCurrentPage` | `page: String` | Set the current active page |
| `setStatus` | `status: String` | Update the application status message |
| `setFiles` | `audioFile: File, subtitleFile: File` | Process and store uploaded files |
| `clearFiles` | None | Clear stored files |

### Audio Store (`audioStore.js`)

Manages audio playback and waveform visualization state.

#### State

| Property | Type | Description |
|----------|------|-------------|
| `isPlaying` | Boolean | Whether audio is currently playing |
| `currentTime` | Number | Current playback position in seconds |
| `duration` | Number | Total duration of the audio in seconds |
| `zoom` | Number | Zoom level for the waveform (1.0 = 100%) |
| `regions` | Array | List of regions (subtitles) on the waveform |
| `selectedRegionId` | String | ID of the currently selected region |

#### Actions

| Method | Parameters | Description |
|--------|------------|-------------|
| `setIsPlaying` | `isPlaying: Boolean` | Set the playback state |
| `setCurrentTime` | `currentTime: Number` | Set the current playback position |
| `setDuration` | `duration: Number` | Set the total audio duration |
| `setZoom` | `zoom: Number` | Set the waveform zoom level |
| `addRegion` | `region: Object` | Add a new region to the waveform |
| `updateRegion` | `id: String, updatedRegion: Object` | Update an existing region |
| `removeRegion` | `id: String` | Remove a region |
| `clearRegions` | None | Clear all regions |
| `selectRegion` | `id: String` | Select a region by ID |

## Components

### AudioWaveform Components

#### `AudioWaveform.jsx`

Main container component for the audio waveform visualization.

| Prop | Type | Description |
|------|------|-------------|
| `audioURL` | String | URL to the audio file |

#### `WaveformDisplay.jsx`

Renders the waveform visualization using WaveSurfer.js.

| Prop | Type | Description |
|------|------|-------------|
| `audioURL` | String | URL to the audio file |
| `setIsLoading` | Function | Function to update loading state |
| `isLoading` | Boolean | Whether the waveform is loading |
| `wavesurferRef` | Object | Ref to the WaveSurfer instance |
| `regionsPluginRef` | Object | Ref to the RegionsPlugin instance |
| `waveformRef` | Object | Ref to the waveform DOM element |
| `onRegionsReady` | Function | Callback when regions plugin is ready |

#### `WaveformControls.jsx`

Provides playback controls for the audio.

| Prop | Type | Description |
|------|------|-------------|
| `wavesurfer` | Object | WaveSurfer instance |
| `isLoading` | Boolean | Whether the waveform is loading |

#### `RegionsList.jsx`

Displays a list of regions with editing controls.

| Prop | Type | Description |
|------|------|-------------|
| `wavesurfer` | Object | WaveSurfer instance |

### File Display Components

#### `AudioFileDisplay.jsx`

Displays information about the uploaded audio file.

| Prop | Type | Description |
|------|------|-------------|
| `file` | Object | Audio file metadata |

#### `SubtitleFileDisplay.jsx`

Displays information about the uploaded subtitle file.

| Prop | Type | Description |
|------|------|-------------|
| `file` | Object | Subtitle file metadata |

### Page Components

#### `Home.jsx`

Home page component with file display and editing options.

#### `Upload.jsx`

File upload interface component.

#### `About.jsx`

Information about the application.

#### `Settings.jsx`

Application settings component.

## Utility Functions

### SRT Parser Utilities (`utils/srt/SrtParser.js`)

#### Time Conversion

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `timeToSeconds` | `timeStr: String` | Number | Converts SRT time format (HH:MM:SS,mmm) to seconds |
| `formatTime` | `time: Number` | String | Formats seconds to MM:SS format |
| `formatTimeWithMs` | `time: Number` | String | Formats seconds to MM:SS.mmm format |

#### SRT Parsing

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `parseSRTWithSpeakers` | `srtContent: String` | Array | Parses SRT content and detects speakers |
| `createRegionLabel` | `index: Number, text: String` | String | Creates a label for a region based on subtitle text |
| `getSpeakerBadgeColor` | `speaker: Number` | String | Gets Tailwind CSS classes for a speaker badge |
| `getSpeakerColor` | `speaker: Number` | String | Gets an RGBA color for a region based on speaker |
| `getInvertedColor` | `rgbaColor: String` | String | Gets an inverted color for contrast |

### Keyboard Shortcuts (`utils/keyboardShortcuts.js`)

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `setupAudioKeyboardShortcuts` | `wavesurfer: Object, setZoom: Function, zoom: Number` | Function | Sets up keyboard shortcuts for audio playback and returns cleanup function |

## IndexedDB Storage Adapter

Custom storage adapter for Zustand that persists data in IndexedDB with localStorage fallback.

### Factory Function

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `createIndexedDBStorage` | `storeName: String` | Object | Creates a storage adapter for Zustand's persist middleware |

### Storage Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getItem` | `key: String` | Promise<Any> | Gets an item from storage with fallback to localStorage |
| `setItem` | `key: String, value: Any` | Promise<void> | Sets an item in storage with fallback to localStorage |
| `removeItem` | `key: String` | Promise<void> | Removes an item from storage with fallback to localStorage |

### Usage Example

```javascript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createIndexedDBStorage } from '../utils/indexedDBStorage';

// Create the storage adapter
const storage = createIndexedDBStorage('my-store');

// Use it with Zustand's persist middleware
const useStore = create(
  persist(
    (set) => ({ /* store state and actions */ }),
    {
      name: 'store-name',
      storage: storage,
      partialize: (state) => ({ /* persisted state */ }),
    }
  )
);
```

## WaveSurfer.js Integration

The application uses WaveSurfer.js for audio visualization and manipulation.

### Key WaveSurfer Methods Used

| Method | Description |
|--------|-------------|
| `create` | Creates a new WaveSurfer instance |
| `load` | Loads an audio file |
| `play` | Starts audio playback |
| `pause` | Pauses audio playback |
| `stop` | Stops audio playback |
| `skip` | Skips to a specific time |
| `zoom` | Sets the zoom level |
| `getCurrentTime` | Gets the current playback position |
| `getDuration` | Gets the total audio duration |
| `destroy` | Destroys the WaveSurfer instance |

### RegionsPlugin Methods Used

| Method | Description |
|--------|-------------|
| `create` | Creates a new RegionsPlugin instance |
| `addRegion` | Adds a region to the waveform |
| `getRegions` | Gets all regions |
| `clearRegions` | Clears all regions |
