# SRT Editor - Architecture

## Project Structure

The SRT Editor follows a modular architecture with the following structure:

```
srt-editor/
├── src/
│   ├── assets/          # Static assets
│   ├── components/      # Reusable UI components
│   │   ├── AudioWaveform/   # Audio visualization components
│   │   ├── FileDisplay/     # File display components
│   │   └── Layout.jsx       # Main layout component
│   ├── pages/           # Page components
│   │   ├── About.jsx        # About page
│   │   ├── Home.jsx         # Home page
│   │   ├── Settings.jsx     # Settings page
│   │   └── Upload.jsx       # File upload page
│   ├── stores/          # Zustand state management
│   │   ├── audioStore.js    # Audio playback and regions state
│   │   ├── index.js         # Store exports
│   │   └── useAppStore.js   # Main application state
│   ├── utils/           # Utility functions
│   │   ├── keyboardShortcuts.js  # Keyboard shortcuts
│   │   └── srt/              # SRT file utilities
│   │       └── SrtParser.js      # SRT parsing functions
│   ├── App.jsx          # Main application component
│   ├── App.css          # Application styles
│   ├── index.css        # Global styles
│   └── main.jsx         # Application entry point
├── public/          # Public assets
├── dist/            # Build output
├── docs/            # Project documentation
└── node_modules/    # Dependencies
```

## State Management

The application uses Zustand for state management, split into multiple stores:

### App Store (`useAppStore.js`)

The main application store handles:
- Navigation state (current page)
- Application status
- File management (uploaded audio and subtitle files)
- Persistent storage using IndexedDB with localStorage fallback

### Audio Store (`audioStore.js`)

Manages the audio playback and waveform visualization state:
- Playback state (playing/paused)
- Current time and duration
- Zoom level for the waveform
- Regions (visual representations of subtitles on the waveform)
- Region selection

## Component Architecture

### AudioWaveform Components

The audio waveform visualization is split into several subcomponents:

- `AudioWaveform.jsx`: Main container component
- `WaveformDisplay.jsx`: Renders the waveform visualization
- `WaveformControls.jsx`: Playback controls
- `WaveformHeader.jsx`: Header with title and information
- `WaveformRegionManager.jsx`: Manages the regions (subtitles)
- `RegionsList.jsx`: List of regions with editing controls

### File Display Components

Components for displaying uploaded files:
- `AudioFileDisplay.jsx`: Displays audio file information
- `SubtitleFileDisplay.jsx`: Displays subtitle file information

### Page Components

- `Home.jsx`: Home page with file display and editing options
- `Upload.jsx`: File upload interface
- `About.jsx`: Information about the application
- `Settings.jsx`: Application settings

## Data Flow

1. Users upload audio and subtitle files via the Upload page
2. Files are processed and stored in the App Store
3. WaveSurfer.js visualizes the audio file as a waveform
4. The SRT parser processes the subtitle file and extracts subtitle information
5. Subtitles are displayed as regions on the waveform
6. Users can interact with the regions to edit subtitles (planned feature)

## Persistence Strategy

The application uses a robust persistence strategy with:

1. **IndexedDB as the primary storage mechanism**
   - Each store (app store and audio store) uses its own database
   - The databases use a consistent naming convention: `srt-editor-new-{store-name}`
   - Each database contains a single object store named 'data'
   - This separate database approach prevents schema conflicts

2. **localStorage as a fallback** if IndexedDB fails
   - Data is still persisted even if IndexedDB is unavailable
   - Fallback keys use a consistent naming convention

3. **Custom storage adapter for Zustand's persist middleware**
   - Implements the required getItem, setItem, and removeItem methods
   - Handles errors gracefully with proper fallbacks
   - Ensures database connections are properly closed after operations
   
This ensures that user data (uploaded files and application state) is retained between sessions and provides resilience against browser storage issues.
