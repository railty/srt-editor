# SRT Editor - Implementation Details

## File Handling and Storage

### File Upload

The application allows users to upload audio (.m4a) and subtitle (.srt) files through:
- Drag and drop interface
- File browser dialog

Both methods are implemented in the `Upload.jsx` component, which processes the files and stores them using the application's state management.

### File Storage

Files are stored efficiently in the application state:

- **Audio Files**: Converted to `Uint8Array` and stored as regular arrays for JSON serialization
- **Subtitle Files**: Stored as text content for efficient processing

The files are persisted using IndexedDB with a localStorage fallback mechanism:

```javascript
// From useAppStore.js
const useAppStore = create(
  persist(
    (set) => ({
      // Store state
    }),
    {
      name: 'srt-editor-storage',
      storage: createJSONStorage(() => createFallbackStorage()),
      partialize: (state) => ({
        audioFile: state.audioFile,
        subtitleFile: state.subtitleFile
      }),
    }
  )
);
```

## Audio Visualization

### WaveSurfer.js Integration

The application uses WaveSurfer.js for audio visualization and playback:

```javascript
// From WaveformDisplay.jsx
wavesurfer = WaveSurfer.create({
  container: waveformRef.current,
  waveColor: '#4a83ff',
  progressColor: '#1a56db',
  cursorColor: '#f87171',
  barWidth: 2,
  barRadius: 3,
  cursorWidth: 1,
  height: 100,
  barGap: 2,
  responsive: true,
  normalize: true,
  plugins: [
    TimelinePlugin.create({
      // Timeline configuration
    }),
    regionsPlugin
  ],
});
```

### Regions Plugin

The RegionsPlugin is used to visualize subtitles on the waveform:

- Each subtitle is represented as a region on the waveform
- Regions are positioned based on speaker (top half or bottom half)
- Regions are color-coded by speaker
- Region styling is applied via CSS

## SRT File Parsing

### Subtitle Parsing

The SRT parsing logic is implemented in `SrtParser.js`, which:

1. Parses the SRT file content
2. Extracts subtitle timings, text, and speaker information
3. Converts SRT time format to seconds for use with the waveform

### Speaker Detection

The application automatically detects speakers in the SRT file using pattern matching:

```javascript
// From SrtParser.js
export const parseSRTWithSpeakers = (srtContent) => {
  // Pattern detection for different speaker formats:
  // - "Speaker X:"
  // - "[Speaker X]"
  // - Simply the number at the beginning
  
  // Extract speaker information and text
  // ...
}
```

Speakers are color-coded with a predefined color palette:

```javascript
const speakerColors = {
  0: [
    'rgba(255, 99, 132, 0.5)',  // red
    'rgba(255, 159, 64, 0.5)',  // orange
    'rgba(255, 206, 86, 0.5)',  // yellow
    'rgba(75, 192, 192, 0.5)',  // teal
  ],
  1: [
    'rgba(54, 162, 235, 0.5)',  // blue
    'rgba(153, 102, 255, 0.5)', // purple
    'rgba(46, 204, 113, 0.5)',  // green
    'rgba(236, 64, 122, 0.5)',  // pink
  ]
};
```

## React Component Patterns

### Modular Component Design

The application follows a modular component design:

- Large components are broken down into smaller, focused components
- Components have clear responsibilities
- State is lifted to the appropriate level (component state or global state)

### Component Lifecycle Management

The application carefully manages component lifecycles, especially for the WaveSurfer.js integration:

- Resources are properly initialized and cleaned up
- AbortController is used to cancel pending operations
- Error handling and fallbacks are implemented

Example from `WaveformDisplay.jsx`:

```javascript
useEffect(() => {
  let wavesurfer = null;
  let isComponentMounted = true; // Flag to track if component is still mounted
  
  const initWaveSurfer = async () => {
    // Initialization logic
  };

  const cleanup = initWaveSurfer();

  // Clean up on unmount
  return () => {
    isComponentMounted = false;
    
    // Clean up resources
    if (cleanup && typeof cleanup === 'function') {
      cleanup();
    }
    
    // Clean up wavesurfer
    if (wavesurferRef.current) {
      try {
        wavesurferRef.current.destroy();
      } catch (error) {
        // Error handling
      }
    }
  };
}, [/* dependencies */]);
```

## Planned SRT Editing Features

The planned SRT editing functionality will include:

1. Adjusting subtitle timing by dragging region boundaries
2. Editing subtitle text in a text editor
3. Changing speaker assignments
4. Adding and removing subtitles
5. Exporting edited SRT files

These features will be implemented by:

- Enhancing the regions interaction model
- Adding text editing capabilities
- Implementing SRT file generation from the edited data
