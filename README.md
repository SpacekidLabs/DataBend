# DATABEND

DATABEND is an experimental Electron desktop app for audio glitching, slicing, and wave-style processing. It loads local files, lets you work with transient slices and loop regions, and exports finished audio as WAV.

## What It Does

- Load audio from your computer
- Edit waveforms with loop, slice, track, and history controls
- Apply a wide set of glitch, spectral, granular, and wavelet-style processors
- Export finished audio or drag clips into a DAW
- Package the desktop app with Electron Builder

## Getting Started

### Requirements

- Node.js 18 or newer
- npm

### Install

```bash
npm install
```

### Run

```bash
npm start
```

### Package

```bash
npm run build
```

The packaged output is written to `dist/`.

## Project Structure

- `main.js`, `preload.js`: Electron shell and secure IPC bridge
- `app.js`: Main application logic
- `index.html`, `styles.css`: Primary UI
- `splash.html`, `splash-preload.js`: Launch splash screen
- `*Worker.js`: Audio-processing workers
- `build/icon.png`: App icon used by Electron
- `waveset-k-means-quantizer/`: Separate audio-analysis prototype

## Repo Hygiene

- Generated folders such as `dist/`, `node_modules/`, and local virtual environments are ignored.
- The repository keeps the source tree and packaging inputs only, so the Git history stays readable.
- The retired VST host experiment has been removed from the published project tree.

## Status

This project is experimental, but the repository is maintained in a clean, publishable state for GitHub.
