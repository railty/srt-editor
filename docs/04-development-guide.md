# SRT Editor - Development Guide

This guide provides information for developers who want to contribute to or extend the SRT Editor application.

## Project Setup

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd srt-editor
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open your browser to `http://localhost:5173`

## Project Structure and Organization

The project follows a structured approach to organizing code:

- **Components**: Reusable UI components
- **Pages**: Full-page components
- **Stores**: State management with Zustand
- **Utils**: Utility functions and helpers

### Adding New Components

1. Create a new component file in the appropriate directory
2. Keep components focused on a single responsibility
3. Use the existing component patterns for consistency

### State Management

The application uses Zustand for state management with persistent storage:

1. **App Store (`useAppStore.js`)**
   - Handles application state (current page, status)
   - Stores uploaded files (audio, subtitle)
   - Uses IndexedDB persistence with the store name 'app-store'

2. **Audio Store (`useAudioStore.js`)**
   - Manages audio playback state and waveform
   - Stores subtitle regions data
   - Provides SRT import/export functionality
   - Uses IndexedDB persistence with the store name 'audio-store'

3. **Persistence Layer**
   - Implemented in `utils/indexedDBStorage.js`
   - Creates a custom storage adapter for Zustand's persist middleware
   - Uses separate IndexedDB databases for each store to prevent conflicts
   - Provides localStorage fallback for robustness

## Working with Audio and SRT Files

### Audio File Handling

The application uses WaveSurfer.js for audio visualization:

1. Audio files are loaded via the `WaveformDisplay` component
2. Audio state is managed in the `audioStore.js` Zustand store
3. Playback controls are implemented in `WaveformControls`

### SRT File Parsing

The SRT parser is implemented in `utils/srt/SrtParser.js`:

1. To modify the parsing logic, update the `parseSRTWithSpeakers` function
2. To add support for new subtitle formats, create additional parser functions
3. Time conversion utilities are available for converting between formats

## Implementing SRT Editing

The SRT editing functionality is the next major feature to be implemented:

### Region Interaction

To implement subtitle editing through region interaction:

1. Enhance the `WaveformRegionManager` component to handle region updates
2. Update the region selection logic to support editing
3. Implement the region modification logic in the audio store

### Text Editing

To implement subtitle text editing:

1. Create a new component for editing the text of selected subtitles
2. Implement the text update logic in the store
3. Connect the text editor to the selected region

### Speaker Assignment

To implement speaker assignment:

1. Create a UI for selecting speakers
2. Update the region styling based on speaker changes
3. Store speaker information in the state

### File Export

To implement SRT file export:

1. Create a function to convert the regions/subtitles to SRT format
2. Add a UI component for triggering the export
3. Implement the file download functionality

## Best Practices

### Performance Optimization

1. Use React's memoization techniques (`React.memo`, `useMemo`, `useCallback`)
2. Optimize renders by avoiding unnecessary state updates
3. Use appropriate key props for lists to minimize re-renders

### Error Handling

1. Implement error boundaries for component errors
2. Add try/catch blocks for async operations
3. Provide meaningful error messages to users

### Accessibility

1. Ensure all interactive elements have appropriate ARIA attributes
2. Provide keyboard navigation support
3. Maintain sufficient color contrast for text elements

### Testing

To implement tests:

1. Add unit tests for utility functions, especially the SRT parser
2. Add component tests for key functionality
3. Add integration tests for the core user flows

## Deployment

The application is built with Vite, which provides an optimized build:

```bash
npm run build
# or
yarn build
```

The output in the `/dist` directory can be deployed to any static web hosting service.
