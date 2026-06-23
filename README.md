# DATABEND

DATABEND is an experimental Electron desktop app for bending, slicing, and reshaping audio. It loads local audio files, lets you work with transient slices and loop regions, and exports edited results as WAV.

## Highlights

- Load audio from your machine
- Edit waveforms with loop, slice, and track controls
- Apply a large set of glitch, spectral, granular, and wavelet-style processors
- Export finished audio or drag clips into a DAW
- Package the desktop app with Electron Builder

## Project Layout

- `main.js`, `preload.js`: Electron shell and secure IPC bridge
- `app.js`: Main application logic
- `index.html`, `styles.css`: Primary interface
- `splash.html`, `splash-preload.js`: Launch splash screen
- `*Worker.js`: Audio-processing workers
- `build/icon.png`: App icon used by Electron
- `vst_host_backend/`: Python-based host experiment
- `vst_host_juce/`: JUCE VST host source and support files
- `waveset-k-means-quantizer/`: Separate audio-analysis prototype

## Requirements

- Node.js 18 or newer
- npm

## Run Locally

```bash
npm install
npm start
```

## Build

```bash
npm run dist
```

The packaged output is written to `dist/`.

## Notes

- The repository includes a few experimental subprojects. The generated build folders and local environments are ignored so the GitHub history stays focused on source.
- Audio import and export dialogs are handled locally inside the desktop app.
