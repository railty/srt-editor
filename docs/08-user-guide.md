# SRT Editor - User Guide

Welcome to the SRT Editor application! This guide will help you get started with uploading, viewing, and editing subtitle files alongside their corresponding audio.

## Getting Started

### Navigating the Application

The SRT Editor has a simple navigation structure:

- **Home**: The main page showing your uploaded files and editing interface
- **Upload**: Where you can upload audio and subtitle files
- **About**: Information about the application
- **Settings**: Configure application preferences (coming soon)

Use the menu in the top-left corner to navigate between these pages.

### Uploading Files

To get started with editing subtitles:

1. Navigate to the **Upload** page
2. Upload your files using one of these methods:
   - Drag and drop files into the upload area
   - Click "Browse Files" to select files from your device
3. The application accepts the following file types:
   - Audio: `.m4a` files
   - Subtitles: `.srt` files
4. Once files are uploaded, you'll be automatically redirected to the Home page

### Home Page

The Home page shows your uploaded files and provides access to the editing interface:

- **Audio File**: Information about your uploaded audio file
- **Subtitle File**: Information about your uploaded subtitle file
- **Waveform**: Visual representation of the audio with subtitles (when both files are uploaded)

## Working with the Audio Waveform

### Playback Controls

The waveform visualization includes playback controls:

- **Play/Pause**: Start or pause audio playback
- **Skip Backward**: Jump back 5 seconds
- **Skip Forward**: Jump forward 5 seconds
- **Zoom In/Out**: Adjust the waveform zoom level

### Keyboard Shortcuts

The following keyboard shortcuts are available for audio playback:

- **Space**: Play/Pause
- **Left Arrow**: Skip backward 5 seconds
- **Right Arrow**: Skip forward 5 seconds
- **Up Arrow**: Zoom in
- **Down Arrow**: Zoom out

### Reading the Waveform

The waveform visualization shows:

- **Audio Amplitude**: The height of the waveform represents the volume at that point
- **Current Position**: A vertical cursor shows the current playback position
- **Timeline**: A timeline below the waveform shows time markers
- **Subtitles**: Colored regions on the waveform represent subtitle entries

## Understanding Subtitle Regions

Each subtitle is represented as a colored region on the waveform:

- **Color**: Different colors represent different speakers
- **Position**: Regions are positioned at the start and end times of the subtitle
- **Label**: Each region is labeled with its number and the beginning of the subtitle text
- **Vertical Position**: Regions are positioned vertically based on the speaker (top or bottom half)

### Regions List

Below the waveform is a list of all subtitle regions, showing:

- **Region number**: The sequential number of the subtitle
- **Start time**: When the subtitle appears
- **End time**: When the subtitle disappears
- **Duration**: How long the subtitle is displayed
- **Speaker**: Who is speaking in this subtitle
- **Text**: The subtitle text

Click on a region in the list to select it and see its details.

## Editing Subtitles (Coming Soon)

The subtitle editing functionality will allow you to:

1. **Adjust Timing**: Change when subtitles appear and disappear
2. **Edit Text**: Modify the subtitle text
3. **Change Speakers**: Assign different speakers to subtitles
4. **Add/Remove Subtitles**: Create new subtitles or remove existing ones

### Editing Steps (Preview of Upcoming Features)

1. **Select a Region**: Click on a region on the waveform or in the regions list
2. **Adjust Timing**: Drag the edges of the selected region to change its start and end times
3. **Edit Text**: Use the text editor to modify the subtitle content
4. **Save Changes**: Changes are automatically saved

## File Management

### Persistent Storage

The SRT Editor automatically saves your uploaded files and work progress in your browser's storage. This means:

- Your files will still be available if you close and reopen the application
- You can continue working on your subtitles across multiple sessions
- No account or login is required

### Exporting (Coming Soon)

Soon you'll be able to export your edited subtitles as an SRT file:

1. Make your edits to the subtitles
2. Click the "Export SRT" button
3. Choose a filename and save the file to your device

## Troubleshooting

### File Upload Issues

If you encounter problems uploading files:

- Ensure your files are in the correct format (.m4a for audio, .srt for subtitles)
- Check that the file size is not too large (limit: 100MB for audio, 10MB for subtitles)
- Try a different browser if issues persist

### Audio Playback Problems

If audio doesn't play correctly:

- Check that your device's audio is not muted
- Ensure your browser has permission to play audio
- Try refreshing the page

### Browser Compatibility

The SRT Editor works best in modern browsers:

- Chrome (recommended)
- Firefox
- Safari
- Edge

For the best experience, use the latest version of your browser.

## Getting Help

If you need assistance or want to report an issue:

- Check the FAQ (coming soon)
- Visit the project repository
- Submit an issue via GitHub

## Privacy

The SRT Editor processes all files locally in your browser:

- No files are uploaded to external servers
- All data is stored in your browser's local storage
- Your files and edits remain private to your device

## Future Features

Keep an eye out for upcoming features:

- Subtitle text editing
- Region timing adjustments
- Speaker management
- SRT file export
- Additional file format support
- Video support
