# SRT Editor - Project Overview

## Introduction

SRT Editor is a web application built with React, TailwindCSS, and Zustand that allows users to visually edit subtitle (.srt) files alongside their corresponding audio (.m4a) files. The application provides a visual interface for viewing and editing subtitle timings, text, and speaker information.

## Key Features

- **File Upload**: Users can upload .m4a audio files and .srt subtitle files via drag-and-drop or file browser
- **Audio Visualization**: Audio waveform visualization with playback controls
- **Subtitle Display**: Visual representation of subtitles as regions on the waveform
- **Speaker Detection**: Automatic detection and color-coding of different speakers in the subtitles
- **Persistent Storage**: Files and application state are persisted using IndexedDB (with localStorage fallback)
- **Responsive Design**: Modern UI that works across different screen sizes

## Technology Stack

- **Frontend Framework**: React with Vite for fast development
- **Styling**: TailwindCSS for utility-first styling
- **State Management**: Zustand for simple and efficient state management
- **Audio Processing**: WaveSurfer.js for audio visualization and manipulation
- **Storage**: IndexedDB with localStorage fallback

## Current Status

The application is currently in development with the following components implemented:

- File upload interface
- Basic audio waveform visualization
- SRT file parsing with speaker detection
- Basic UI structure and navigation

The SRT editing functionality is planned but not yet implemented, which is the next major feature to be added.

## Target Users

This application is intended for:

- Content creators who need to create or edit subtitles for their videos
- Translators who work with subtitle files
- Anyone who needs to synchronize subtitles with audio
