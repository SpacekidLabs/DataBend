/*
 * All application logic for the DATABEND audio editor.
 * This script is wrapped to ensure it only runs after the DOM is fully loaded.
 */
document.addEventListener("DOMContentLoaded", () => {
  /* ======= DOM refs ======= */
  const canvas = document.getElementById("canvas"),
    ctx = canvas.getContext("2d");
  const overlay = document.getElementById("overlay"),
    octx = overlay.getContext("2d");
  const loadBtn = document.getElementById("loadBtn");
  const playBtn = document.getElementById("playBtn");
  const stopBtn = document.getElementById("stopBtn");
  const exportBtn = document.getElementById("exportBtn");
  const exportKitBtn = document.getElementById("exportKitBtn");
  const dragLoopBtn = document.getElementById("dragLoopBtn");
  const dragSliceBtn = document.getElementById("dragSliceBtn");
  const destroyBtn = document.getElementById("destroyBtn");
  const tracksToggleBtn = document.getElementById("tracksToggleBtn");
  const multiTrackContainer = document.getElementById("multiTrackContainer");
  const sliceBtn = document.getElementById("sliceBtn");
  const sliceThreshold = document.getElementById("sliceThreshold");
  const sliceThresholdContainer = document.getElementById("sliceThresholdContainer");
  const undoBtn = document.getElementById("undoBtn");
  const redoBtn = document.getElementById("redoBtn");
  const duplicateBtn = document.getElementById("duplicateBtn");
  const deleteBtn = document.getElementById("deleteBtn");
  const clearTrackBtn = document.getElementById("clearTrackBtn");
  const sliceToolbar = document.getElementById("sliceToolbar");
  const slicePrevBtn = document.getElementById("slicePrevBtn");
  const sliceNextBtn = document.getElementById("sliceNextBtn");
  const sliceCounter = document.getElementById("sliceCounter");
  const slicePlayBtn = document.getElementById("slicePlayBtn");
  const sliceReverseBtn = document.getElementById("sliceReverseBtn");
  const slicePitchUpBtn = document.getElementById("slicePitchUpBtn");
  const slicePitchDownBtn = document.getElementById("slicePitchDownBtn");
  const sliceHalfSpeedBtn = document.getElementById("sliceHalfSpeedBtn");
  const sliceDoubleSpeedBtn = document.getElementById("sliceDoubleSpeedBtn");
  const sliceFadeInBtn = document.getElementById("sliceFadeInBtn");
  const sliceFadeOutBtn = document.getElementById("sliceFadeOutBtn");
  const sliceStutterBtn = document.getElementById("sliceStutterBtn");
  const sliceMuteBtn = document.getElementById("sliceMuteBtn");
  const sliceBitcrushBtn = document.getElementById("sliceBitcrushBtn");
  const sliceGateBtn = document.getElementById("sliceGateBtn");
  const bitcrushBtn = document.getElementById("bitcrushBtn");
  const foldBtn = document.getElementById("foldBtn");
  const reverseBtn = document.getElementById("reverseBtn");
  const ringBtn = document.getElementById("ringBtn");
  const warpBtn = document.getElementById("warpBtn");
  const smearBtn = document.getElementById("smearBtn");
  const chebyBtn = document.getElementById("chebyBtn");
  const combBtn = document.getElementById("combBtn");
  const filterBtn = document.getElementById("filterBtn");
  const phaserBtn = document.getElementById("phaserBtn");
  const delayBtn = document.getElementById("delayBtn");
  const reverbBtn = document.getElementById("reverbBtn");
  const tapeStopBtn = document.getElementById("tapeStopBtn");
  const melterBtn = document.getElementById("melterBtn");
  const spectralRotatorBtn = document.getElementById("spectralRotatorBtn");
  const shredderBtn = document.getElementById("shredderBtn");
  const waveletChaosBtn = document.getElementById("waveletChaosBtn");
  const scaleCorruptorBtn = document.getElementById("scaleCorruptorBtn");
  const waveletTreeDisruptorBtn = document.getElementById("waveletTreeDisruptorBtn");
  const waveletChronoBtn = document.getElementById("waveletChronoBtn");
  const waveletFoldBtn = document.getElementById("waveletFoldBtn");
  const waveletQuantBtn = document.getElementById("waveletQuantBtn");
  const entropyGlitchBtn = document.getElementById("entropyGlitchBtn");
  const wavesetKMeansBtn = document.getElementById("wavesetKMeansBtn");
  const wsRepeatBtn = document.getElementById("wsRepeatBtn");
  const wsOmitBtn = document.getElementById("wsOmitBtn");
  const wsReverseBtn = document.getElementById("wsReverseBtn");
  const wsScrambleBtn = document.getElementById("wsScrambleBtn");
  const wsMultiplyBtn = document.getElementById("wsMultiplyBtn");
  const wsDivideBtn = document.getElementById("wsDivideBtn");
  const wsAverageBtn = document.getElementById("wsAverageBtn");
  const wsFilterBtn = document.getElementById("wsFilterBtn");
  const wsClipBtn = document.getElementById("wsClipBtn");
  
  // Granular Processors
  const granStretchBtn = document.getElementById("granStretchBtn");
  const granPitchBtn = document.getElementById("granPitchBtn");
  const granFreezeBtn = document.getElementById("granFreezeBtn");
  
  // Obscure processor buttons
  const muLawBtn = document.getElementById("muLawBtn");
  const bytebeatBtn = document.getElementById("bytebeatBtn");
  const phaseScrambleBtn = document.getElementById("phaseScrambleBtn");
  const selfFmBtn = document.getElementById("selfFmBtn");
  const chaosMapBtn = document.getElementById("chaosMapBtn");
  const karplusBtn = document.getElementById("karplusBtn");
  const shimmerDelayBtn = document.getElementById("shimmerDelayBtn");
  const formantFilterBtn = document.getElementById("formantFilterBtn");


  const statusEl = document.getElementById("status");
  const glitchBox = document.getElementById("glitchProgress");
  const progressBarFill = document.getElementById("progressBarFill");
  const progressBarText = document.getElementById("progressBarText");
  const modalOverlay = document.getElementById("modalOverlay");
  const modalTitle = document.getElementById("modalTitle");
  const modalContent = document.getElementById("modalContent");
  const modalCommit = document.getElementById("modalCommit");
  const modalRandom = document.getElementById("modalRandom");
  const modalCancel = document.getElementById("modalCancel");
  const modalAudition = document.getElementById("modalAudition");
 
  /* ======= Audio / State ======= */
  let audioCtx = null;
  let analyser = null;
  let current = null,
    history = [],
    historyIndex = -1;
  let playing = false,
    playSource = null,
    playStartTime = 0,
    playOffset = 0,
    playLoopActive = false;
  let loopStart = 0,
    loopEnd = 0,
    unfadedBuffer = null,
    fadeInLength = 0,
    fadeOutLength = 0;
  
  /* ======= Audition State ======= */
  let auditioning = false;
  let auditionSource = null;
  let isAuditionMode = false;
  const freqData = new Uint8Array(256);
  const accent =
    getComputedStyle(document.documentElement).getPropertyValue("--accent") ||
    "#0d7377";

  // NEW: State for transient gating visual preview
  let transientGatingState = {
    active: false,
    ratio: 0,
    transients: [],
  };

  // State for transient slicing mode
  let sliceModeActive = false;
  let detectedTransients = [];
  let hoveredSliceIndex = -1;
  let hoveredSliceMarkerIndex = -1;
  let isDraggingSliceMarker = false;
  let draggingSliceMarkerIndex = -1;
  let selectedSliceIndex = -1;

  // State for multi-track playlist mode
  let tracksModeActive = false;
  let focusedTrackId = 1;
  let activeTrackIndex = 0;
  let tracks = [
    {
      id: 1,
      name: "Track 1",
      buffer: null,
      offset: 0,
      volume: 1.0,
      muted: false,
      soloed: false,
      history: [],
      historyIndex: -1,
      zoomStart: 0.0,
      zoomEnd: 1.0,
      loopStart: 0.0,
      loopEnd: 0.0,
      detectedTransients: [],
      sliceModeActive: false,
      unfadedBuffer: null,
      fadeInLength: 0.0,
      fadeOutLength: 0.0,
      color: "#f59e0b", // Orange Accent
      pan: 0.0
    },
    {
      id: 2,
      name: "Track 2",
      buffer: null,
      offset: 0,
      volume: 1.0,
      muted: false,
      soloed: false,
      history: [],
      historyIndex: -1,
      zoomStart: 0.0,
      zoomEnd: 1.0,
      loopStart: 0.0,
      loopEnd: 0.0,
      detectedTransients: [],
      sliceModeActive: false,
      unfadedBuffer: null,
      fadeInLength: 0.0,
      fadeOutLength: 0.0,
      color: "#00f0ff", // Cyan
      pan: 0.0
    },
    {
      id: 3,
      name: "Track 3",
      buffer: null,
      offset: 0,
      volume: 1.0,
      muted: false,
      soloed: false,
      history: [],
      historyIndex: -1,
      zoomStart: 0.0,
      zoomEnd: 1.0,
      loopStart: 0.0,
      loopEnd: 0.0,
      detectedTransients: [],
      sliceModeActive: false,
      unfadedBuffer: null,
      fadeInLength: 0.0,
      fadeOutLength: 0.0,
      color: "#39ff14", // Neon Green
      pan: 0.0
    },
    {
      id: 4,
      name: "Track 4",
      buffer: null,
      offset: 0,
      volume: 1.0,
      muted: false,
      soloed: false,
      history: [],
      historyIndex: -1,
      zoomStart: 0.0,
      zoomEnd: 1.0,
      loopStart: 0.0,
      loopEnd: 0.0,
      detectedTransients: [],
      sliceModeActive: false,
      unfadedBuffer: null,
      fadeInLength: 0.0,
      fadeOutLength: 0.0,
      color: "#ff3366", // Neon Pink
      pan: 0.0
    }
  ];

  function saveActiveTrackState() {
    const t = tracks[activeTrackIndex];
    if (t) {
      t.buffer = current;
      t.history = history;
      t.historyIndex = historyIndex;
      t.zoomStart = zoomStart;
      t.zoomEnd = zoomEnd;
      t.loopStart = loopStart;
      t.loopEnd = loopEnd;
      t.detectedTransients = detectedTransients;
      t.sliceModeActive = sliceModeActive;
      t.selectedSliceIndex = selectedSliceIndex;
      t.unfadedBuffer = unfadedBuffer;
      t.fadeInLength = fadeInLength;
      t.fadeOutLength = fadeOutLength;
    }
  }

  function loadActiveTrackState() {
    const t = tracks[activeTrackIndex];
    if (t) {
      current = t.buffer;
      history = t.history || [];
      historyIndex = t.historyIndex !== undefined ? t.historyIndex : -1;
      zoomStart = t.zoomStart !== undefined ? t.zoomStart : 0.0;
      zoomEnd = t.zoomEnd !== undefined ? t.zoomEnd : 1.0;
      loopStart = t.loopStart !== undefined ? t.loopStart : 0.0;
      loopEnd = t.loopEnd !== undefined ? t.loopEnd : 0.0;
      detectedTransients = t.detectedTransients || [];
      sliceModeActive = t.sliceModeActive !== undefined ? t.sliceModeActive : false;
      selectedSliceIndex = t.selectedSliceIndex !== undefined ? t.selectedSliceIndex : -1;
      unfadedBuffer = t.unfadedBuffer || null;
      fadeInLength = t.fadeInLength || 0;
      fadeOutLength = t.fadeOutLength || 0;

      // Sync slice UI buttons
      if (sliceBtn) {
        if (sliceModeActive) {
          sliceBtn.classList.add("active");
          if (sliceThresholdContainer) sliceThresholdContainer.classList.remove("hidden");
        } else {
          sliceBtn.classList.remove("active");
          if (sliceThresholdContainer) sliceThresholdContainer.classList.add("hidden");
        }
      }
    }
  }

  function clearTrackAudio(idx) {
    const t = tracks[idx];
    if (!t) return;

    t.buffer = null;
    t.name = `Track ${t.id}`;
    t.history = [];
    t.historyIndex = -1;
    t.zoomStart = 0.0;
    t.zoomEnd = 1.0;
    t.loopStart = 0.0;
    t.loopEnd = 0.0;
    t.detectedTransients = [];
    t.sliceModeActive = false;

    if (idx === activeTrackIndex) {
      current = null;
      history = [];
      historyIndex = -1;
      zoomStart = 0.0;
      zoomEnd = 1.0;
      loopStart = 0.0;
      loopEnd = 0.0;
      detectedTransients = [];
      sliceModeActive = false;
      saveAudioToDB(null).catch(err => console.error("Error clearing DB:", err));
    }
    updateUI();
  }

  function updateSliceToolbarPosition() {
    const toolbar = document.getElementById("sliceToolbar");
    if (!toolbar) return;
    if (!sliceModeActive || !current || loopEnd <= loopStart) {
      toolbar.classList.add("hidden");
      if (sliceCounter) sliceCounter.textContent = "—";
      return;
    }
    
    // Update slice counter label
    if (sliceCounter && selectedSliceIndex >= 0 && detectedTransients.length > 1) {
      const total = detectedTransients.length - 1;
      sliceCounter.textContent = `${selectedSliceIndex + 1}/${total}`;
    } else if (sliceCounter) {
      sliceCounter.textContent = "—";
    }
    
    toolbar.style.left = '';
    toolbar.classList.remove("hidden");
  }

  /**
   * Select a slice by index: sets loop bounds, updates selectedSliceIndex, redraws.
   * If autoPlay is true, immediately plays the slice.
   */
  function selectSlice(index, autoPlay = true) {
    if (!sliceModeActive || detectedTransients.length < 2) return;
    const maxIdx = detectedTransients.length - 2;
    index = Math.max(0, Math.min(maxIdx, index));
    
    selectedSliceIndex = index;
    loopStart = detectedTransients[index];
    loopEnd = detectedTransients[index + 1];
    fadeInLength = 0;
    fadeOutLength = 0;
    unfadedBuffer = null;
    
    drawOverlay();
    drawWaveform();
    updateSliceToolbarPosition();
    

  }

  /**
   * Navigate to prev/next slice relative to current.
   */
  function navigateSlice(direction) {
    if (!sliceModeActive || detectedTransients.length < 2) return;
    const maxIdx = detectedTransients.length - 2;
    let newIdx = selectedSliceIndex + direction;
    if (newIdx < 0) newIdx = maxIdx; // wrap around
    if (newIdx > maxIdx) newIdx = 0;
    selectSlice(newIdx, true);
  }

  function setupSliceToolbar() {
    // --- Navigation ---
    if (slicePrevBtn) {
      slicePrevBtn.onclick = (e) => {
        e.stopPropagation();
        navigateSlice(-1);
      };
    }
    if (sliceNextBtn) {
      sliceNextBtn.onclick = (e) => {
        e.stopPropagation();
        navigateSlice(1);
      };
    }

    // --- Transport ---
    if (slicePlayBtn) {
      slicePlayBtn.onclick = (e) => {
        e.stopPropagation();
        if (playing) {
          stopPlayback();
        } else {
          startPlayback(loopStart);
        }
      };
    }

    // --- Effects (all auto-advance to next slice after applying) ---
    if (sliceReverseBtn) {
      sliceReverseBtn.onclick = (e) => {
        e.stopPropagation();
        applybend((r) => r.slice().reverse(), { label: "Reversing Slice..." });
      };
    }
    if (slicePitchUpBtn) {
      slicePitchUpBtn.onclick = (e) => {
        e.stopPropagation();
        pitchTimeShift(1.059463094);
      };
    }
    if (slicePitchDownBtn) {
      slicePitchDownBtn.onclick = (e) => {
        e.stopPropagation();
        pitchTimeShift(1 / 1.059463094);
      };
    }
    if (sliceHalfSpeedBtn) {
      sliceHalfSpeedBtn.onclick = (e) => {
        e.stopPropagation();
        applybend((r) => {
          // Resample to half speed (double length) via linear interpolation
          const out = new Float32Array(r.length * 2);
          for (let i = 0; i < out.length; i++) {
            const srcPos = i * 0.5;
            const idx = Math.floor(srcPos);
            const frac = srcPos - idx;
            const s0 = r[Math.min(idx, r.length - 1)];
            const s1 = r[Math.min(idx + 1, r.length - 1)];
            out[i] = s0 + frac * (s1 - s0);
          }
          return out;
        }, { label: "Half Speed..." });
      };
    }
    if (sliceDoubleSpeedBtn) {
      sliceDoubleSpeedBtn.onclick = (e) => {
        e.stopPropagation();
        applybend((r) => {
          // Resample to double speed (half length)
          const out = new Float32Array(Math.floor(r.length / 2));
          for (let i = 0; i < out.length; i++) {
            const srcPos = i * 2;
            const idx = Math.floor(srcPos);
            const frac = srcPos - idx;
            const s0 = r[Math.min(idx, r.length - 1)];
            const s1 = r[Math.min(idx + 1, r.length - 1)];
            out[i] = s0 + frac * (s1 - s0);
          }
          return out;
        }, { label: "Double Speed..." });
      };
    }
    if (sliceFadeInBtn) {
      sliceFadeInBtn.onclick = (e) => {
        e.stopPropagation();
        applybend((r) => {
          const out = new Float32Array(r.length);
          for (let i = 0; i < r.length; i++) {
            // Logarithmic fade in for natural feel
            const t = i / r.length;
            const gain = t * t; // Quadratic ease-in
            out[i] = r[i] * gain;
          }
          return out;
        }, { label: "Fading In..." });
      };
    }
    if (sliceFadeOutBtn) {
      sliceFadeOutBtn.onclick = (e) => {
        e.stopPropagation();
        applybend((r) => {
          const out = new Float32Array(r.length);
          for (let i = 0; i < r.length; i++) {
            const t = 1 - (i / r.length);
            const gain = t * t; // Quadratic ease-out
            out[i] = r[i] * gain;
          }
          return out;
        }, { label: "Fading Out..." });
      };
    }
    if (sliceStutterBtn) {
      sliceStutterBtn.onclick = (e) => {
        e.stopPropagation();
        applybend((r) => {
          const out = new Float32Array(r.length);
          // Repeat a small chunk (1/8th of slice) to fill the region
          const chunkLen = Math.max(64, Math.floor(r.length / 8));
          for (let i = 0; i < r.length; i++) {
            out[i] = r[i % chunkLen];
          }
          return out;
        }, { label: "Stuttering Slice..." });
      };
    }
    if (sliceMuteBtn) {
      sliceMuteBtn.onclick = (e) => {
        e.stopPropagation();
        applybend((r) => new Float32Array(r.length), { label: "Silencing Slice..." });
      };
    }
    if (sliceBitcrushBtn) {
      sliceBitcrushBtn.onclick = (e) => {
        e.stopPropagation();
        applybend(
          (r) => {
            const o = new Float32Array(r.length);
            const step = Math.pow(0.5, 7); // 8-bit
            for (let i = 0; i < r.length; i++) {
              o[i] = step * Math.floor(r[i] / step + 0.5);
            }
            return o;
          },
          { label: "Bitcrushing Slice..." }
        );
      };
    }
    if (sliceGateBtn) {
      sliceGateBtn.onclick = (e) => {
        e.stopPropagation();
        applybend(
          (r) => {
            const o = new Float32Array(r.length);
            for (let i = 0; i < r.length; i++) {
              o[i] = Math.abs(r[i]) < 0.05 ? 0 : r[i];
            }
            return o;
          },
          { label: "Gating Slice..." }
        );
      };
    }
  }

  let dragTrackId = null;
  let dragStartOffset = 0;
  let dragStartMouseX = 0;

  /* ======= Zoom, Panning & Minimap State ======= */
  let zoomStart = 0.0;
  let zoomEnd = 1.0;
  let hoveredEdge = null; // 'start', 'end', or null
  let isPanning = false;
  let panStartX = 0;
  let panStartZoomStart = 0;
  let panStartZoomEnd = 0;
  let isDraggingViewport = false;
  let dragViewportStartOffset = 0;

  // Minimap canvas reference
  const minimapCanvas = document.getElementById("minimapCanvas");
  let mctx = minimapCanvas ? minimapCanvas.getContext("2d") : null;

  /* ======= IndexedDB Logic ======= */
  const DB_NAME = "databendDB",
    STORE_NAME = "audioStore";
  let db;
  async function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onerror = () => reject("Error opening DB");
      request.onsuccess = (e) => {
        db = e.target.result;
        resolve(db);
      };
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME))
          db.createObjectStore(STORE_NAME);
      };
    });
  }
  async function saveAudioToDB(float32Array) {
    if (!db) await openDB();
    const tx = db.transaction([STORE_NAME], "readwrite");
    return tx.objectStore(STORE_NAME).put(float32Array, "lastAudioBuffer");
  }
  async function loadAudioFromDB() {
    if (!db) await openDB();
    const tx = db.transaction([STORE_NAME], "readonly");
    return new Promise((res) => {
      const req = tx.objectStore(STORE_NAME).get("lastAudioBuffer");
      req.onsuccess = () => res(req.result);
      req.onerror = () => res(null);
    });
  }

  function recalculateTransients() {
    if (!current || !audioCtx) {
      detectedTransients = [];
      return;
    }
    const threshold = sliceThreshold ? parseFloat(sliceThreshold.value) : 0.08;
    const transients = detectTransients(current, threshold);
    const sr = audioCtx.sampleRate;
    detectedTransients = transients.map((idx) => idx / sr);

    // Add boundaries
    detectedTransients.unshift(0.0);
    const dur = durationSeconds();
    if (!detectedTransients.includes(dur)) {
      detectedTransients.push(dur);
    }
    detectedTransients = [...new Set(detectedTransients)].sort((a, b) => a - b);
  }

  function setupSliceMode() {
    if (sliceBtn) {
      sliceBtn.onclick = () => {
        sliceModeActive = !sliceModeActive;
        if (sliceModeActive) {
          sliceBtn.classList.add("active");
          if (sliceThresholdContainer) {
            sliceThresholdContainer.classList.remove("hidden");
          }
          if (destroyBtn) {
            destroyBtn.classList.remove("hidden");
          }
          recalculateTransients();
          // Auto-select the first slice
          if (detectedTransients.length >= 2) {
            selectSlice(0, false); // Select but don't auto-play
          }
          setStatus("Slice Mode: Click or use ← → arrows to navigate slices", 3000);
        } else {
          sliceBtn.classList.remove("active");
          if (sliceThresholdContainer) {
            sliceThresholdContainer.classList.add("hidden");
          }
          if (destroyBtn) {
            destroyBtn.classList.add("hidden");
          }
          detectedTransients = [];
          hoveredSliceIndex = -1;
          selectedSliceIndex = -1;
          setStatus("Slice Mode Disabled", 1200);
        }
        drawOverlay();
      };
    }

    if (sliceThreshold) {
      sliceThreshold.oninput = () => {
        if (sliceModeActive) {
          recalculateTransients();
          // Re-select a valid slice after recalculation
          if (detectedTransients.length >= 2) {
            const maxIdx = detectedTransients.length - 2;
            if (selectedSliceIndex < 0 || selectedSliceIndex > maxIdx) {
              selectSlice(0, false);
            }
          }
          drawOverlay();
        }
      };
    }
  }

  /* ======= Multi-Track Playlist Logic ======= */

  function getPlaylistDuration() {
    if (!audioCtx) return 10;
    const sr = audioCtx.sampleRate;
    let maxTime = 10;
    for (const t of tracks) {
      if (t.buffer) {
        const dur = t.offset + t.buffer.length / sr;
        if (dur > maxTime) maxTime = dur;
      }
    }
    return maxTime;
  }

  /* ======= Multi-Track Playlist View ======= */
  function drawTrackWaveform(track, canvasEl) {
    if (!canvasEl) return;
    const ctx = canvasEl.getContext("2d");
    
    const wrapper = canvasEl.parentElement;
    const w = wrapper.clientWidth || wrapper.offsetWidth || 1;
    const h = wrapper.clientHeight || wrapper.offsetHeight || 1;

    // Set matching resolution
    canvasEl.width = w * devicePixelRatio;
    canvasEl.height = h * devicePixelRatio;
    canvasEl.style.width = w + "px";
    canvasEl.style.height = h + "px";
    ctx.scale(devicePixelRatio, devicePixelRatio);
    
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#070709";
    ctx.fillRect(0, 0, w, h);

    // Draw grid
    drawGrid(ctx, w, h);

    if (!track.buffer) return;

    const buffer = track.buffer;
    const sr = audioCtx ? audioCtx.sampleRate : 44100;
    const clipDur = buffer.length / sr;
    const playlistDur = getPlaylistDuration();

    const startX = (track.offset / playlistDur) * w;
    const clipW = (clipDur / playlistDur) * w;

    ctx.save();
    ctx.fillStyle = track.color || accent;

    const step = Math.max(1, Math.floor(buffer.length / clipW));
    for (let x = 0; x < clipW; x++) {
      const i = Math.floor(x * step);
      if (i >= buffer.length) break;
      let min = 1, max = -1;
      const chunkEnd = Math.min(buffer.length, Math.ceil((x + 1) * step));
      for (let j = i; j < chunkEnd; j++) {
        const v = buffer[j];
        if (v < min) min = v;
        if (v > max) max = v;
      }
      const yBottom = ((max + 1) / 2) * h;
      const yTop = ((min + 1) / 2) * h;
      ctx.fillRect(startX + x, yTop, 1, Math.max(1, yBottom - yTop));
    }

    ctx.restore();

    // Draw loop region
    if (track.loopStart < track.loopEnd) {
      const loopStartX = startX + track.loopStart * clipW;
      const loopEndX = startX + track.loopEnd * clipW;
      ctx.fillStyle = track.color ? track.color + "33" : "rgba(255, 255, 255, 0.2)";
      ctx.fillRect(loopStartX, 0, loopEndX - loopStartX, h);
    }
  }

  function renderTrackLanes() {
    if (!multiTrackContainer) return;
    multiTrackContainer.innerHTML = "";

    // Add Bounce wrapper
    const bounceWrap = document.createElement("div");
    bounceWrap.className = "track-bounce-wrap";
    bounceWrap.innerHTML = `
      <button class="track-bounce-btn" id="bounceMixBtn" title="Mixdown tracks and load into active track">Bounce Mix</button>
      <button class="track-bounce-btn secondary" id="closePlaylistBtn" title="Return to Track Editor">Close</button>
    `;
    multiTrackContainer.appendChild(bounceWrap);

    document.getElementById("bounceMixBtn").onclick = bounceMultiTrackMixdown;
    document.getElementById("closePlaylistBtn").onclick = () => toggleTracksMode();

    tracks.forEach((t) => {
      const lane = document.createElement("div");
      lane.className = `track-lane ${t.id === focusedTrackId ? "focused" : ""}`;
      lane.dataset.trackId = t.id;
      lane.style.borderLeftColor = t.color;

      // Track header on left
      const header = document.createElement("div");
      header.className = "track-header";

      const title = document.createElement("div");
      title.className = "track-title";
      title.textContent = t.buffer ? t.name : `Track ${t.id} (Empty)`;
      title.style.color = t.color;

      const controls = document.createElement("div");
      controls.className = "track-controls";

      const buttons = document.createElement("div");
      buttons.className = "track-buttons";

      const muteBtn = document.createElement("button");
      muteBtn.className = `track-btn ${t.muted ? "active-mute" : ""}`;
      muteBtn.textContent = "M";
      muteBtn.title = "Mute track";
      muteBtn.onclick = (e) => {
        e.stopPropagation();
        t.muted = !t.muted;
        renderTrackLanes();
      };

      const soloBtn = document.createElement("button");
      soloBtn.className = `track-btn ${t.soloed ? "active-solo" : ""}`;
      soloBtn.textContent = "S";
      soloBtn.title = "Solo track";
      soloBtn.onclick = (e) => {
        e.stopPropagation();
        t.soloed = !t.soloed;
        renderTrackLanes();
      };

      const focusBtn = document.createElement("button");
      focusBtn.className = "track-btn";
      focusBtn.innerHTML = "👁";
      focusBtn.title = "Expand this track for detailed editing";
      focusBtn.onclick = (e) => {
        e.stopPropagation();
        stopPlaybackSilent();
        saveActiveTrackState();
        activeTrackIndex = tracks.indexOf(t);
        focusedTrackId = t.id;
        loadActiveTrackState();
        tracksModeActive = false;
        if (multiTrackContainer) multiTrackContainer.classList.add("hidden");
        if (tracksToggleBtn) tracksToggleBtn.classList.remove("active");
        updateUI();
        setStatus(`Editing track: ${t.name}`, 1500);
      };

      const clearBtn = document.createElement("button");
      clearBtn.className = "track-btn clear-track-btn";
      clearBtn.innerHTML = "🗑";
      clearBtn.title = "Delete all audio from this track";
      clearBtn.onclick = async (e) => {
        e.stopPropagation();
        if (t.buffer) {
          if (await customConfirm(`Are you sure you want to delete all audio from Track ${tracks.indexOf(t) + 1}?`)) {
            stopPlaybackSilent();
            clearTrackAudio(tracks.indexOf(t));
            renderTrackLanes();
            setStatus(`Cleared Track ${tracks.indexOf(t) + 1}`, 1500);
          }
        } else {
          setStatus("Track is already empty", 1200);
        }
      };

      buttons.appendChild(muteBtn);
      buttons.appendChild(soloBtn);
      buttons.appendChild(focusBtn);
      buttons.appendChild(clearBtn);

      const volWrap = document.createElement("div");
      volWrap.className = "track-vol-wrap";
      volWrap.innerHTML = `
        <label>VOL</label>
        <input type="range" min="0" max="1.5" step="0.05" value="${t.volume}">
      `;
      const volSlider = volWrap.querySelector('input');
      volSlider.oninput = (e) => {
        t.volume = parseFloat(e.target.value);
      };

      const panWrap = document.createElement("div");
      panWrap.className = "track-vol-wrap track-pan-wrap";
      panWrap.innerHTML = `
        <label>PAN</label>
        <input type="range" min="-1.0" max="1.0" step="0.05" value="${t.pan || 0.0}">
      `;
      const panSlider = panWrap.querySelector('input');
      panSlider.oninput = (e) => {
        t.pan = parseFloat(e.target.value);
      };

      controls.appendChild(buttons);
      controls.appendChild(volWrap);
      controls.appendChild(panWrap);

      header.appendChild(title);
      header.appendChild(controls);

      // Track waveform wrapper on right
      const waveWrapper = document.createElement("div");
      waveWrapper.className = "track-waveform-wrapper";
      
      const canvasEl = document.createElement("canvas");
      waveWrapper.appendChild(canvasEl);

      if (!t.buffer) {
        const msg = document.createElement("div");
        msg.className = "track-empty-msg";
        msg.textContent = "DRAG & DROP OR DOUBLE CLICK TO BROWSE";
        waveWrapper.appendChild(msg);

        const openBrowserForTrack = (e) => {
          e.stopPropagation();
          stopPlaybackSilent();
          saveActiveTrackState();
          activeTrackIndex = tracks.indexOf(t);
          focusedTrackId = t.id;
          loadActiveTrackState();
          openSampleBrowser();
        };

        waveWrapper.ondblclick = openBrowserForTrack;
        lane.ondblclick = openBrowserForTrack;
      }

      lane.appendChild(header);
      lane.appendChild(waveWrapper);
      multiTrackContainer.appendChild(lane);

      // Draw the waveform
      // Use setTimeout so the DOM has a chance to lay out the wrapper before we measure its width
      setTimeout(() => {
        drawTrackWaveform(t, canvasEl);
      }, 0);

      // Dynamically redraw whenever the lane resizes or becomes visible
      const ro = new ResizeObserver(() => {
        if (waveWrapper.offsetWidth > 0 && waveWrapper.offsetHeight > 0) {
          drawTrackWaveform(t, canvasEl);
        }
      });
      ro.observe(waveWrapper);

      // Mouse drag to shift offset or set loop
      let isLoopDragging = false;
      let loopDragStart = 0;

      waveWrapper.onpointerdown = (ev) => {
        focusedTrackId = t.id;
        activeTrackIndex = t.id - 1;
        document.querySelectorAll(".track-lane").forEach((l) => {
          l.classList.remove("focused");
        });
        lane.classList.add("focused");

        const rect = waveWrapper.getBoundingClientRect();

        if (ev.shiftKey && t.buffer) {
          isLoopDragging = true;
          const playlistDur = getPlaylistDuration();
          const w = rect.width || 1;
          const clipDur = t.buffer.length / (audioCtx ? audioCtx.sampleRate : 44100);
          const startX = (t.offset / playlistDur) * w;
          const clipW = (clipDur / playlistDur) * w;
          
          let localPos = (ev.clientX - rect.left - startX) / clipW;
          localPos = Math.max(0, Math.min(1, localPos));
          loopDragStart = localPos;
          t.loopStart = localPos;
          t.loopEnd = localPos;
          waveWrapper.setPointerCapture(ev.pointerId);
          renderTrackLanes();
        } else {
          dragTrackId = t.id;
          dragStartMouseX = ev.clientX;
          dragStartOffset = t.offset;
          waveWrapper.setPointerCapture(ev.pointerId);
        }
      };

      waveWrapper.onpointermove = (ev) => {
        if (isLoopDragging && t.buffer) {
          const rect = waveWrapper.getBoundingClientRect();
          const playlistDur = getPlaylistDuration();
          const w = rect.width || 1;
          const clipDur = t.buffer.length / (audioCtx ? audioCtx.sampleRate : 44100);
          const startX = (t.offset / playlistDur) * w;
          const clipW = (clipDur / playlistDur) * w;
          
          let localPos = (ev.clientX - rect.left - startX) / clipW;
          localPos = Math.max(0, Math.min(1, localPos));
          if (Math.abs(localPos - loopDragStart) > 0.01) {
             fadeInLength = 0;
             fadeOutLength = 0;
          }
          t.loopStart = Math.min(loopDragStart, localPos);
          t.loopEnd = Math.max(loopDragStart, localPos);
          renderTrackLanes();
        } else if (dragTrackId === t.id) {
          const dx = ev.clientX - dragStartMouseX;
          const playlistDur = getPlaylistDuration();
          const rect = waveWrapper.getBoundingClientRect();
          const timeDelta = (dx / (rect.width || 1)) * playlistDur;
          t.offset = Math.max(0, dragStartOffset + timeDelta);
          renderTrackLanes();
        }
      };

      waveWrapper.onpointerup = (ev) => {
        if (isLoopDragging) {
          isLoopDragging = false;
          waveWrapper.releasePointerCapture(ev.pointerId);
        } else if (dragTrackId === t.id) {
          waveWrapper.releasePointerCapture(ev.pointerId);
          dragTrackId = null;
        }
      };
    });
  }

  function toggleTracksMode() {
    tracksModeActive = !tracksModeActive;
    if (tracksModeActive) {
      stopPlaybackSilent();
      saveActiveTrackState();
      if (tracksToggleBtn) tracksToggleBtn.classList.add("active");
      if (multiTrackContainer) {
        multiTrackContainer.classList.remove("hidden");
        renderTrackLanes();
      }
      setStatus("Multi-Track View Expanded", 1500);
    } else {
      loadActiveTrackState();
      if (tracksToggleBtn) tracksToggleBtn.classList.remove("active");
      if (multiTrackContainer) {
        multiTrackContainer.classList.add("hidden");
      }
      updateUI();
      setStatus(`Returned to: ${tracks[activeTrackIndex].name || 'Track ' + (activeTrackIndex + 1)}`, 1200);
    }
  }

  function bounceMultiTrackMixdown() {
    if (!audioCtx) initAudioContext();
    const sr = audioCtx.sampleRate;
    const totalDur = getPlaylistDuration();
    if (totalDur <= 10 && tracks.every(t => !t.buffer)) {
      setStatus("No audio loaded on any tracks", 1500);
      return;
    }

    setStatus("Bouncing mixdown...");
    
    // Check if there are active soloed tracks
    const hasSolo = tracks.some(t => t.soloed && t.buffer);

    setTimeout(async () => {
      try {
        const totalSamples = Math.ceil(totalDur * sr);
        const mixdown = new Float32Array(totalSamples);

        tracks.forEach((t) => {
          if (!t.buffer) return;
          if (t.muted && !t.soloed) return;
          if (hasSolo && !t.soloed) return;

          const startIdx = Math.floor(t.offset * sr);
          const volume = t.volume;

          for (let i = 0; i < t.buffer.length; i++) {
            if (startIdx + i < mixdown.length) {
              mixdown[startIdx + i] += t.buffer[i] * volume;
            }
          }
        });

        // Normalize mixdown to prevent clipping
        let peak = 0;
        for (let i = 0; i < mixdown.length; i++) {
          const a = Math.abs(mixdown[i]);
          if (a > peak) peak = a;
        }
        if (peak > 1.0) {
          for (let i = 0; i < mixdown.length; i++) mixdown[i] /= peak;
        }

        // Load into active track
        await saveState(); // Save state so bounce can be undone
        current = mixdown;
        loopStart = 0;
        loopEnd = 0;
        zoomStart = 0.0;
        zoomEnd = 1.0;
        detectedTransients = [];
        sliceModeActive = false;

        // Save back to track object
        if (tracks[activeTrackIndex]) {
          tracks[activeTrackIndex].name = "Bounced Mix";
          saveActiveTrackState();
        }

        // Toggle back to Single-Track mode
        tracksModeActive = false;
        if (tracksToggleBtn) tracksToggleBtn.classList.remove("active");
        if (multiTrackContainer) {
          multiTrackContainer.classList.add("hidden");
        }

        updateUI();
        await saveAudioToDB(current);
        setStatus(`Mixdown Bounced to Track ${activeTrackIndex + 1}`, 2500);
      } catch (err) {
        console.error("Mixdown error:", err);
        setStatus("Mixdown failed", 2000);
      }
    }, 100);
  }
  /* ============================================================================================= */

  function setupMultiTrackToggle() {
    if (tracksToggleBtn) {
      tracksToggleBtn.onclick = () => {
        toggleTracksMode();
      };
    }

    // Set up click listeners for the floating track tabs
    const tabs = document.querySelectorAll(".track-tab");
    tabs.forEach((tab) => {
      tab.onclick = () => {
        const targetIdx = parseInt(tab.dataset.index);
        if (targetIdx === activeTrackIndex) return;

        stopPlaybackSilent();
        saveActiveTrackState();
        activeTrackIndex = targetIdx;
        focusedTrackId = targetIdx + 1;
        loadActiveTrackState();
        updateUI();
        setStatus(`Editing track: ${tracks[activeTrackIndex].name || 'Track ' + (activeTrackIndex + 1)}`, 1500);
      };
    });
  }

  /* ======= Init ======= */
  async function init() {
    // Initialize AudioContext on first user interaction
    document.addEventListener("click", initAudioContext, { once: true });

    resizeCanvases();
    window.addEventListener("resize", resizeCanvases);
    requestAnimationFrame(drawLoop);
    setupOverlayInteraction();
    setupMinimapInteraction();
    setupModal();
    setupProcessorsPopup();
    setupSliceMode();
    setupMultiTrackToggle();
    setupSliceToolbar();

    // Restore sample browser folder from localStorage
    if (window.electron && typeof window.electron.readSampleFolder === "function") {
      const savedPath = localStorage.getItem("lastSampleFolderPath");
      if (savedPath) {
        try {
          const result = await window.electron.readSampleFolder(savedPath);
          if (result) {
            userFolderSamples = result.files;
            userFolderName = result.folderName;
            const folderLabel = document.getElementById("currentFolderName");
            if (folderLabel) {
              folderLabel.textContent = `📁 ${userFolderName} (${userFolderSamples.length} files)`;
            }
          }
        } catch (err) {
          console.error("Failed to restore sample folder:", err);
        }
      }
    }

    try {
      setStatus("Checking for saved audio...");
      const savedAudio = await loadAudioFromDB();
      if (savedAudio && savedAudio.length > 0) {
        // Sanity check: ensure the audio isn't completely corrupted (NaN/Infinity)
        // Check a sample in the middle to avoid edge cases
        const midSample = savedAudio[Math.floor(savedAudio.length / 2)];
        if (Number.isNaN(midSample) || !isFinite(midSample)) {
          console.warn("Corrupted audio buffer detected (NaN/Infinity) from previous save. Resetting buffer.");
          current = null;
          setStatus("Ready - Load an audio file to begin");
        } else {
          current = savedAudio;
          history = [savedAudio.slice()];
          historyIndex = 0;
          tracks[0].name = "Restored Audio";
          saveActiveTrackState();
          updateUI();
          setStatus("Restored previous audio", 1200);
        }
      } else {
        setStatus("Ready - Load an audio file to begin");
      }
    } catch (err) {
      console.error("Could not load from DB:", err);
      setStatus("Ready - Load an audio file to begin");
    }
  }

  /**
   * NEW: Sets up a one-time event listener to resume the AudioContext on the next user interaction.
   * This is crucial for mobile devices where the context can be suspended automatically.
   */
  function armAudioResume() {
    const resumeHandler = async () => {
      if (audioCtx && audioCtx.state === "suspended") {
        try {
          await audioCtx.resume();
        } catch (e) {
          console.error("Error resuming AudioContext:", e);
        }
      }
    };
    // Use capture to ensure this fires first, and once to automatically remove the listener.
    document.body.addEventListener("click", resumeHandler, {
      once: true,
      capture: true,
    });
    document.body.addEventListener("touchend", resumeHandler, {
      once: true,
      capture: true,
    });
  }

  /**
   * MODIFIED: Now includes a statechange listener to detect and handle audio interruptions.
   */
  function initAudioContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      console.log(
        "AudioContext initialized, sample rate:",
        audioCtx.sampleRate
      );

      // Setup analyser node
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512; // 256 frequency bins
      analyser.connect(audioCtx.destination);

      // Listen for state changes (e.g., when headphones are unplugged)
      audioCtx.addEventListener("statechange", () => {
        console.log("AudioContext state is now:", audioCtx.state);
        if (audioCtx.state === "suspended") {
          setStatus("Audio paused. Interact to resume.", 0); // Persistent message
          armAudioResume();
        } else if (audioCtx.state === "running") {
          // Clear the "paused" message if it's showing
          if (statusEl.textContent.startsWith("Audio paused")) {
            setStatus("Audio resumed", 1200);
          }
        }
      });
    }

    // This initial resume attempt is still important
    if (audioCtx.state === "suspended") {
      audioCtx.resume().then(() => {
        console.log("AudioContext resumed on initial load");
      });
    }
  }

  /* ======= Canvas & UI Helpers ======= */
  function resizeCanvases() {
    const contexts = [ctx, octx];
    if (mctx) contexts.push(mctx);
    let resized = false;
    contexts.forEach((c) => {
      const canvasEl = c.canvas;
      const targetW = canvasEl.offsetWidth * devicePixelRatio;
      const targetH = canvasEl.offsetHeight * devicePixelRatio;
      if (canvasEl.width !== targetW || canvasEl.height !== targetH) {
        c.setTransform(1, 0, 0, 1, 0, 0);
        canvasEl.width = targetW;
        canvasEl.height = targetH;
        c.scale(devicePixelRatio, devicePixelRatio);
        resized = true;
      }
    });
    return resized;
  }
  function setStatus(text, ms = 1200) {
    statusEl.textContent = text;
    if (ms > 0) {
      clearTimeout(setStatus._t);
      setStatus._t = setTimeout(() => {
        if (statusEl.textContent === text) statusEl.textContent = "Ready";
      }, ms);
    }
  }

  /* ======= File Loading & Drag-and-Drop ======= */
  async function decodeAndLoadAudioBuffer(arrayBuffer, filename) {
    setStatus("Loading " + filename + "...");
    stopPlayback();
    try {
      if (!audioCtx) initAudioContext();
      if (audioCtx.state === "suspended") await audioCtx.resume();

      const decoded = await audioCtx.decodeAudioData(arrayBuffer);

      const len = decoded.length;
      const samp = new Float32Array(len);

      if (decoded.numberOfChannels === 1) {
        samp.set(decoded.getChannelData(0));
      } else {
        const L = decoded.getChannelData(0),
          R = decoded.getChannelData(1);
        for (let i = 0; i < len; i++) samp[i] = (L[i] + R[i]) * 0.5;
      }

      current = samp;
      history = [];
      historyIndex = -1;
      loopStart = 0;
      loopEnd = 0;
      zoomStart = 0.0;
      zoomEnd = 1.0;
      if (tracks[activeTrackIndex]) {
        tracks[activeTrackIndex].name = filename;
      }
      updateUI();
      await saveState();
      setStatus("Loaded: " + filename, 2000);
    } catch (err) {
      console.error("Error decoding audio data:", err);
      setStatus("Error: " + err.message, 3000);
      alert(
        "Error decoding audio data: " +
          err.message +
          "\n\nPlease check the browser console (F12) for more details."
      );
    }
  }

  async function handleAudioFile(file) {
    if (!file) {
      setStatus("No file selected", 800);
      return;
    }
    try {
      const ab = await file.arrayBuffer();
      await decodeAndLoadAudioBuffer(ab, file.name);
    } catch (err) {
      console.error("Error loading file:", err);
      setStatus("Error: " + err.message, 3000);
    }
  }

  loadBtn.onclick = () => {
    initAudioContext();
    openSampleBrowser();
  };

  // Setup Drag & Drop File Loading
  const dropZone = document.getElementById("dropZone");
  if (dropZone) {
    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.classList.add("drag-hover");
    });
    dropZone.addEventListener("dragleave", () => {
      dropZone.classList.remove("drag-hover");
    });
    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropZone.classList.remove("drag-hover");
      initAudioContext();
      const file = e.dataTransfer.files[0];
      if (file) {
        handleAudioFile(file);
      }
    });
  }

  /* ======= History & State ======= */
  async function saveState() {
    if (!current) return;
    history = history.slice(0, historyIndex + 1);
    history.push(current.slice());
    historyIndex++;
    if (history.length > 50) {
      history.shift();
      historyIndex--;
    }
    try {
      await saveAudioToDB(current);
      saveActiveTrackState();
    } catch (err) {
      console.error("Failed to save state:", err);
      setStatus("Save failed", 1000);
    }
  }
  undoBtn.onclick = async () => {
    if (historyIndex > 0) {
      historyIndex--;
      current = history[historyIndex].slice();
      unfadedBuffer = null;
      saveActiveTrackState();
      updateUI();
      setStatus("Undo");
      await saveAudioToDB(current);
    } else setStatus("Nothing to undo", 600);
  };
  redoBtn.onclick = async () => {
    if (historyIndex < history.length - 1) {
      historyIndex++;
      current = history[historyIndex].slice();
      unfadedBuffer = null;
      saveActiveTrackState();
      updateUI();
      setStatus("Redo");
      await saveAudioToDB(current);
    } else setStatus("Nothing to redo", 600);
  };

  /* ======= Progress UI & Conversion Functions ======= */
  let progressState = { fraction: 0, label: "" };
  function renderProgress() {
    const percent = Math.round((progressState.fraction || 0) * 100);
    progressBarFill.style.width = percent + "%";
    progressBarText.textContent = percent + "%";
  }
  function glitchProgressStart(label = "Processing...", duration = 900) {
    progressState.label = label;
    progressState.fraction = 0;
    glitchBox.classList.add("show");
    renderProgress();
    
    if (duration > 0) {
      const start = performance.now();
      function tick(now) {
        const t = now - start;
        const frac = Math.min(1, t / duration);
        progressState.fraction = frac;
        renderProgress();
        if (frac < 1) requestAnimationFrame(tick);
        else
          setTimeout(() => {
            glitchBox.classList.remove("show");
          }, 120);
      }
      requestAnimationFrame(tick);
    }
  }
  
  function glitchProgressUpdate(label, percentOrFraction) {
    progressState.label = label;
    if (percentOrFraction > 1) {
       progressState.fraction = percentOrFraction / 100;
    } else {
       progressState.fraction = percentOrFraction;
    }
    renderProgress();
  }
  
  function glitchProgressStop() {
    progressState.fraction = 1;
    renderProgress();
    setTimeout(() => {
      glitchBox.classList.remove("show");
    }, 120);
  }

  function f32ToInt16Buffer(float32) {
    const buf = new ArrayBuffer(float32.length * 2);
    const dv = new DataView(buf);
    for (let i = 0, o = 0; i < float32.length; i++, o += 2) {
      let v = Math.max(-1, Math.min(1, float32[i]));
      dv.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7fff, true);
    }
    return buf;
  }
  function int16BufferToF32(buf) {
    const dv = new DataView(buf);
    const len = dv.byteLength / 2;
    const out = new Float32Array(len);
    for (let i = 0, o = 0; i < len; i++, o += 2) {
      out[i] = dv.getInt16(o, true) / 0x7fff;
    }
    return out;
  }

  /* ======= Core Processing Logic ======= */
  function createAutomationProxy(opts, rLength, configControls) {
    const proxyOpts = {};
    const readCounters = {};

    // Copy all basic fields
    for (const key in opts) {
      if (!key.endsWith("_automation")) {
        proxyOpts[key] = opts[key];
      }
    }

    // Wrap range controls in getters if they have automation
    for (const key in configControls) {
      const ctrl = configControls[key];
      // Skip select controls or non-range parameters
      if (ctrl.type === "select") continue;

      const autoType = opts[`${key}_automation`] || "none";
      if (autoType === "none") {
        proxyOpts[key] = opts[key];
        continue;
      }

      const val = opts[key];
      const min = ctrl.min;
      const max = ctrl.max;
      readCounters[key] = 0;

      Object.defineProperty(proxyOpts, key, {
        get: () => {
          const count = readCounters[key];
          readCounters[key] = count + 1;
          const t = Math.min(1.0, count / (rLength || 1));
          
          switch (autoType) {
            case "ramp-up":
              return min + (val - min) * t;
            case "ramp-down":
              return val - (val - min) * t;
            case "lfo-slow":
              return min + (val - min) * (0.5 + 0.5 * Math.sin(t * Math.PI * 4));
            case "lfo-fast":
              return min + (val - min) * (0.5 + 0.5 * Math.sin(t * Math.PI * 24));
            case "chaos":
              return min + (val - min) * Math.random();
            default:
              return val;
          }
        },
        configurable: true,
        enumerable: true
      });
    }

    return proxyOpts;
  }

  function applybend(fn, opts) {
    if (!current) {
      setStatus("Load a file first", 800);
      return;
    }
    if (!audioCtx) initAudioContext();

    const sr = audioCtx.sampleRate;
    const hasLoop = loopEnd > loopStart && loopEnd - loopStart > 0.02;
    const startSample = hasLoop ? Math.floor(loopStart * sr) : 0;
    const endSample = hasLoop ? Math.floor(loopEnd * sr) : current.length;
    const regionLen = endSample - startSample;

    // Create automated options proxy if a modal is active
    let automatedOpts = { ...opts, sr };
    if (currentModal && currentModal.controls) {
      automatedOpts = createAutomationProxy(opts, regionLen, currentModal.controls);
      automatedOpts.sr = sr;
    }

    if (isAuditionMode) {
      try {
        const region = current.slice(startSample, endSample);

        let oldPeak = 0;
        let oldSumSq = 0;
        for (let i = 0; i < region.length; i++) {
          const a = Math.abs(region[i]);
          if (a > oldPeak) oldPeak = a;
          oldSumSq += a * a;
        }
        const oldRms = region.length > 0 ? Math.sqrt(oldSumSq / region.length) : 1e-6;
        oldPeak = Math.max(oldPeak, 1e-6);

        const processed = fn(region, automatedOpts);

        let newPeak = 0;
        let newSumSq = 0;
        for (let i = 0; i < processed.length; i++) {
          const a = Math.abs(processed[i]);
          if (a > newPeak) newPeak = a;
          newSumSq += a * a;
        }
        const newRms = processed.length > 0 ? Math.sqrt(newSumSq / processed.length) : 1e-6;
        newPeak = Math.max(newPeak, 1e-6);

        // Auto-gain using RMS (Perceived Loudness)
        // Cap scale to 12.0x to prevent noise blowouts on very quiet signals
        const scale = Math.min(oldRms / Math.max(newRms, 1e-6), 12.0);
        if (isFinite(scale) && Math.abs(scale - 1) > 0.001 && scale > 0) {
          for (let i = 0; i < processed.length; i++) processed[i] *= scale;
        }
        for (let i = 0; i < processed.length; i++)
          processed[i] = Math.max(-1.0, Math.min(1.0, processed[i]));

        playAuditionBuffer(processed);
      } catch (err) {
        console.error("Audition DSP err", err);
      }
      return;
    }

    if (playing) stopPlaybackSilent();

    glitchProgressStart(opts.label || "Processing...", opts.duration || 900);

    setTimeout(async () => {
      try {
        await saveState();
        const region = current.slice(startSample, endSample);

        unfadedBuffer = null;
        fadeInLength = 0;
        fadeOutLength = 0;
        
        saveState();

        let oldPeak = 0;
        let oldSumSq = 0;
        for (let i = 0; i < region.length; i++) {
          const a = Math.abs(region[i]);
          if (a > oldPeak) oldPeak = a;
          oldSumSq += a * a;
        }
        const oldRms = region.length > 0 ? Math.sqrt(oldSumSq / region.length) : 1e-6;
        oldPeak = Math.max(oldPeak, 1e-6);

        const processed = fn(region, automatedOpts);

        let newPeak = 0;
        let newSumSq = 0;
        for (let i = 0; i < processed.length; i++) {
          const a = Math.abs(processed[i]);
          if (a > newPeak) newPeak = a;
          newSumSq += a * a;
        }
        const newRms = processed.length > 0 ? Math.sqrt(newSumSq / processed.length) : 1e-6;
        newPeak = Math.max(newPeak, 1e-6);

        // Auto-gain using RMS (Perceived Loudness)
        // Cap scale to 12.0x to prevent noise blowouts on very quiet signals
        const scale = Math.min(oldRms / Math.max(newRms, 1e-6), 12.0);
        if (isFinite(scale) && Math.abs(scale - 1) > 0.001 && scale > 0) {
          for (let i = 0; i < processed.length; i++) processed[i] *= scale;
        }
        for (let i = 0; i < processed.length; i++)
          processed[i] = Math.max(-1.0, Math.min(1.0, processed[i]));

        const partBefore = current.slice(0, startSample);
        const partAfter = current.slice(endSample);
        const newBuffer = new Float32Array(
          partBefore.length + processed.length + partAfter.length
        );
        newBuffer.set(partBefore, 0);
        newBuffer.set(processed, partBefore.length);
        newBuffer.set(partAfter, partBefore.length + processed.length);
        newBuffer.set(partAfter, partBefore.length + processed.length);
        current = newBuffer;
        
        // Reset fades since they are now baked into the audio
        fadeInLength = 0;
        fadeOutLength = 0;

        updateUI();
        await saveAudioToDB(current);
        setStatus("Processed", 900);
      } catch (err) {
        console.error("applybend err", err);
        setStatus("Error", 1200);
      }
    }, 50);
  }

  /* ======= Modal Logic ======= */
  let currentModal = { controls: {}, callback: null };

  function getModalValues() {
    const values = {};
    for (const key in currentModal.controls) {
      const id = `modal-control-${key}`;
      const input = document.getElementById(id);
      if (input) {
        if (input.type === "range") {
          values[key] = parseFloat(input.value);
          const autoSelect = document.getElementById(`${id}-automation`);
          if (autoSelect) {
            values[`${key}_automation`] = autoSelect.value;
          }
        } else if (input.tagName === "SELECT") {
          values[key] = input.value;
        }
      }
    }
    return values;
  }

  function setupModal() {
    modalCancel.onclick = (e) => {
      if (e) e.stopPropagation();
      hideModal();
    };
    modalOverlay.onclick = (e) => {
      if (e.target === modalOverlay) hideModal();
    };
    modalCommit.onclick = () => {
      auditioning = false;
      if (modalAudition) modalAudition.classList.remove("active");
      stopAuditionPlayback();

      if (currentModal.callback) {
        const values = getModalValues();
        currentModal.callback(values);
      }
      hideModal();
      
      const procMenu = document.getElementById("procMenu");
      if (procMenu) {
        procMenu.classList.remove("show");
        procMenu.setAttribute("aria-hidden", "true");
      }
    };
    modalRandom.onclick = () => {
      for (const key in currentModal.controls) {
        const c = currentModal.controls[key];
        const id = `modal-control-${key}`;
        const input = document.getElementById(id);
        const valueDisplay = document.getElementById(`${id}-value`);
        if (input && input.type === "range") {
          const min = parseFloat(c.min),
            max = parseFloat(c.max),
            step = parseFloat(c.step) || 1;
          const range = (max - min) / step;
          const rVal = min + Math.floor(Math.random() * (range + 1)) * step;
          input.value = rVal;
          if (valueDisplay)
            valueDisplay.textContent = rVal.toFixed(step < 1 ? 2 : 0);
          
          const autoSelect = document.getElementById(`${id}-automation`);
          if (autoSelect) {
            autoSelect.value = "none";
          }
        }
      }
      if (auditioning) {
        const values = getModalValues();
        isAuditionMode = true;
        currentModal.callback(values);
        isAuditionMode = false;
      }
    };

    if (modalAudition) {
      modalAudition.onclick = () => {
        auditioning = !auditioning;
        if (auditioning) {
          stopPlaybackSilent();
          modalAudition.classList.add("active");
          const values = getModalValues();
          isAuditionMode = true;
          currentModal.callback(values);
          isAuditionMode = false;
        } else {
          modalAudition.classList.remove("active");
          stopAuditionPlayback();
        }
      };
    }
  }

  function customConfirm(message) {
    return new Promise((resolve) => {
      const overlay = document.getElementById("confirmOverlay");
      const msgEl = document.getElementById("confirmMessage");
      const okBtn = document.getElementById("confirmOkBtn");
      const cancelBtn = document.getElementById("confirmCancelBtn");
      
      msgEl.textContent = message;
      overlay.classList.add("show");
      
      const cleanup = () => {
        overlay.classList.remove("show");
        okBtn.onclick = null;
        cancelBtn.onclick = null;
      };
      
      okBtn.onclick = () => {
        cleanup();
        resolve(true);
      };
      
      cancelBtn.onclick = () => {
        cleanup();
        resolve(false);
      };
    });
  }

  function showModal(config) {
    if (!current) {
      setStatus("Load a file first", 800);
      return;
    }
    if (!audioCtx) initAudioContext();
    currentModal = config;
    modalTitle.textContent = config.title;
    modalContent.innerHTML = "";

    auditioning = false;
    if (modalAudition) modalAudition.classList.remove("active");
    stopAuditionPlayback();

    for (const key in config.controls) {
      const c = config.controls[key];
      const id = `modal-control-${key}`;
      const controlWrapper = document.createElement("div");
      controlWrapper.className = "modal-control";
      let controlHTML = "";

      if (c.type === "select") {
        const options = c.options
          .map((opt) => `<option value="${opt.value}">${opt.label}</option>`)
          .join("");
        controlHTML = `<div class="control-label">${c.label}</div><select id="${id}">${options}</select>`;
      } else {
        const labelHTML = `<div class="control-label">${c.label}<span class="value-display" id="${id}-value">${c.defaultValue}</span></div>`;
        const inputHTML = `
          <div class="slider-automation-wrapper">
            <input type="range" id="${id}" min="${c.min}" max="${c.max}" step="${c.step || 1}" value="${c.defaultValue}">
            <select id="${id}-automation" class="automation-select" title="Parameter Automation Mode">
              <option value="none">Static</option>
              <option value="ramp-up">↗ Ramp Up</option>
              <option value="ramp-down">↘ Ramp Down</option>
              <option value="lfo-slow">∿ LFO (Slow)</option>
              <option value="lfo-fast">∿ LFO (Fast)</option>
              <option value="chaos">⚅ Chaos</option>
            </select>
          </div>
        `;
        controlHTML = labelHTML + inputHTML;
      }

      controlWrapper.innerHTML = controlHTML;
      modalContent.appendChild(controlWrapper);

      if (c.type === "select") {
        const select = document.getElementById(id);
        if (select) {
          select.onchange = () => {
            if (auditioning) {
              const values = getModalValues();
              isAuditionMode = true;
              config.callback(values);
              isAuditionMode = false;
            }
          };
        }
      } else {
        const input = document.getElementById(id),
          vDisplay = document.getElementById(`${id}-value`),
          autoSelect = document.getElementById(`${id}-automation`);
        if (input && vDisplay) {
          input.oninput = () => {
            vDisplay.textContent = parseFloat(input.value).toFixed(
              c.step < 1 ? 2 : 0
            );
            if (auditioning) {
              const values = getModalValues();
              isAuditionMode = true;
              config.callback(values);
              isAuditionMode = false;
            }
          };
        }
        if (autoSelect) {
          autoSelect.onchange = () => {
            if (auditioning) {
              const values = getModalValues();
              isAuditionMode = true;
              config.callback(values);
              isAuditionMode = false;
            }
          };
        }
      }
    }
    modalOverlay.classList.add("show");
  }

  function hideModal() {
    auditioning = false;
    if (modalAudition) modalAudition.classList.remove("active");
    stopAuditionPlayback();
    modalOverlay.classList.remove("show");
  }

  /* ======= WAVELET IMPLEMENTATION START ======= */

  const waveletBases = {
    haar: {
      dec: [1 / Math.sqrt(2), 1 / Math.sqrt(2)],
      rec: [1 / Math.sqrt(2), 1 / Math.sqrt(2)],
    },
    db4: {
      // Daubechies 4
      dec: [
        0.4829629131445341, 0.8365163037378079, 0.2241438680420134,
        -0.12940952255126034,
      ],
      rec: [
        -0.12940952255126034, -0.2241438680420134, 0.8365163037378079,
        -0.4829629131445341,
      ],
    },
    db8: {
      // Daubechies 8
      dec: [
        0.230377813308895, 0.714846570552915, 0.630880767929859,
        -0.027983769416859, -0.187034811719093, 0.030841381835561,
        0.032883011666885, -0.010597401785069,
      ],
      rec: [
        -0.010597401785069, -0.032883011666885, 0.030841381835561,
        0.187034811719093, -0.027983769416859, -0.630880767929859,
        0.714846570552915, -0.230377813308895,
      ],
    },
    sine: {
      // Custom Sine Basis for STFT-like effects
      // This is a placeholder; a true sine transform is different.
      // We'll simulate with a simple high/low pass filter.
      dec: [0.5, 0.5, 0.5, 0.5],
      rec: [0.5, 0.5, 0.5, 0.5],
    },
  };

  function getWaveletFilters(name) {
    const basis = waveletBases[name];
    if (!basis) throw new Error("Unknown wavelet: " + name);

    const h = basis.dec; // Low-pass decomposition
    const g = h
      .slice()
      .reverse()
      .map((v, i) => (i % 2 === 0 ? -v : v)); // High-pass decomposition
    const h_rec = basis.rec; // Low-pass reconstruction
    const g_rec = h_rec
      .slice()
      .reverse()
      .map((v, i) => (i % 2 === 1 ? -v : v)); // High-pass reconstruction

    return { h, g, h_rec, g_rec };
  }

  function convolve(signal, filter) {
    const len = signal.length;
    const fLen = filter.length;
    const output = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      let sum = 0;
      for (let j = 0; j < fLen; j++) {
        // periodic boundary extension
        const index = (i + j) % len;
        sum += signal[index] * filter[j];
      }
      output[i] = sum;
    }
    return output;
  }

  function downsample(signal) {
    const out = new Float32Array(signal.length / 2);
    for (let i = 0; i < out.length; i++) {
      out[i] = signal[i * 2];
    }
    return out;
  }

  function upsample(signal, len) {
    const out = new Float32Array(len);
    for (let i = 0; i < signal.length; i++) {
      out[i * 2] = signal[i];
    }
    return out;
  }

  function dwt(signal, basisName = "haar") {
    const { h, g } = getWaveletFilters(basisName);
    let coeffs = [];
    let approx = signal;

    while (approx.length >= h.length) {
      const approx_conv = convolve(approx, h);
      const detail_conv = convolve(approx, g);

      const approx_down = downsample(approx_conv);
      const detail_down = downsample(detail_conv);

      coeffs.unshift(detail_down);
      approx = approx_down;
    }
    coeffs.unshift(approx);
    return coeffs;
  }

  function idwt(coeffs, basisName = "haar") {
    const { h_rec, g_rec } = getWaveletFilters(basisName);
    let approx = coeffs[0];

    for (let i = 1; i < coeffs.length; i++) {
      const detail = coeffs[i];
      const targetLen = approx.length + detail.length;

      const approx_up = upsample(approx, targetLen);
      const detail_up = upsample(detail, targetLen);

      const approx_conv = convolve(approx_up, h_rec);
      const detail_conv = convolve(detail_up, g_rec);

      const reconstructed = new Float32Array(targetLen);
      for (let j = 0; j < targetLen; j++) {
        reconstructed[j] = approx_conv[j] + detail_conv[j];
      }
      approx = reconstructed;
    }
    return approx;
  }

  function padToPowerOfTwo(signal) {
    const L = signal.length;
    const targetL = Math.pow(2, Math.ceil(Math.log2(L)));
    if (L === targetL) return signal;

    const padded = new Float32Array(targetL);
    padded.set(signal);
    return padded;
  }

  // Wavelet processor wrapper
  function applyWaveletBend(processorFn, opts, region) {
    const originalLength = region.length;
    const paddedSignal = padToPowerOfTwo(region);

    let coeffs = dwt(paddedSignal, opts.basis);
    coeffs = processorFn(coeffs, opts);
    let processedSignal = idwt(coeffs, opts.basis);

    // Truncate back to original length
    return processedSignal.slice(0, originalLength);
  }

  const waveletBasisOptions = [
    { value: "haar", label: "Haar (Blocky)" },
    { value: "db4", label: "Daubechies-4" },
    { value: "db8", label: "Daubechies-8" },
    { value: "sine", label: "Sine-Basis (Tonal)" },
  ];

  /* ======= WAVELET EFFECTS ENGINE ======= */

  function applyWaveletChronoSplit(opts) {
    applybend((region) => {
      return applyWaveletBend((coeffs, o) => {
        // o.level (1-8) targets from the highest resolution detail downwards
        const lvl = Math.max(1, coeffs.length - o.level);
        if (coeffs[lvl]) {
          const detail = coeffs[lvl].slice();
          detail.reverse();
          for (let i = 0; i < detail.length; i++) {
            coeffs[lvl][i] = (detail[i] * o.mix) + (coeffs[lvl][i] * (1 - o.mix));
          }
        }
        return coeffs;
      }, opts, region);
    }, { label: "Wavelet Chrono Split..." });
  }

  function applyWaveletBandFolder(opts) {
    applybend((region) => {
      return applyWaveletBend((coeffs, o) => {
        const lvl = Math.max(1, coeffs.length - o.level);
        if (coeffs[lvl]) {
          for (let i = 0; i < coeffs[lvl].length; i++) {
            let v = coeffs[lvl][i] * o.gain;
            for (let f = 0; f < o.folds; f++) {
              v = Math.abs(Math.abs(v) - 1);
            }
            coeffs[lvl][i] = (v * 2 - 1) / o.gain;
          }
        }
        return coeffs;
      }, opts, region);
    }, { label: "Wavelet Band Folding..." });
  }

  function applyWaveletQuantizer(opts) {
    applybend((region) => {
      return applyWaveletBend((coeffs, o) => {
        const steps = Math.pow(2, o.bits);
        
        // Highs: Target top 3 highest resolution detail bands
        // Lows: Target approximation and all lower resolution detail bands
        const splitPoint = Math.max(1, coeffs.length - 3);

        if (o.target === 1) { // Highs
          for (let i = splitPoint; i < coeffs.length; i++) {
            for (let j = 0; j < coeffs[i].length; j++) {
              coeffs[i][j] = Math.round(coeffs[i][j] * steps) / steps;
            }
          }
        } else { // Lows
          for (let i = 0; i < splitPoint; i++) {
            for (let j = 0; j < coeffs[i].length; j++) {
              coeffs[i][j] = Math.round(coeffs[i][j] * steps) / steps;
            }
          }
        }
        return coeffs;
      }, opts, region);
    }, { label: "Wavelet Resolution Splitting..." });
  }

  /* ======= WAVESET / CDP EFFECTS ENGINE ======= */

  /* ======= Processors ======= */
  bitcrushBtn.onclick = () =>
    showModal({
      title: "Bitcrush",
      controls: {
        bits: {
          label: "Bit Depth",
          min: 1,
          max: 16,
          step: 1,
          defaultValue: 8,
        },
      },
      callback: (opts) =>
        applybend(
          (r) => {
            const o = new Float32Array(r.length);
            for (let i = 0; i < r.length; i++) {
              const s = Math.pow(0.5, opts.bits - 1);
              o[i] = s * Math.floor(r[i] / s + 0.5);
            }
            return o;
          },
          { label: "BitCrushing..." }
        ),
    });
  foldBtn.onclick = () =>
    showModal({
      title: "Wavefolder",
      controls: {
        gain: { label: "Gain", min: 1, max: 50, step: 1, defaultValue: 10 },
        folds: {
          label: "Folds",
          min: 1,
          max: 20,
          step: 1,
          defaultValue: 5,
        },
      },
      callback: (opts) =>
        applybend(
          (r) => {
            const o = new Float32Array(r.length);
            for (let i = 0; i < r.length; i++) {
              let v = r[i] * opts.gain;
              for (let f = 0; f < opts.folds; f++)
                v = Math.abs(Math.abs(v) - 1);
              o[i] = (v * 2 - 1) / opts.gain;
            }
            return o;
          },
          { label: "Folding..." }
        ),
    });
  reverseBtn.onclick = () =>
    applybend(
      (r) => {
        const o = r.slice();
        o.reverse();
        return o;
      },
      { label: "Reversing..." }
    );
  ringBtn.onclick = () =>
    showModal({
      title: "Ring Modulator",
      controls: {
        freq: {
          label: "Freq (Hz)",
          min: 20,
          max: 5e3,
          step: 1,
          defaultValue: 440,
        },
        modDepth: {
          label: "Mod Depth",
          min: 0,
          max: 1,
          step: 0.01,
          defaultValue: 0.5,
        },
        modRate: {
          label: "Mod Rate (Hz)",
          min: 0.1,
          max: 20,
          step: 0.1,
          defaultValue: 2,
        },
      },
      callback: (opts) =>
        applybend(
          (r, { sr }) => {
            const o = new Float32Array(r.length);
            for (let i = 0; i < r.length; i++) {
              const t = i / sr,
                m = Math.sin(2 * Math.PI * opts.modRate * t) * opts.modDepth,
                cF = opts.freq * (1 + m * 0.5);
              o[i] = r[i] * Math.sin(2 * Math.PI * cF * t);
            }
            return o;
          },
          { label: "Ring Mod..." }
        ),
    });
  warpBtn.onclick = () =>
    showModal({
      title: "Bit Warp",
      controls: {
        warp: {
          label: "Warp",
          min: 1,
          max: 20,
          step: 0.1,
          defaultValue: 10,
        },
        mix: { label: "Mix", min: 0, max: 1, step: 0.01, defaultValue: 1 },
      },
      callback: (opts) =>
        applybend(
          (r) => {
            const o = new Float32Array(r.length);
            for (let i = 0; i < r.length; i++) {
              const x = r[i],
                s = Math.sign(x) * (1 - Math.exp(-Math.abs(x) * opts.warp)),
                w = Math.tanh(s * (1 + opts.warp / 10));
              o[i] = x * (1 - opts.mix) + w * opts.mix;
            }
            return o;
          },
          { label: "Bit Warping..." }
        ),
    });
  smearBtn.onclick = () =>
    showModal({
      title: "Spectral Smear",
      controls: {
        windowSize: {
          label: "Window Size",
          min: 256,
          max: 4096,
          step: 128,
          defaultValue: 1024,
        },
        jitter: {
          label: "Jitter",
          min: 0,
          max: 1,
          step: 0.01,
          defaultValue: 0.5,
        },
        mix: {
          label: "Mix",
          min: 0,
          max: 1,
          step: 0.01,
          defaultValue: 0.7,
        },
      },
      callback: (opts) =>
        applybend(
          (r) => {
            const l = r.length,
              wS = opts.windowSize,
              h = Math.floor(wS / 2),
              o = new Float32Array(l),
              w = new Float32Array(wS);
            for (let i = 0; i < wS; i++)
              w[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (wS - 1)));
            const a = new Float32Array(l),
              cs = new Float32Array(l);
            for (let p = 0; p < l; p += h) {
              const b = new Float32Array(wS);
              for (let i = 0; i < wS; i++)
                b[i] = r[Math.min(l - 1, p + i)] * w[i];
              const bs = 8,
                bSz = Math.floor(wS / bs),
                bB = new Float32Array(wS);
              for (let j = 0; j < bs; j++) {
                const s = j * bSz,
                  e = Math.min(wS, s + bSz),
                  jA = Math.floor((Math.random() - 0.5) * opts.jitter * bSz);
                for (let k = s; k < e; k++) {
                  const t = k + jA;
                  if (t >= 0 && t < wS) bB[t] += b[k] * 0.9;
                }
              }
              for (let i = 0; i < wS; i++) {
                const idx = Math.min(l - 1, p + i);
                a[idx] += bB[i] * w[i];
                cs[idx] += w[i] * w[i];
              }
            }
            for (let i = 0; i < l; i++)
              o[i] = cs[i] > 1e-6 ? a[i] / cs[i] : r[i];
            for (let i = 0; i < l; i++)
              o[i] = o[i] * opts.mix + r[i] * (1 - opts.mix);
            return o;
          },
          { label: "Smearing..." }
        ),
    });
  chebyBtn.onclick = () =>
    showModal({
      title: "Chebyshev",
      controls: {
        order: {
          label: "Order",
          min: 2,
          max: 32,
          step: 1,
          defaultValue: 8,
        },
        mix: {
          label: "Mix",
          min: 0,
          max: 1,
          step: 0.01,
          defaultValue: 0.5,
        },
      },
      callback: (opts) =>
        applybend(
          (r) => {
            const o = new Float32Array(r.length);
            for (let i = 0; i < r.length; i++) {
              const x = r[i];
              let T_p = 1,
                T_c = x;
              for (let k = 1; k < opts.order; k++) {
                let T_n = 2 * x * T_c - T_p;
                T_p = T_c;
                T_c = T_n;
              }
              o[i] = x * (1 - opts.mix) + T_c * opts.mix;
            }
            return o;
          },
          { label: "Warping..." }
        ),
    });
  combBtn.onclick = () =>
    showModal({
      title: "Feedback Comb",
      controls: {
        freq: {
          label: "Freq (Hz)",
          min: 30,
          max: 4e3,
          step: 1,
          defaultValue: 150,
        },
        feedback: {
          label: "Feedback",
          min: 0.1,
          max: 0.99,
          step: 0.01,
          defaultValue: 0.85,
        },
        mix: {
          label: "Mix",
          min: 0,
          max: 1,
          step: 0.01,
          defaultValue: 0.5,
        },
      },
      callback: (opts) =>
        applybend(
          (r, { sr }) => {
            const dS = Math.floor(sr / opts.freq),
              o = new Float32Array(r.length);
            for (let i = 0; i < r.length; i++) {
              const d = o[i - dS] || 0,
                p = r[i] + opts.feedback * d;
              o[i] = r[i] * (1 - opts.mix) + p * opts.mix;
            }
            return o;
          },
          { label: "Feedback..." }
        ),
    });
  tapeStopBtn.onclick = () =>
    showModal({
      title: "Tape Stop",
      controls: {
        duration: {
          label: "Duration (s)",
          min: 0.1,
          max: 5,
          step: 0.1,
          defaultValue: 1,
        },
        curve: {
          label: "Curve",
          min: 0.2,
          max: 5,
          step: 0.1,
          defaultValue: 2,
        },
      },
      callback: (opts) =>
        applybend(
          (r, { sr }) => {
            const len = r.length,
              o = new Float32Array(len),
              stopSamps = Math.min(len, Math.floor(opts.duration * sr));
            for (let i = 0; i < len; i++) {
              if (i < stopSamps) {
                const p = i / stopSamps,
                  pC = Math.pow(p, opts.curve),
                  sIdx = Math.floor(pC * (stopSamps - 1)),
                  vol = 1 - p;
                o[i] = r[sIdx] * vol;
              } else {
                o[i] = 0;
              }
            }
            return o;
          },
          { label: "Tape Stop..." }
        ),
    });
  melterBtn.onclick = () =>
    showModal({
      title: "Melter",
      controls: {
        chunkSize: {
          label: "Chunk Size",
          min: 4,
          max: 256,
          step: 4,
          defaultValue: 32,
        },
        feedback: {
          label: "Feedback",
          min: 0,
          max: 0.99,
          step: 0.01,
          defaultValue: 0.8,
        },
        mix: {
          label: "Mix",
          min: 0,
          max: 1,
          step: 0.01,
          defaultValue: 0.5,
        },
      },
      callback: (opts) =>
        applybend(
          (r) => {
            const o = new Float32Array(r.length);
            let fb = 0;
            for (let i = 0; i < r.length; i++) {
              const s = r[i];
              if (i % opts.chunkSize === 0) fb = 0;
              fb = s * 0.5 + fb * 0.5;
              o[i] = r[i] * (1 - opts.mix) + fb * opts.mix;
            }
            return o;
          },
          { label: "Melting..." }
        ),
    });

  // SPECTRAL ROTATOR LOGIC
  let spectralWorkerReady = false;
  if (spectralRotatorBtn) {
    spectralRotatorBtn.onclick = () => {
      if (!current) return setStatus("Load a file first", 800);
      if (!audioCtx) initAudioContext();
      
      const sr = audioCtx.sampleRate;
      const hasLoop = loopEnd > loopStart && loopEnd - loopStart > 0.02;
      const startSample = hasLoop ? Math.floor(loopStart * sr) : 0;
      const endSample = hasLoop ? Math.floor(loopEnd * sr) : current.length;
      const region = current.slice(startSample, endSample);

      glitchProgressStart("Initializing Spectral Rotator...", 0);

      const wavBlob = writeWAV(region, sr);
      wavBlob.arrayBuffer().then(buffer => {
        const sendProcess = (buf) => {
          setStatus("Sending data to Spectral Rotator...", 2000);
          window.spectralWorkerInstance.postMessage({
            type: 'PROCESS',
            payload: {
              fileBuffer: buf,
              effect: 'rotate',
              params: {}
            }
          }, [buf]);
        };

        if (!window.spectralWorkerInstance) {
          window.spectralWorkerInstance = window.createSpectralWorker();
          window.spectralWorkerInstance.onmessage = async (e) => {
            const { type, payload } = e.data;
            if (type === 'STATUS' && payload === 'READY') {
              spectralWorkerReady = true;
              sendProcess(buffer);
            } else if (type === 'PROGRESS') {
              setStatus(payload, 2000);
              glitchProgressUpdate(payload, Math.random() * 0.4 + 0.3);
            } else if (type === 'ERROR') {
              console.error("Spectral Rotator Error:", payload);
              setStatus("Error: " + payload, 3000);
              glitchProgressStop();
            } else if (type === 'RESULT') {
              try {
                const audioBuffer = await audioCtx.decodeAudioData(payload.buffer);
                const processed = audioBuffer.getChannelData(0);
                
                const partBefore = current.slice(0, startSample);
                const partAfter = current.slice(endSample);
                const newBuffer = new Float32Array(partBefore.length + processed.length + partAfter.length);
                newBuffer.set(partBefore, 0);
                newBuffer.set(processed, partBefore.length);
                newBuffer.set(partAfter, partBefore.length + processed.length);
                current = newBuffer;
                
                updateUI();
                await saveAudioToDB(current);
                setStatus("Spectral Rotation Complete", 2000);
                glitchProgressStop();
              } catch (err) {
                console.error("Decode error", err);
                setStatus("Decode error", 2000);
              }
            }
          };
          window.spectralWorkerInstance.postMessage({ type: 'INIT', payload: window.SPECTRAL_PYTHON_SCRIPT });
        } else {
          // Temporarily attach result handler for this specific run
          const oldOnMessage = window.spectralWorkerInstance.onmessage;
          window.spectralWorkerInstance.onmessage = async (e) => {
            const { type, payload } = e.data;
            if (type === 'PROGRESS') {
              setStatus(payload, 2000);
              glitchProgressUpdate(payload, Math.random() * 0.4 + 0.3);
            } else if (type === 'ERROR') {
              console.error("Spectral Rotator Error:", payload);
              setStatus("Error: " + payload, 3000);
              glitchProgressStop();
            } else if (type === 'RESULT') {
              try {
                const audioBuffer = await audioCtx.decodeAudioData(payload.buffer);
                const processed = audioBuffer.getChannelData(0);
                
                const partBefore = current.slice(0, startSample);
                const partAfter = current.slice(endSample);
                const newBuffer = new Float32Array(partBefore.length + processed.length + partAfter.length);
                newBuffer.set(partBefore, 0);
                newBuffer.set(processed, partBefore.length);
                newBuffer.set(partAfter, partBefore.length + processed.length);
                current = newBuffer;
                
                updateUI();
                await saveAudioToDB(current);
                setStatus("Spectral Rotation Complete", 2000);
                glitchProgressStop();
              } catch (err) {
                console.error("Decode error", err);
                setStatus("Decode error", 2000);
              }
              // Restore old handler
              window.spectralWorkerInstance.onmessage = oldOnMessage;
            }
          };
          if (spectralWorkerReady) {
            sendProcess(buffer);
          }
        }
      });
    };
  }

  // WAVESET K-MEANS LOGIC
  if (wavesetKMeansBtn) {
    wavesetKMeansBtn.onclick = () => {
      showModal({
        title: "Waveset K-Means Quantizer",
        controls: {
          segmentation: {
            type: "select",
            label: "Segmentation",
            options: [
              { value: "WAVESET", label: "Wavesets (Zero-Crossings)" },
              { value: "FFT", label: "FFT Windows" },
              { value: "DWT", label: "Wavelet Windows" }
            ],
            defaultValue: "WAVESET"
          },
          clustering: {
            type: "select",
            label: "Clustering Algorithm",
            options: [
              { value: "KMEANS", label: "K-Means++" },
              { value: "FCM", label: "Fuzzy C-Means" },
              { value: "BIRCH", label: "BIRCH (Fast)" },
              { value: "OPTICS", label: "OPTICS (Density)" },
              { value: "SPECTRAL", label: "Spectral Approximation" }
            ],
            defaultValue: "KMEANS"
          },
          clustersPerSecond: {
            label: "Clusters per Sec",
            min: 1,
            max: 20,
            step: 1,
            defaultValue: 8
          },
          featureWeight: {
            label: "Feature Weight",
            min: 0,
            max: 2.0,
            step: 0.1,
            defaultValue: 1.0
          }
        },
        callback: (values) => {
          if (!current) return setStatus("Load a file first", 800);
          if (!audioCtx) initAudioContext();

          const sr = audioCtx.sampleRate;
          const hasLoop = loopEnd > loopStart && loopEnd - loopStart > 0.02;
          const startSample = hasLoop ? Math.floor(loopStart * sr) : 0;
          const endSample = hasLoop ? Math.floor(loopEnd * sr) : current.length;
          const region = current.slice(startSample, endSample);
          
          const auditioning = isAuditionMode;

          if (!auditioning) {
            glitchProgressStart("Initializing K-Means...", 0);
          }

          const worker = window.createKMeansWorker();
          const rawData = new Float32Array(region);

          worker.onmessage = async (e) => {
            const { stage, progress, output, error } = e.data;
            if (error) {
              console.error(error);
              setStatus("K-Means Error", 2000);
              if (!auditioning) glitchProgressStop();
              worker.terminate();
              return;
            }

            if (output) {
              const processed = output;
              
              if (auditioning) {
                playAuditionBuffer(processed);
                worker.terminate();
                return;
              }

              // Normal commit mode
              await saveState();

              const newBuffer = new Float32Array(
                startSample + processed.length + (current.length - endSample)
              );
              newBuffer.set(current.subarray(0, startSample), 0);
              newBuffer.set(processed, startSample);
              newBuffer.set(current.subarray(endSample), startSample + processed.length);

              current = newBuffer;
              updateUI();
              // saveState already called saveAudioToDB, but we can do it again to ensure DB syncs `current`.
              // actually, saveState() saves BEFORE mutating current.
              await saveAudioToDB(current);
              
              setStatus("K-Means Processing Complete", 2000);
              glitchProgressStop();
              worker.terminate();
            } else {
              if (!auditioning) glitchProgressUpdate(stage, progress);
            }
          };

          worker.onerror = (err) => {
            console.error("K-Means Worker error:", err);
            setStatus("K-Means Worker Error", 2000);
            glitchProgressStop();
            worker.terminate();
          };

          worker.postMessage({
            rawData,
            params: {
              clustersPerSecond: values.clustersPerSecond,
              featureWeight: values.featureWeight,
              segmentation: values.segmentation,
              clustering: values.clustering
            },
            sampleRate: sr
          }, [rawData.buffer]);
        }
      });
    };
  }

  if (wsRepeatBtn) wsRepeatBtn.onclick = () =>
    showModal({
      title: "Waveset Repeat",
      controls: {
        repeats: { label: "Repeats", min: 1, max: 16, step: 1, defaultValue: 3 }
      },
      callback: (opts) => applyWsRepeat(opts)
    });

  if (wsOmitBtn) wsOmitBtn.onclick = () =>
    showModal({
      title: "Waveset Omit",
      controls: {
        step: { label: "Omit Step", min: 2, max: 8, step: 1, defaultValue: 2 }
      },
      callback: (opts) => applyWsOmit(opts)
    });

  if (wsReverseBtn) wsReverseBtn.onclick = () => applyWsReverse();

  if (wsScrambleBtn) wsScrambleBtn.onclick = () =>
    showModal({
      title: "Waveset Scramble",
      controls: {
        chunkSize: { label: "Chunk Size", min: 1, max: 32, step: 1, defaultValue: 8 }
      },
      callback: (opts) => applyWsScramble(opts)
    });

  if (wsMultiplyBtn) wsMultiplyBtn.onclick = () =>
    showModal({
      title: "Waveset Multiply",
      controls: {
        factor: { label: "Multiply Factor", min: 2, max: 16, step: 1, defaultValue: 2 }
      },
      callback: (opts) => applyWsMultiply(opts),
    });

  if (waveletChronoBtn) waveletChronoBtn.onclick = () =>
    showModal({
      title: "Wavelet Chrono-Split",
      controls: {
        basis: { type: "select", label: "Wavelet Basis", options: waveletBasisOptions },
        level: { label: "Target Level", min: 1, max: 8, step: 1, defaultValue: 2 },
        mix: { label: "Dry/Wet Mix", min: 0, max: 1, step: 0.05, defaultValue: 1.0 }
      },
      callback: (opts) => applyWaveletChronoSplit(opts)
    });

  if (waveletFoldBtn) waveletFoldBtn.onclick = () =>
    showModal({
      title: "Wavelet Band-Folder",
      controls: {
        basis: { type: "select", label: "Wavelet Basis", options: waveletBasisOptions },
        level: { label: "Target Level", min: 1, max: 8, step: 1, defaultValue: 3 },
        gain: { label: "Fold Gain", min: 1, max: 20, step: 0.1, defaultValue: 5.0 },
        folds: { label: "Max Folds", min: 1, max: 8, step: 1, defaultValue: 3 }
      },
      callback: (opts) => applyWaveletBandFolder(opts)
    });

  if (waveletQuantBtn) waveletQuantBtn.onclick = () =>
    showModal({
      title: "Wavelet Resolution Split",
      controls: {
        basis: { type: "select", label: "Wavelet Basis", options: waveletBasisOptions },
        target: { label: "Target Band (1=Highs, 0=Lows)", min: 0, max: 1, step: 1, defaultValue: 0 },
        bits: { label: "Bit Depth", min: 2, max: 16, step: 1, defaultValue: 4 }
      },
      callback: (opts) => applyWaveletQuantizer(opts)
    });

  if (wsDivideBtn) wsDivideBtn.onclick = () =>
    showModal({
      title: "Waveset Divide",
      controls: {
        factor: { label: "Divide Factor", min: 2, max: 16, step: 1, defaultValue: 2 }
      },
      callback: (opts) => applyWsDivide(opts)
    });

  if (wsAverageBtn) wsAverageBtn.onclick = () =>
    showModal({
      title: "Waveset Average",
      controls: {
        groupSize: { label: "Group Size", min: 2, max: 16, step: 1, defaultValue: 2 }
      },
      callback: (opts) => applyWsAverage(opts)
    });

  if (wsFilterBtn) wsFilterBtn.onclick = () =>
    showModal({
      title: "Waveset Length Filter",
      controls: {
        minLength: { label: "Min Length (smps)", min: 1, max: 500, step: 1, defaultValue: 10 },
        maxLength: { label: "Max Length (smps)", min: 10, max: 8000, step: 10, defaultValue: 2000 }
      },
      callback: (opts) => applyWsFilter(opts)
    });

  if (wsClipBtn) wsClipBtn.onclick = () =>
    showModal({
      title: "Waveset Amplitude Gate",
      controls: {
        threshold: { label: "Threshold", min: 0.01, max: 1.0, step: 0.01, defaultValue: 0.5 }
      },
      callback: (opts) => applyWsClip(opts)
    });

  if (granStretchBtn) granStretchBtn.onclick = () =>
    showModal({
      title: "Granular Time-Stretch",
      controls: {
        stretchFactor: { label: "Stretch Factor", min: 1.5, max: 10, step: 0.1, defaultValue: 2.0 },
        grainSize: { label: "Grain Size (ms)", min: 10, max: 200, step: 1, defaultValue: 50 }
      },
      callback: (opts) => applyGranularStretch(opts)
    });

  if (granPitchBtn) granPitchBtn.onclick = () =>
    showModal({
      title: "Granular Pitch-Shift",
      controls: {
        pitchShift: { label: "Pitch (Semitones)", min: -24, max: 24, step: 1, defaultValue: -12 },
        grainSize: { label: "Grain Size (ms)", min: 10, max: 200, step: 1, defaultValue: 50 }
      },
      callback: (opts) => applyGranularPitch(opts)
    });

  if (granFreezeBtn) granFreezeBtn.onclick = () =>
    showModal({
      title: "Granular Spectral Freeze",
      controls: {
        freezeSize: { label: "Freeze Size (ms)", min: 10, max: 500, step: 1, defaultValue: 100 },
        jitter: { label: "Jitter (%)", min: 0, max: 100, step: 1, defaultValue: 15 }
      },
      callback: (opts) => applyGranularFreeze(opts)
    });

  shredderBtn.onclick = () =>
    showModal({
      title: "Shredder",
      controls: {
        sliceDiv: {
          label: "Slice Divisor",
          min: 4,
          max: 64,
          step: 4,
          defaultValue: 16,
        },
        reps: {
          label: "Repetitions",
          min: 1,
          max: 16,
          step: 1,
          defaultValue: 4,
        },
        chance: {
          label: "Chance",
          min: 0,
          max: 1,
          step: 0.01,
          defaultValue: 0.5,
        },
      },
      callback: (opts) =>
        applybend(
          (r, { sr }) => {
            const o = new Float32Array(r.length),
              sliceLen = Math.floor(sr / opts.sliceDiv);
            for (let i = 0; i < r.length; i += sliceLen) {
              if (Math.random() < opts.chance) {
                const grain = r.slice(i, i + Math.floor(sliceLen / opts.reps));
                for (let j = 0; j < sliceLen && i + j < r.length; j++)
                  o[i + j] = grain[j % grain.length];
              } else {
                for (let j = 0; j < sliceLen && i + j < r.length; j++)
                  o[i + j] = r[i + j];
              }
            }
            return o;
          },
          { label: "Shredding..." }
        ),
    });
  filterBtn.onclick = () =>
    showModal({
      title: "Filter",
      controls: {
        type: {
          label: "Type (1=LP,-1=HP)",
          min: -1,
          max: 1,
          step: 2,
          defaultValue: 1,
        },
        freq: {
          label: "Freq (Hz)",
          min: 50,
          max: 15e3,
          step: 10,
          defaultValue: 2e3,
        },
        q: { label: "Q", min: 0.1, max: 30, step: 0.1, defaultValue: 1 },
      },
      callback: (opts) =>
        applybend(
          (r, { sr }) => {
            const o = new Float32Array(r.length);
            let x1 = 0,
              x2 = 0,
              y1 = 0,
              y2 = 0;
            for (let i = 0; i < r.length; i++) {
              const w0 = (2 * Math.PI * opts.freq) / sr,
                alpha = Math.sin(w0) / (2 * opts.q),
                cosw0 = Math.cos(w0);
              let b0, b1, b2, a0, a1, a2;
              if (opts.type > 0) {
                b0 = (1 - cosw0) / 2;
                b1 = 1 - cosw0;
                b2 = (1 - cosw0) / 2;
              } else {
                b0 = (1 + cosw0) / 2;
                b1 = -(1 + cosw0);
                b2 = (1 + cosw0) / 2;
              }
              a0 = 1 + alpha;
              a1 = -2 * cosw0;
              a2 = 1 - alpha;

              const x0 = r[i],
                y0 =
                  (b0 / a0) * x0 +
                  (b1 / a0) * x1 +
                  (b2 / a0) * x2 -
                  (a1 / a0) * y1 -
                  (a2 / a0) * y2;
              o[i] = y0;
              x2 = x1;
              x1 = x0;
              y2 = y1;
              y1 = y0;
            }
            return o;
          },
          { label: "Filtering..." }
        ),
    });
  phaserBtn.onclick = () =>
    showModal({
      title: "Phaser",
      controls: {
        rate: {
          label: "Rate (Hz)",
          min: 0.1,
          max: 10,
          step: 0.1,
          defaultValue: 1,
        },
        depth: {
          label: "Depth",
          min: 0.1,
          max: 1,
          step: 0.01,
          defaultValue: 0.7,
        },
        feedback: {
          label: "Feedback",
          min: 0,
          max: 0.9,
          step: 0.01,
          defaultValue: 0.5,
        },
      },
      callback: (opts) =>
        applybend(
          (r, { sr }) => {
            const o = new Float32Array(r.length),
              s = 4,
              ap = Array(s)
                .fill(0)
                .map(() => ({ z: 0 }));
            let fb = 0;
            for (let i = 0; i < r.length; i++) {
              const lfo = Math.sin(2 * Math.PI * opts.rate * (i / sr)),
                d = 0.5 * (1 + lfo) * opts.depth;
              let y = r[i] + fb * opts.feedback;
              for (let j = 0; j < s; j++) {
                const z = ap[j].z;
                ap[j].z = y * d + z * (1 - d);
                y = ap[j].z - y * d;
              }
              fb = y;
              o[i] = r[i] * 0.5 + y * 0.5;
            }
            return o;
          },
          { label: "Phasing..." }
        ),
    });
  delayBtn.onclick = () =>
    showModal({
      title: "Delay",
      controls: {
        time: {
          label: "Time (ms)",
          min: 10,
          max: 2e3,
          step: 1,
          defaultValue: 250,
        },
        feedback: {
          label: "Feedback",
          min: 0,
          max: 0.9,
          step: 0.01,
          defaultValue: 0.5,
        },
        mix: {
          label: "Mix",
          min: 0,
          max: 1,
          step: 0.01,
          defaultValue: 0.5,
        },
      },
      callback: (opts) =>
        applybend(
          (r, { sr }) => {
            const dS = Math.floor((sr * opts.time) / 1e3),
              o = new Float32Array(r.length + dS);
            o.set(r);
            for (let i = 0; i < o.length; i++) {
              const d = o[i - dS] || 0;
              o[i] += d * opts.feedback;
            }
            const f = r.slice();
            for (let i = 0; i < f.length; i++)
              f[i] = r[i] * (1 - opts.mix) + o[i] * opts.mix;
            return f;
          },
          { label: "Delaying..." }
        ),
    });
  reverbBtn.onclick = () =>
    showModal({
      title: "Reverb",
      controls: {
        roomSize: {
          label: "Room Size",
          min: 0.1,
          max: 0.99,
          step: 0.01,
          defaultValue: 0.7,
        },
        mix: {
          label: "Mix",
          min: 0,
          max: 1,
          step: 0.01,
          defaultValue: 0.4,
        },
      },
      callback: (opts) =>
        applybend(
          (r, { sr }) => {
            const ds = [1613, 2053, 2671, 3121].map((d) =>
                Math.floor(d * (sr / 44100))
              ),
              cs = ds.map((d) => ({
                buf: new Float32Array(d),
                idx: 0,
              })),
              y = new Float32Array(r.length);
            for (let i = 0; i < r.length; i++) {
              let s = r[i],
                cb_out = 0;
              const currentFb = opts.roomSize;
              for (const c of cs) {
                const d = c.buf[c.idx];
                c.buf[c.idx] = s + d * currentFb;
                c.idx = (c.idx + 1) % c.buf.length;
                cb_out += d;
              }
              y[i] = cb_out / cs.length;
            }
            for (let i = 0; i < r.length; i++)
              y[i] = r[i] * (1 - opts.mix) + y[i] * opts.mix;
            return y;
          },
          { label: "Reverb..." }
        ),
    });

  /* =========== NEW WAVELET PROCESSORS =========== */
  waveletChaosBtn.onclick = () =>
    showModal({
      title: "Wavelet Chaos Engine",
      controls: {
        basis: {
          type: "select",
          label: "Wavelet Basis",
          options: waveletBasisOptions,
        },
        dropout: {
          label: "Dropout",
          min: 0,
          max: 1,
          step: 0.01,
          defaultValue: 0.1,
        },
        phase: {
          label: "Phase Corruption",
          min: 0,
          max: 1,
          step: 0.01,
          defaultValue: 0.2,
        },
        shuffle: {
          label: "Packet Shuffle",
          min: 0,
          max: 1,
          step: 0.01,
          defaultValue: 0.5,
        },
      },
      callback: (opts) =>
        applybend(
          (r) =>
            applyWaveletBend(
              (coeffs, o) => {
                // Packet Shuffling
                if (Math.random() < o.shuffle) {
                  for (let i = coeffs.length - 2; i > 0; i--) {
                    const j =
                      1 + Math.floor(Math.random() * (coeffs.length - 2));
                    [coeffs[i], coeffs[j]] = [coeffs[j], coeffs[i]];
                  }
                }
                // Dropout & Phase Corruption
                for (
                  let i = 1;
                  i < coeffs.length;
                  i++ // Skip approximation coeffs
                ) {
                  for (let j = 0; j < coeffs[i].length; j++) {
                    if (Math.random() < o.dropout) coeffs[i][j] = 0;
                    if (Math.random() < o.phase) coeffs[i][j] *= -1;
                  }
                }
                return coeffs;
              },
              opts,
              r
            ),
          { label: "Injecting Chaos..." }
        ),
    });

  scaleCorruptorBtn.onclick = () =>
    showModal({
      title: "Scale-Subband Corruptor",
      controls: {
        basis: {
          type: "select",
          label: "Wavelet Basis",
          options: waveletBasisOptions,
        },
        dropout: {
          label: "Subband Dropout",
          min: 0,
          max: 1,
          step: 0.01,
          defaultValue: 0.1,
        },
        quantize: {
          label: "Quantize Bits",
          min: 1,
          max: 16,
          step: 1,
          defaultValue: 6,
        },
        jitter: {
          label: "Scale Jitter",
          min: 0,
          max: 1,
          step: 0.01,
          defaultValue: 0.2,
        },
      },
      callback: (opts) =>
        applybend(
          (r) =>
            applyWaveletBend(
              (coeffs, o) => {
                // Subband dropout & Quantization
                for (let i = 1; i < coeffs.length; i++) {
                  if (Math.random() < o.dropout) {
                    coeffs[i].fill(0);
                  } else {
                    const s = Math.pow(0.5, o.quantize - 1);
                    for (let j = 0; j < coeffs[i].length; j++) {
                      coeffs[i][j] = s * Math.floor(coeffs[i][j] / s + 0.5);
                    }
                  }
                }
                // Scale Jitter
                for (let i = 1; i < coeffs.length; i++) {
                  if (Math.random() < o.jitter) {
                    const shift = Math.floor(
                      (Math.random() - 0.5) * coeffs[i].length * 0.2
                    );
                    const buffer = coeffs[i].slice();
                    for (let j = 0; j < buffer.length; j++) {
                      coeffs[i][j] =
                        buffer[(j + shift + buffer.length) % buffer.length];
                    }
                  }
                }
                return coeffs;
              },
              opts,
              r
            ),
          { label: "Corrupting Scales..." }
        ),
    });

  waveletTreeDisruptorBtn.onclick = () =>
    showModal({
      title: "Wavelet Tree Disruptor",
      controls: {
        basis: {
          type: "select",
          label: "Wavelet Basis",
          options: waveletBasisOptions,
        },
        prune: {
          label: "Pruning Threshold",
          min: 0,
          max: 1,
          step: 0.01,
          defaultValue: 0.05,
        },
        smear: {
          label: "Coefficient Smear",
          min: 0,
          max: 1,
          step: 0.01,
          defaultValue: 0.5,
        },
      },
      callback: (opts) =>
        applybend(
          (r) =>
            applyWaveletBend(
              (coeffs, o) => {
                // Pruning
                for (let i = 1; i < coeffs.length; i++) {
                  for (let j = 0; j < coeffs[i].length; j++) {
                    if (Math.abs(coeffs[i][j]) < o.prune) {
                      coeffs[i][j] = 0;
                    }
                  }
                }
                // Smearing
                for (let i = 1; i < coeffs.length; i++) {
                  if (Math.random() < o.smear) {
                    for (let j = 1; j < coeffs[i].length; j++) {
                      coeffs[i][j] = (coeffs[i][j] + coeffs[i][j - 1]) * 0.5;
                    }
                  }
                }
                return coeffs;
              },
              opts,
              r
            ),
          { label: "Disrupting Tree..." }
        ),
    });

  entropyGlitchBtn.onclick = () =>
    showModal({
      title: "Entropy Glitch Injector",
      controls: {
        basis: {
          type: "select",
          label: "Wavelet Basis",
          options: waveletBasisOptions,
        },
        flip: {
          label: "Coefficient Flip",
          min: 0,
          max: 1,
          step: 0.01,
          defaultValue: 0.1,
        },
        entropy: {
          label: "Entropy Injection",
          min: 0,
          max: 1,
          step: 0.01,
          defaultValue: 0.05,
        },
      },
      callback: (opts) =>
        applybend(
          (r) =>
            applyWaveletBend(
              (coeffs, o) => {
                for (let i = 1; i < coeffs.length; i++) {
                  for (let j = 0; j < coeffs[i].length; j++) {
                    // Flipping
                    if (Math.random() < o.flip) coeffs[i][j] *= -1;
                    // Entropy Injection
                    if (Math.random() < o.entropy) {
                      coeffs[i][j] += (Math.random() - 0.5) * o.entropy;
                    }
                  }
                }
                return coeffs;
              },
              opts,
              r
            ),
          { label: "Injecting Entropy..." }
        ),
    });

  /* ======= OBSCURE PROCESSORS CLICK HANDLERS ======= */

  muLawBtn.onclick = () =>
    showModal({
      title: "μ-Law Glitch",
      controls: {
        mask: {
          label: "Bitmask (XOR)",
          min: 0,
          max: 255,
          step: 1,
          defaultValue: 42,
        },
        noiseChance: {
          label: "Glitch Chance",
          min: 0,
          max: 1,
          step: 0.01,
          defaultValue: 0.25,
        },
      },
      callback: (opts) =>
        applybend(
          (r) => {
            const o = new Float32Array(r.length);
            for (let i = 0; i < r.length; i++) {
              const x = r[i];
              // 1. encode to 8-bit u-law byte
              const sgn = x < 0 ? -1 : 1;
              const absX = Math.abs(x);
              // Logarithmic compression
              let y = sgn * (Math.log(1 + 255 * absX) / Math.log(256)) * 127 + 128;
              y = Math.max(0, Math.min(255, Math.floor(y)));

              // 2. apply glitch bitwise XOR based on noiseChance
              if (Math.random() < opts.noiseChance) {
                y = y ^ opts.mask;
              }

              // 3. decode u-law byte back to Float32
              const decodedVal = (y - 128) / 127;
              const decSgn = decodedVal < 0 ? -1 : 1;
              const decAbs = Math.abs(decodedVal);
              const decompressed = decSgn * ((Math.pow(256, decAbs) - 1) / 255);
              o[i] = Math.max(-1.0, Math.min(1.0, decompressed));
            }
            return o;
          },
          { label: "Applying μ-Law Glitch..." }
        ),
    });

  bytebeatBtn.onclick = () =>
    showModal({
      title: "Bytebeat Shaper",
      controls: {
        mode: {
          type: "select",
          label: "Equation Mode",
          options: [
            { value: "xor", label: "Logic XOR (v ^ t)" },
            { value: "rhythm", label: "Rhythm Split ((t >> 8) | t)" },
            { value: "fractal", label: "Fractal ((v & t) | (v >> 4))" },
            { value: "mod", label: "Modular Sweep ((v * t) % 32768)" },
          ],
        },
        shift: {
          label: "Bit Shift Amount",
          min: 1,
          max: 16,
          step: 1,
          defaultValue: 8,
        },
        mix: {
          label: "Dry/Wet Mix",
          min: 0,
          max: 1,
          step: 0.01,
          defaultValue: 0.5,
        },
      },
      callback: (opts) =>
        applybend(
          (r) => {
            const o = new Float32Array(r.length);
            for (let i = 0; i < r.length; i++) {
              const x = r[i];
              // Convert to 16-bit integer
              let v = Math.floor(x * 32767);
              const t = i;

              // Apply bitwise equations
              let res = v;
              if (opts.mode === "xor") {
                res = (v ^ (t >> opts.shift)) & 0xffff;
              } else if (opts.mode === "rhythm") {
                res = (v * ((t >> opts.shift) | (t >> 12))) & 0xffff;
              } else if (opts.mode === "fractal") {
                res = ((v & t) | (v >> (opts.shift % 8))) & 0xffff;
              } else if (opts.mode === "mod") {
                res = (v * (t & 0xff)) % 32768;
              }

              // Handle sign extension back from 16-bit unsigned/modulo representation to signed
              if (res > 32767) res -= 65536;
              if (res < -32768) res += 65536;

              const processed = res / 32767;
              o[i] = x * (1 - opts.mix) + processed * opts.mix;
            }
            return o;
          },
          { label: "Shaping Bytebeat..." }
        ),
    });

  phaseScrambleBtn.onclick = () =>
    showModal({
      title: "Phase Scrambler",
      controls: {
        stages: {
          label: "Filter Cascade Stages",
          min: 2,
          max: 12,
          step: 1,
          defaultValue: 6,
        },
        gain: {
          label: "Feedback Gain (g)",
          min: 0.05,
          max: 0.95,
          step: 0.01,
          defaultValue: 0.65,
        },
        stretch: {
          label: "Delay Line Multiplier",
          min: 1,
          max: 10,
          step: 1,
          defaultValue: 4,
        },
      },
      callback: (opts) =>
        applybend(
          (r, { sr }) => {
            const o = r.slice();
            const numStages = opts.stages;
            const g = opts.gain;
            
            // Define delay buffer for each stage
            // We use different prime-like delay sizes to scramble phases asynchronously
            const baseDelays = [41, 73, 113, 173, 239, 311, 401, 503, 613, 727, 853, 997];
            const stagesData = [];
            
            for (let s = 0; s < numStages; s++) {
              const delaySamples = Math.floor((baseDelays[s % baseDelays.length] * opts.stretch * sr) / 44100);
              stagesData.push({
                buffer: new Float32Array(delaySamples),
                idx: 0
              });
            }

            for (let i = 0; i < o.length; i++) {
              let sVal = o[i];
              for (let s = 0; s < numStages; s++) {
                const sd = stagesData[s];
                const dVal = sd.buffer[sd.idx];
                
                // Allpass filter formula: y[n] = g * x[n] + x[n - D] - g * y[n - D]
                const yVal = g * sVal + dVal;
                sd.buffer[sd.idx] = sVal - g * yVal; // feedforward & feedback
                
                sd.idx = (sd.idx + 1) % sd.buffer.length;
                sVal = yVal; // Output of stage becomes input of next stage
              }
              o[i] = sVal;
            }
            return o;
          },
          { label: "Scrambling Phases..." }
        ),
    });

  selfFmBtn.onclick = () =>
    showModal({
      title: "Self-FM Modulator",
      controls: {
        index: {
          label: "Modulation Index",
          min: 0.1,
          max: 20,
          step: 0.1,
          defaultValue: 5,
        },
        feedback: {
          label: "Feedback Amount",
          min: 0,
          max: 1,
          step: 0.01,
          defaultValue: 0.35,
        },
        derivative: {
          type: "select",
          label: "Slope Modulate",
          options: [
            { value: "yes", label: "Slope (High pass)" },
            { value: "no", label: "Direct Amplitude" },
          ],
        },
      },
      callback: (opts) =>
        applybend(
          (r, { sr }) => {
            const len = r.length;
            const o = new Float32Array(len);
            const index = opts.index;
            const feedback = opts.feedback;
            const useSlope = opts.derivative === "yes";
            
            let prevOut = 0;
            for (let i = 0; i < len; i++) {
              // Calculate modulator value
              let mod = 0;
              if (useSlope) {
                const prevIn = i > 0 ? r[i - 1] : 0;
                mod = r[i] - prevIn; // crude first difference derivative
              } else {
                mod = r[i];
              }
              
              // FM Offset calculation (modulator value + feedback of previous output)
              const totalMod = mod + prevOut * feedback;
              const offsetSamples = totalMod * index * 50; // scaled offset
              
              // Modulate lookup index
              const targetIndex = i + offsetSamples;
              
              // Bounded lookup with linear interpolation
              let val = 0;
              if (targetIndex >= 0 && targetIndex < len - 1) {
                const idx1 = Math.floor(targetIndex);
                const idx2 = idx1 + 1;
                const frac = targetIndex - idx1;
                val = r[idx1] * (1 - frac) + r[idx2] * frac;
              } else {
                // Out of bounds wrap or clamping
                const clampedIdx = Math.max(0, Math.min(len - 1, Math.floor(targetIndex)));
                val = r[clampedIdx];
              }
              
              o[i] = val;
              prevOut = val;
            }
            return o;
          },
          { label: "Running Self-FM..." }
        ),
    });

  chaosMapBtn.onclick = () =>
    showModal({
      title: "Logistic Chaos Map",
      controls: {
        r: {
          label: "Chaos (r)",
          min: 3.5,
          max: 4.0,
          step: 0.01,
          defaultValue: 3.8,
        },
        iterations: {
          label: "Iterations",
          min: 1,
          max: 8,
          step: 1,
          defaultValue: 3,
        },
        mix: {
          label: "Dry/Wet Mix",
          min: 0,
          max: 1,
          step: 0.01,
          defaultValue: 0.5,
        },
      },
      callback: (opts) =>
        applybend(
          (r) => {
            const len = r.length;
            const o = new Float32Array(len);
            const chaosR = opts.r;
            const iter = opts.iterations;
            const mix = opts.mix;

            for (let i = 0; i < len; i++) {
              const x = r[i];
              // Map from [-1.0, 1.0] to [0.1, 0.9] to avoid logistic boundaries 0 and 1
              let v = (x + 1.0) * 0.4 + 0.1;

              // Run chaos iterations
              for (let k = 0; k < iter; k++) {
                v = chaosR * v * (1.0 - v);
              }

              // Map back to [-1.0, 1.0]
              const processed = (v - 0.5) * 2.5; // slight gain boost for low amplitude map outcomes
              const clamped = Math.max(-1.0, Math.min(1.0, processed));

              o[i] = x * (1 - mix) + clamped * mix;
            }
            return o;
          },
          { label: "Applying Logistic Chaos..." }
        ),
    });

  karplusBtn.onclick = () =>
    showModal({
      title: "Karplus-Strong Resonator",
      controls: {
        pitch: {
          label: "Pitch (Hz)",
          min: 40,
          max: 1000,
          step: 1,
          defaultValue: 110,
        },
        decay: {
          label: "Resonance / Decay",
          min: 0.5,
          max: 0.99,
          step: 0.01,
          defaultValue: 0.95,
        },
        mix: {
          label: "Dry/Wet Mix",
          min: 0,
          max: 1,
          step: 0.01,
          defaultValue: 0.6,
        },
      },
      callback: (opts) =>
        applybend(
          (r, { sr }) => {
            const len = r.length;
            const o = new Float32Array(len);
            const pitch = opts.pitch;
            const decay = opts.decay;
            const mix = opts.mix;

            // Size of the delay buffer (representing string length)
            const delaySamples = Math.max(2, Math.floor(sr / pitch));
            const delayBuffer = new Float32Array(delaySamples);
            let delayIdx = 0;

            // Simple low-pass filter state
            let prevFilterVal = 0;

            for (let i = 0; i < len; i++) {
              const x = r[i];

              const delayedVal = delayBuffer[delayIdx];
              const filterVal = (delayedVal + prevFilterVal) * 0.5;
              prevFilterVal = filterVal;

              const fedVal = filterVal * decay;

              // Write to delay line (input + feedback)
              const outVal = x + fedVal;
              delayBuffer[delayIdx] = outVal;

              delayIdx = (delayIdx + 1) % delaySamples;

              o[i] = x * (1 - mix) + outVal * mix;
            }
            return o;
          },
          { label: "Plucking Waveguide..." }
        ),
    });

  shimmerDelayBtn.onclick = () =>
    showModal({
      title: "Shimmer Delay",
      controls: {
        time: {
          label: "Delay Time (ms)",
          min: 50,
          max: 1000,
          step: 10,
          defaultValue: 300,
        },
        pitchShift: {
          label: "Pitch Shift (Semitones)",
          min: -12,
          max: 12,
          step: 1,
          defaultValue: 7,
        },
        feedback: {
          label: "Feedback",
          min: 0.0,
          max: 0.95,
          step: 0.01,
          defaultValue: 0.6,
        },
        mix: {
          label: "Dry/Wet Mix",
          min: 0,
          max: 1,
          step: 0.01,
          defaultValue: 0.5,
        },
      },
      callback: (opts) =>
        applybend(
          (r, { sr }) => {
            const len = r.length;
            const o = new Float32Array(len);
            const delaySamps = Math.floor((opts.time * sr) / 1000);
            const rate = Math.pow(2, opts.pitchShift / 12);
            const feedback = opts.feedback;
            const mix = opts.mix;

            const delayBuf = new Float32Array(delaySamps * 2);
            let writeIdx = 0;

            // Sweep pointers for pitch shifting
            let sweep = 0;
            const windowSize = delaySamps;

            for (let i = 0; i < len; i++) {
              const x = r[i];

              // Tap A
              const offsetA = sweep;
              let readIdxA = writeIdx - delaySamps - offsetA;
              while (readIdxA < 0) readIdxA += delayBuf.length;
              const valA = delayBuf[Math.floor(readIdxA) % delayBuf.length];

              // Tap B (180 degrees out of phase)
              const offsetB = (sweep + windowSize / 2) % windowSize;
              let readIdxB = writeIdx - delaySamps - offsetB;
              while (readIdxB < 0) readIdxB += delayBuf.length;
              const valB = delayBuf[Math.floor(readIdxB) % delayBuf.length];

              // Triangular crossfade windows
              const winA = Math.abs(sweep - windowSize / 2) / (windowSize / 2);
              const winB = 1.0 - winA;

              // Interpolated feedback signal
              const feedbackSignal = valA * winA + valB * winB;

              // Write to delay line (input + feedback)
              delayBuf[writeIdx] = x + feedbackSignal * feedback;
              writeIdx = (writeIdx + 1) % delayBuf.length;

              // Advance sweep at pitch shifting rate
              sweep = (sweep + (1 - rate) + windowSize) % windowSize;

              o[i] = x * (1 - mix) + feedbackSignal * mix;
            }
            return o;
          },
          { label: "Cascading Shimmer..." }
        ),
    });

  formantFilterBtn.onclick = () =>
    showModal({
      title: "Formant Vowel Filter",
      controls: {
        vowel: {
          type: "select",
          label: "Vowel Formant",
          options: [
            { value: "A", label: "A (Father)" },
            { value: "E", label: "E (Red)" },
            { value: "I", label: "I (See)" },
            { value: "O", label: "O (Over)" },
            { value: "U", label: "U (Blue)" },
          ],
        },
        resonance: {
          label: "Filter Resonance (Q)",
          min: 2,
          max: 25,
          step: 1,
          defaultValue: 10,
        },
        mix: {
          label: "Dry/Wet Mix",
          min: 0,
          max: 1,
          step: 0.01,
          defaultValue: 0.7,
        },
      },
      callback: (opts) =>
        applybend(
          (r, { sr }) => {
            const len = r.length;
            const o = new Float32Array(len);
            
            // Biquad bandpass coefficients helper
            function makeBandpass(freq, q, sr) {
              const w0 = (2 * Math.PI * freq) / sr;
              const alpha = Math.sin(w0) / (2 * q);
              const cosw0 = Math.cos(w0);
              
              const b0 = alpha;
              const b1 = 0;
              const b2 = -alpha;
              const a0 = 1 + alpha;
              const a1 = -2 * cosw0;
              const a2 = 1 - alpha;
              
              return {
                b0: b0 / a0,
                b1: b1 / a0,
                b2: b2 / a0,
                a1: a1 / a0,
                a2: a2 / a0,
                x1: 0, x2: 0, y1: 0, y2: 0
              };
            }
            
            function processBiquad(f, x) {
              const y = f.b0 * x + f.b1 * f.x1 + f.b2 * f.x2 - f.a1 * f.y1 - f.a2 * f.y2;
              f.x2 = f.x1;
              f.x1 = x;
              f.y2 = f.y1;
              f.y1 = y;
              return y;
            }

            const vowels = {
              A: [
                { f: 730, g: 1.0 },
                { f: 1090, g: 0.63 },
                { f: 2440, g: 0.5 },
              ],
              E: [
                { f: 270, g: 1.0 },
                { f: 2290, g: 0.25 },
                { f: 3010, g: 0.35 },
              ],
              I: [
                { f: 270, g: 1.0 },
                { f: 2290, g: 0.16 },
                { f: 3500, g: 0.4 },
              ],
              O: [
                { f: 570, g: 1.0 },
                { f: 840, g: 0.32 },
                { f: 2440, g: 0.25 },
              ],
              U: [
                { f: 300, g: 1.0 },
                { f: 870, g: 0.16 },
                { f: 2240, g: 0.28 },
              ],
            };

            const formants = vowels[opts.vowel] || vowels["A"];
            const f1 = makeBandpass(formants[0].f, opts.resonance, sr);
            const f2 = makeBandpass(formants[1].f, opts.resonance, sr);
            const f3 = makeBandpass(formants[2].f, opts.resonance, sr);
            
            const g1 = formants[0].g;
            const g2 = formants[1].g;
            const g3 = formants[2].g;

            for (let i = 0; i < len; i++) {
              const x = r[i];
              
              // Process parallel filters
              const y1 = processBiquad(f1, x) * g1;
              const y2 = processBiquad(f2, x) * g2;
              const y3 = processBiquad(f3, x) * g3;
              
              const sum = (y1 + y2 + y3) * 0.4;
              
              o[i] = x * (1 - opts.mix) + sum * opts.mix;
            }
            return o;
          },
          { label: "Filtering Vowels..." }
        ),
    });

  /* ======= GRANULAR SYNTHESIS SUITE ======= */

  function getHannWindow(length) {
    const win = new Float32Array(length);
    for (let i = 0; i < length; i++) {
      win[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (length - 1)));
    }
    return win;
  }

  function applyGranularStretch(modalOpts) {
    applybend((region, opts) => {
      if (!audioCtx) return region;
      const sr = audioCtx.sampleRate;
      const stretchFactor = modalOpts.stretchFactor || 2.0;
      const grainSizeMs = modalOpts.grainSize || 50;
      
      const grainLen = Math.floor((grainSizeMs / 1000) * sr);
      const hopOut = Math.floor(grainLen / 2); // 50% overlap
      const hopIn = Math.floor(hopOut / stretchFactor);
      
      const outLen = Math.floor(region.length * stretchFactor);
      const out = new Float32Array(outLen);
      const hann = getHannWindow(grainLen);

      let inPos = 0;
      let outPos = 0;

      while (outPos < outLen) {
        for (let i = 0; i < grainLen; i++) {
          const srcIdx = inPos + i;
          if (srcIdx < region.length && (outPos + i) < outLen) {
             out[outPos + i] += region[srcIdx] * hann[i];
          }
        }
        inPos += hopIn;
        outPos += hopOut;
      }
      return out;
    }, { name: "Granular Stretch" });
  }

  function applyGranularPitch(modalOpts) {
    applybend((region, opts) => {
      if (!audioCtx) return region;
      const sr = audioCtx.sampleRate;
      const pitchShift = modalOpts.pitchShift || -12;
      const grainSizeMs = modalOpts.grainSize || 50;
      
      const pitchRatio = Math.pow(2, pitchShift / 12);
      const grainLen = Math.floor((grainSizeMs / 1000) * sr);
      const hopSize = Math.floor(grainLen / 2); 
      
      const out = new Float32Array(region.length);
      const hann = getHannWindow(grainLen);

      let pos = 0;

      while (pos < region.length) {
        for (let i = 0; i < grainLen; i++) {
          const outIdx = pos + i;
          if (outIdx >= region.length) break;
          
          const srcFloat = pos + i * pitchRatio;
          const srcInt = Math.floor(srcFloat);
          const srcFrac = srcFloat - srcInt;
          
          if (srcInt >= 0 && srcInt < region.length) {
            const v1 = region[srcInt];
            const v2 = (srcInt + 1 < region.length) ? region[srcInt + 1] : 0;
            const interp = v1 + (v2 - v1) * srcFrac;
            
            out[outIdx] += interp * hann[i];
          }
        }
        pos += hopSize;
      }
      return out;
    }, { name: "Granular Pitch" });
  }

  function applyGranularFreeze(modalOpts) {
    applybend((region, opts) => {
      if (!audioCtx) return region;
      const sr = audioCtx.sampleRate;
      const freezeSizeMs = modalOpts.freezeSize || 100;
      const jitterPct = modalOpts.jitter || 15;
      
      const grainLen = Math.floor((freezeSizeMs / 1000) * sr);
      const hopSize = Math.floor(grainLen / 2); 
      const jitterSamps = Math.floor(grainLen * (jitterPct / 100));
      
      const out = new Float32Array(region.length);
      const hann = getHannWindow(grainLen);

      // Lock onto the center of the beginning of the selection
      const baseInPos = Math.floor(Math.min(grainLen, region.length / 2));

      let pos = 0;
      while (pos < region.length) {
        // Randomly offset the read head by jitter amount
        const jitterOffset = (Math.random() - 0.5) * 2 * jitterSamps;
        let inPos = Math.floor(baseInPos + jitterOffset);
        
        // Clamp to buffer
        if (inPos < 0) inPos = 0;
        if (inPos + grainLen > region.length) inPos = region.length - grainLen;
        if (inPos < 0) break; // if region is extremely short

        for (let i = 0; i < grainLen; i++) {
          const outIdx = pos + i;
          if (outIdx >= region.length) break;
          out[outIdx] += region[inPos + i] * hann[i];
        }
        pos += hopSize;
      }
      return out;
    }, { name: "Granular Freeze" });
  }

  /* ======= Selection & Playback ======= */
  duplicateBtn.onclick = () => duplicateLoop();
  deleteBtn.onclick = () => deleteLoop();
  if (clearTrackBtn) {
    clearTrackBtn.onclick = async () => {
      if (!current) {
        setStatus("Track is already empty", 1000);
        return;
      }
      if (await customConfirm(`Are you sure you want to clear all audio from the current track (Track ${activeTrackIndex + 1})?`)) {
        stopPlaybackSilent();
        clearTrackAudio(activeTrackIndex);
        setStatus(`Cleared Track ${activeTrackIndex + 1}`, 1500);
      }
    };
  }

  async function duplicateLoop() {
    if (!current) {
      setStatus("Load a file first", 800);
      return;
    }
    if (!audioCtx) initAudioContext();
    const hasLoop = loopEnd > loopStart && loopEnd - loopStart > 0.02;
    if (!hasLoop) {
      setStatus("Select a region to duplicate", 1000);
      return;
    }
    if (playing) stopPlaybackSilent();

    await saveState();
    const sr = audioCtx.sampleRate;
    const startSample = Math.floor(loopStart * sr);
    const endSample = Math.floor(loopEnd * sr);

    const loopData = current.slice(startSample, endSample);
    const partAfter = current.slice(endSample);

    const newBuffer = new Float32Array(current.length + loopData.length);
    newBuffer.set(current.slice(0, endSample), 0);
    newBuffer.set(loopData, endSample);
    newBuffer.set(partAfter, endSample + loopData.length);

    current = newBuffer;

    // Highlight the newly inserted duplicate region as the current loop
    const newStartSample = endSample;
    const newEndSample = endSample + loopData.length;
    loopStart = newStartSample / sr;
    loopEnd = newEndSample / sr;

    updateUI();
    setStatus("Selection duplicated", 900);
    await saveAudioToDB(current);

    // Start playback of the duplicated region so it's obvious on the UI
    try {
      await startPlayback(loopStart);
    } catch (e) {
      console.warn("Could not start playback after duplicate:", e);
    }
  }
  // --- CDP WAVESET DISTORTIONS ---
  function extractWavesets(arr) {
    const wavesets = [];
    let i = 0;
    while (i < arr.length) {
      const startIdx = i;
      const isPositive = arr[i] >= 0;
      
      if (isPositive) {
        while (i < arr.length && arr[i] >= 0) i++;
        while (i < arr.length && arr[i] <= 0) i++;
      } else {
        while (i < arr.length && arr[i] <= 0) i++;
        while (i < arr.length && arr[i] >= 0) i++;
      }
      
      if (i > startIdx) {
        wavesets.push(arr.slice(startIdx, i));
      } else {
        // Prevent infinite loop if something goes wrong
        i++;
      }
    }
    return wavesets;
  }

  function applyWsRepeat(modalOpts) {
    applybend((region, opts) => {
      const repeats = modalOpts.repeats || 3;
      const wavesets = extractWavesets(region);
      const newLen = wavesets.reduce((acc, ws) => acc + ws.length * repeats, 0);
      const out = new Float32Array(newLen);
      let idx = 0;
      for (const ws of wavesets) {
        for (let r=0; r<repeats; r++) {
          out.set(ws, idx);
          idx += ws.length;
        }
      }
      return out;
    }, { name: "WsRepeat" });
  }

  function applyWsOmit(modalOpts) {
    applybend((region, opts) => {
      const omitStep = modalOpts.step || 2;
      const wavesets = extractWavesets(region);
      const out = new Float32Array(region.length);
      let idx = 0;
      for (let i = 0; i < wavesets.length; i++) {
        const ws = wavesets[i];
        if (i % omitStep !== 0) {
           out.set(ws, idx);
           idx += ws.length;
        }
      }
      return out.slice(0, idx);
    }, { name: "WsOmit" });
  }

  function applyWsReverse() {
    applybend((region, opts) => {
      const wavesets = extractWavesets(region);
      const chunkSize = 15; // Group wavesets to make the reverse audible
      const out = new Float32Array(region.length);
      let idx = 0;
      for (let i = 0; i < wavesets.length; i += chunkSize) {
        const chunk = wavesets.slice(i, i + chunkSize);
        const chunkLen = chunk.reduce((acc, ws) => acc + ws.length, 0);
        const chunkArr = new Float32Array(chunkLen);
        let cIdx = 0;
        for (const ws of chunk) {
          chunkArr.set(ws, cIdx);
          cIdx += ws.length;
        }
        chunkArr.reverse(); // Reverse the combined chunk
        out.set(chunkArr, idx);
        idx += chunkLen;
      }
      return out;
    }, { name: "WsReverse" });
  }

  function applyWsScramble(modalOpts) {
    applybend((region, opts) => {
      const wavesets = extractWavesets(region);
      // Multiply chunk size by 50 to scramble across a much wider temporal area
      const blockSize = (modalOpts.chunkSize || 8) * 50; 
      const out = new Float32Array(region.length);
      let outIdx = 0;
      
      for(let i=0; i<wavesets.length; i+=blockSize) {
         const block = wavesets.slice(i, i+blockSize);
         block.sort(() => Math.random() - 0.5); // Randomly shuffle wavesets in this block
         for(const ws of block) {
            out.set(ws, outIdx);
            outIdx += ws.length;
         }
      }
      return out;
    }, { name: "WsScramble" });
  }

  function applyWsMultiply(modalOpts) {
    applybend((region, opts) => {
      const factor = modalOpts.factor || 2;
      const wavesets = extractWavesets(region);
      const out = new Float32Array(region.length);
      let idx = 0;
      for (const ws of wavesets) {
        const subLen = Math.floor(ws.length / factor);
        if (subLen < 1) {
           out.set(ws, idx);
           idx += ws.length;
           continue;
        }
        const copied = new Float32Array(subLen);
        for (let i = 0; i < subLen; i++) copied[i] = ws[i];
        
        let localIdx = idx;
        for (let div = 0; div < factor; div++) {
           out.set(copied, localIdx);
           localIdx += subLen;
        }
        idx += ws.length;
      }
      return out;
    }, { name: "WsMultiply" });
  }

  function applyWsDivide(modalOpts) {
    applybend((region, opts) => {
      const factor = modalOpts.factor || 2;
      const wavesets = extractWavesets(region);
      const out = new Float32Array(region.length);
      let idx = 0;
      for (let i = 0; i < wavesets.length; i += factor) {
        const chunk = wavesets.slice(i, i + factor);
        const totalDuration = chunk.reduce((acc, ws) => acc + ws.length, 0);
        const sourceCycle = chunk[0];
        
        // Time stretch sourceCycle to cover totalDuration
        for (let j = 0; j < totalDuration; j++) {
           const srcIdx = (j / totalDuration) * sourceCycle.length;
           const srcInt = Math.floor(srcIdx);
           const srcFrac = srcIdx - srcInt;
           const v1 = sourceCycle[srcInt];
           const v2 = srcInt + 1 < sourceCycle.length ? sourceCycle[srcInt + 1] : 0;
           if (idx < out.length) {
              out[idx++] = v1 + (v2 - v1) * srcFrac;
           }
        }
      }
      return out;
    }, { name: "WsDivide" });
  }

  function applyWsAverage(modalOpts) {
    applybend((region, opts) => {
      const groupSize = modalOpts.groupSize || 2;
      const wavesets = extractWavesets(region);
      
      const outList = [];
      let totalOutLen = 0;
      for (let i = 0; i < wavesets.length; i += groupSize) {
        const chunk = wavesets.slice(i, i + groupSize);
        const totalLen = chunk.reduce((acc, ws) => acc + ws.length, 0);
        const avgLen = Math.floor(totalLen / chunk.length);
        if (avgLen < 1) continue;
        
        const avgWs = new Float32Array(avgLen);
        for (let j = 0; j < avgLen; j++) {
           let sum = 0;
           for (const ws of chunk) {
              const srcIdx = (j / avgLen) * ws.length;
              const srcInt = Math.floor(srcIdx);
              const srcFrac = srcIdx - srcInt;
              const v1 = ws[srcInt];
              const v2 = srcInt + 1 < ws.length ? ws[srcInt + 1] : 0;
              sum += v1 + (v2 - v1) * srcFrac;
           }
           avgWs[j] = sum / chunk.length;
        }
        
        for (let k = 0; k < chunk.length; k++) {
           outList.push(avgWs);
           totalOutLen += avgLen;
        }
      }
      const out = new Float32Array(totalOutLen);
      let idx = 0;
      for (const ws of outList) {
         out.set(ws, idx);
         idx += ws.length;
      }
      return out;
    }, { name: "WsAverage" });
  }

  function applyWsFilter(modalOpts) {
    applybend((region, opts) => {
      const minLength = modalOpts.minLength || 10;
      const maxLength = modalOpts.maxLength || 2000;
      const wavesets = extractWavesets(region);
      const out = new Float32Array(region.length);
      let idx = 0;
      for (const ws of wavesets) {
        if (ws.length >= minLength && ws.length <= maxLength) {
           out.set(ws, idx);
           idx += ws.length;
        }
      }
      return out.slice(0, idx);
    }, { name: "WsFilter" });
  }

  function applyWsClip(modalOpts) {
    applybend((region, opts) => {
      const threshold = modalOpts.threshold || 0.5;
      const wavesets = extractWavesets(region);
      const out = new Float32Array(region.length);
      let idx = 0;
      for (const ws of wavesets) {
        let maxAmp = 0;
        for (let i = 0; i < ws.length; i++) {
           const a = Math.abs(ws[i]);
           if (a > maxAmp) maxAmp = a;
        }
        if (maxAmp >= threshold) {
           out.set(ws, idx);
           idx += ws.length;
        }
      }
      return out.slice(0, idx);
    }, { name: "WsClip" });
  }

  function applyDestroy() {
    applybend((region, opts) => {
      // 1. Detect transients in the region to slice it up using the UI threshold if in slice mode
      const threshold = (sliceModeActive && sliceThreshold) ? parseFloat(sliceThreshold.value) : 0.08;
      let slices = detectTransients(region, threshold);
      
      // 2. If fewer than 4 slices found, fallback to an arbitrary 16-step grid
      if (slices.length < 4) {
        slices = [];
        const step = Math.floor(region.length / 16);
        for (let i = 0; i < 16; i++) {
          slices.push(i * step);
        }
      }
      
      // Ensure we have a defined end point
      if (slices[slices.length - 1] !== region.length) {
        slices.push(region.length);
      }
      
      // Build a library of the audio chunks
      const chunks = [];
      for (let i = 0; i < slices.length - 1; i++) {
        chunks.push(region.slice(slices[i], slices[i + 1]));
      }
      
      const out = new Float32Array(region.length);
      let outPos = 0;
      
      // 3. Assemble the new loop
      // We will fill the `out` buffer sequentially. To keep it exactly in time, 
      // we snap randomly chosen chunks into the original slice boundaries.
      for (let i = 0; i < slices.length - 1; i++) {
        const targetLen = slices[i + 1] - slices[i];
        
        // Pick a random chunk
        const randomChunk = chunks[Math.floor(Math.random() * chunks.length)];
        
        // Copy chunk, applying random mutations
        let mut = new Float32Array(randomChunk);
        
        const CHAOS_ENGINES = [
          // 0: Reverse
          (m) => { m.reverse(); return m; },
          // 1: Double Speed (Pitch Up)
          (m) => {
            const out = new Float32Array(Math.floor(m.length / 2));
            for (let j = 0; j < out.length; j++) out[j] = m[j * 2];
            return out;
          },
          // 2: Half Speed (Pitch Down)
          (m) => {
            const out = new Float32Array(m.length * 2);
            for (let j = 0; j < out.length; j++) out[j] = m[Math.floor(j / 2)];
            return out;
          },
          // 3: Stutter
          (m) => {
            const chunkLen = Math.max(64, Math.floor(m.length / (Math.floor(Math.random()*8)+4)));
            for (let j = 0; j < m.length; j++) m[j] = m[j % chunkLen];
            return m;
          },
          // 4: Mute
          (m) => new Float32Array(m.length),
          // 5: Extreme Bitcrush
          (m) => {
            const bits = Math.floor(Math.random() * 4) + 2; // 2 to 5 bits
            const step = Math.pow(0.5, bits);
            for (let j = 0; j < m.length; j++) m[j] = step * Math.floor(m[j] / step + 0.5);
            return m;
          },
          // 6: Wavefolder
          (m) => {
            const gain = 5 + Math.random() * 15;
            const folds = 2 + Math.floor(Math.random() * 4);
            for (let j = 0; j < m.length; j++) {
              let v = m[j] * gain;
              for (let f = 0; f < folds; f++) v = Math.abs(Math.abs(v) - 1);
              m[j] = (v * 2 - 1) / gain;
            }
            return m;
          },
          // 7: Granular Shuffle
          (m) => {
            const grainSize = Math.max(128, Math.floor(m.length / (8 + Math.random()*24)));
            const numGrains = Math.floor(m.length / grainSize);
            const temp = new Float32Array(m.length);
            for (let j = 0; j < m.length; j++) {
              const randomGrain = Math.floor(Math.random() * numGrains) * grainSize;
              temp[j] = m[Math.min(randomGrain + (j % grainSize), m.length - 1)];
            }
            return temp;
          },
          // 8: Bitwise Invert
          (m) => {
            const temp16 = new Int16Array(m.length);
            for (let j = 0; j < m.length; j++) {
              temp16[j] = Math.max(-32768, Math.min(32767, m[j] * 32767));
              temp16[j] = ~temp16[j];
              m[j] = temp16[j] / 32768.0;
            }
            return m;
          },
          // 9: Comb Delay
          (m) => {
            const delaySamps = Math.max(10, Math.floor(m.length / (10 + Math.random()*20)));
            const feedback = 0.5 + Math.random() * 0.4;
            for (let j = delaySamps; j < m.length; j++) {
              m[j] += m[j - delaySamps] * feedback;
            }
            let peak = 0;
            for (let j = 0; j < m.length; j++) if(Math.abs(m[j]) > peak) peak = Math.abs(m[j]);
            if(peak > 1) for (let j = 0; j < m.length; j++) m[j] /= peak;
            return m;
          },
          // 10: Bit Shift
          (m) => {
            const s = Math.floor(1 + Math.random() * 8);
            const temp16 = new Int16Array(m.length);
            for (let j = 0; j < m.length; j++) {
              temp16[j] = Math.max(-32768, Math.min(32767, (m[j] * 32767) << s));
              m[j] = temp16[j] / 32768.0;
            }
            return m;
          },
          // 11: Bytebeat XOR
          (m) => {
            const shift = 4 + Math.floor(Math.random() * 8);
            for (let i = 0; i < m.length; i++) {
              let v = Math.floor(m[i] * 32767);
              let res = (v ^ (i >> shift)) & 0xffff;
              if (res > 32767) res -= 65536;
              m[i] = res / 32767;
            }
            return m;
          },
          // 12: Bytebeat Fractal
          (m) => {
            const shift = Math.floor(Math.random() * 8);
            for (let i = 0; i < m.length; i++) {
              let v = Math.floor(m[i] * 32767);
              let res = ((v & i) | (v >> shift)) & 0xffff;
              if (res > 32767) res -= 65536;
              m[i] = res / 32767;
            }
            return m;
          },
          // 13: Chebyshev Distortion
          (m) => {
            const order = 2 + Math.floor(Math.random() * 6);
            for (let i = 0; i < m.length; i++) {
              const x = m[i];
              let T_p = 1, T_c = x;
              for (let k = 1; k < order; k++) {
                let T_n = 2 * x * T_c - T_p;
                T_p = T_c;
                T_c = T_n;
              }
              m[i] = T_c;
            }
            return m;
          },
          // 14: Ring Modulator
          (m) => {
            const freq = 100 + Math.random() * 2000;
            const sr = 44100;
            for (let i = 0; i < m.length; i++) {
              m[i] = m[i] * Math.sin(2 * Math.PI * freq * (i / sr));
            }
            return m;
          },
          // 15: Bit Warp
          (m) => {
            const warp = 5 + Math.random() * 15;
            for (let i = 0; i < m.length; i++) {
              const x = m[i], s = Math.sign(x) * (1 - Math.exp(-Math.abs(x) * warp));
              m[i] = Math.tanh(s * (1 + warp / 10));
            }
            return m;
          },
          // 16: Tape Stop (micro)
          (m) => {
            const curve = 1 + Math.random() * 3;
            const stopSamps = m.length;
            const out = new Float32Array(m.length);
            for (let i = 0; i < m.length; i++) {
              const p = i / stopSamps, pC = Math.pow(p, curve);
              const sIdx = Math.floor(pC * (stopSamps - 1));
              out[i] = m[sIdx] * (1 - p);
            }
            return out;
          },
          // 17: Melter
          (m) => {
            const chunkSize = Math.max(4, Math.floor(m.length / 32));
            const out = new Float32Array(m.length);
            let fb = 0;
            for (let i = 0; i < m.length; i++) {
              if (i % chunkSize === 0) fb = 0;
              fb = m[i] * 0.5 + fb * 0.5;
              out[i] = m[i] * 0.5 + fb * 0.5;
            }
            return out;
          },
          // 18: Random Float Corrupt
          (m) => {
            const n = Math.floor(m.length * 0.1); // Corrupt 10% of samples
            for (let i = 0; i < n; i++) {
              m[Math.floor(Math.random() * m.length)] = (Math.random() * 2) - 1;
            }
            return m;
          },
          // 19: μ-Law Glitch
          (m) => {
            const mask = Math.floor(Math.random() * 256);
            for (let i = 0; i < m.length; i++) {
              const x = m[i], sgn = x < 0 ? -1 : 1, absX = Math.abs(x);
              let y = sgn * (Math.log(1 + 255 * absX) / Math.log(256)) * 127 + 128;
              y = Math.max(0, Math.min(255, Math.floor(y))) ^ mask;
              const decodedVal = (y - 128) / 127;
              const decSgn = decodedVal < 0 ? -1 : 1, decAbs = Math.abs(decodedVal);
              m[i] = decSgn * ((Math.pow(256, decAbs) - 1) / 255);
            }
            return m;
          },
          // 20: Dry
          (m) => m
        ];

        // Pick a random engine and process
        const randomEngine = CHAOS_ENGINES[Math.floor(Math.random() * CHAOS_ENGINES.length)];
        mut = randomEngine(mut);
        
        // Fit the mutated chunk into the target length (trim or pad with zeros)
        const fitted = new Float32Array(targetLen);
        const copyLen = Math.min(mut.length, targetLen);
        fitted.set(mut.slice(0, copyLen));
        
        // Quick fade-in/out to prevent clicks (2ms = ~88 samples at 44.1kHz)
        const fadeSamps = Math.min(88, Math.floor(targetLen / 4));
        for (let j = 0; j < fadeSamps; j++) {
          const gain = j / fadeSamps;
          fitted[j] *= gain;
          fitted[targetLen - 1 - j] *= gain;
        }
        
        out.set(fitted, outPos);
        outPos += targetLen;
      }
      
      // Sanitize the final buffer against any NaNs or Infinities that would crash Web Audio
      for (let i = 0; i < out.length; i++) {
        if (!isFinite(out[i])) out[i] = 0;
      }
      
      return out;
    }, { label: "Destroying Loop..." });
  }

  async function deleteLoop() {
    if (!current) {
      setStatus("Load a file first", 800);
      return;
    }
    if (!audioCtx) initAudioContext();
    const hasLoop = loopEnd > loopStart && loopEnd - loopStart > 0.02;
    if (!hasLoop) {
      setStatus("Select a region to delete", 1000);
      return;
    }
    if (playing) stopPlaybackSilent();

    await saveState();
    const sr = audioCtx.sampleRate;
    const startSample = Math.floor(loopStart * sr);
    const endSample = Math.floor(loopEnd * sr);

    const selectionLength = endSample - startSample;
    const newLength = current.length - selectionLength;
    if (newLength <= 0) {
      current = new Float32Array(0);
    } else {
      const newBuffer = new Float32Array(newLength);
      newBuffer.set(current.slice(0, startSample), 0);
      newBuffer.set(current.slice(endSample), startSample);
      current = newBuffer;
    }

    loopStart = 0;
    loopEnd = 0;
    updateUI();
    setStatus("Selection deleted", 900);
    await saveAudioToDB(current);
  }

  function playAuditionBuffer(floatArray) {
    stopAuditionPlayback();
    if (!audioCtx) initAudioContext();
    if (audioCtx.state === "suspended") audioCtx.resume();

    const buf = audioCtx.createBuffer(1, floatArray.length, audioCtx.sampleRate);
    buf.getChannelData(0).set(floatArray);

    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    src.connect(analyser || audioCtx.destination);
    src.start(0);
    auditionSource = src;
  }

  function stopAuditionPlayback() {
    if (auditionSource) {
      try {
        auditionSource.stop();
      } catch (e) {}
      try {
        auditionSource.disconnect();
      } catch (e) {}
      auditionSource = null;
    }
  }

  function stopPlaybackSilent() {
    if (playSource) {
      const sources = Array.isArray(playSource) ? playSource : [playSource];
      sources.forEach(src => {
        src.onended = null;
        try { src.stop(); } catch (e) {}
        try { src.disconnect(); } catch (e) {}
      });
      playSource = null;
    }
    playing = false;
    if (playBtn) playBtn.classList.remove("active");
  }

  function applyEnvelopesToBuffer(buffer, startIdx, endIdx, inLen, outLen, sr) {
    const fadeFramesIn = Math.floor(inLen * sr);
    const fadeFramesOut = Math.floor(outLen * sr);

    if (fadeFramesIn > 0) {
      for (let i = 0; i < fadeFramesIn && (startIdx + i) < buffer.length; i++) {
        const tPos = i / (fadeFramesIn || 1);
        buffer[startIdx + i] *= (0.5 - 0.5 * Math.cos(Math.PI * tPos));
      }
    }

    if (fadeFramesOut > 0) {
      const fadeStartIdx = endIdx - fadeFramesOut;
      for (let i = fadeFramesOut - 1; i >= 0; i--) {
        if ((fadeStartIdx + i) >= buffer.length || (fadeStartIdx + i) < 0) continue;
        const tPos = i / (fadeFramesOut || 1);
        buffer[fadeStartIdx + i] *= (0.5 + 0.5 * Math.cos(Math.PI * tPos));
      }
    }
  }

  function stopPlayback() {
    stopPlaybackSilent();
    // Reset playhead to beginning (or loop start) so next Play starts fresh
    if (loopEnd > loopStart && loopEnd - loopStart > 0.02) {
      lastPlayheadPos = loopStart;
    } else {
      lastPlayheadPos = 0;
    }
    setStatus("Stopped", 600);
  }

  async function startPlayback(at = 0) {
    stopPlaybackSilent();

    if (tracksModeActive) {
      if (!audioCtx) initAudioContext();
      if (audioCtx.state === "suspended") await audioCtx.resume();
      
      const sr = audioCtx.sampleRate;
      const hasSolo = tracks.some(t => t.soloed && t.buffer);
      
      let hasAnyAudio = false;
      const sources = [];
      
      // Ensure `at` is a valid position
      const duration = getPlaylistDuration();
      at = Math.max(0, Math.min(at, duration));
      lastPlayheadPos = at;
      
      tracks.forEach((t) => {
        if (!t.buffer) return;
        if (t.muted && !t.soloed) return;
        if (hasSolo && !t.soloed) return;
        hasAnyAudio = true;
        
        let trackBuffer = t.buffer;
        const sr = audioCtx.sampleRate;
        const trackDur = trackBuffer.length / sr;
        
        const isDraggingThisTrackFade = isDraggingLoopEdge && (draggingEdge === "fadeIn" || draggingEdge === "fadeOut") && (activeTrackIndex === index);
        if (isDraggingThisTrackFade && (t.fadeInLength > 0 || t.fadeOutLength > 0)) {
          trackBuffer = new Float32Array(t.buffer);
          applyEnvelopesToBuffer(trackBuffer, Math.floor(t.loopStart * trackDur * sr), Math.floor(t.loopEnd * trackDur * sr), t.fadeInLength, t.fadeOutLength, sr);
        }
        
        const buf = audioCtx.createBuffer(1, trackBuffer.length, sr);
        buf.getChannelData(0).set(trackBuffer);
        const src = audioCtx.createBufferSource();
        src.buffer = buf;
        
        // Panning & Volume Routing
        const panner = audioCtx.createStereoPanner();
        panner.pan.value = t.pan !== undefined ? t.pan : 0.0;
        
        const gain = audioCtx.createGain();
        gain.gain.value = t.volume !== undefined ? t.volume : 1.0;
        
        src.connect(panner);
        panner.connect(gain);
        gain.connect(analyser || audioCtx.destination);
        
        let trackAt = at - t.offset;
        
        // Individual track loop logic (Shift+Drag in lane)
        if (t.loopStart < t.loopEnd) {
          src.loop = true;
          src.loopStart = t.loopStart * trackDur;
          src.loopEnd = t.loopEnd * trackDur;
        }
        
        if (trackAt < 0) {
           src.start(audioCtx.currentTime + Math.abs(trackAt));
        } else if (trackAt < trackDur || src.loop) {
           src.start(0, trackAt);
        } else {
           return; // Track finished
        }
        sources.push(src);
      });
      
      if (!hasAnyAudio) {
        return setStatus("No track audio to play", 800);
      }
      
      playSource = sources;
      playing = true;
      playStartTime = audioCtx.currentTime;
      playOffset = at;
      if (playBtn) playBtn.classList.add("active");
      
      return;
    }
    
    let playBuffer = current;
    playLoopActive = loopEnd > loopStart && loopEnd - loopStart > 0.02;

    const isDraggingFade = isDraggingLoopEdge && (draggingEdge === "fadeIn" || draggingEdge === "fadeOut");
    if (playLoopActive && isDraggingFade && (fadeInLength > 0 || fadeOutLength > 0)) {
      playBuffer = new Float32Array(current);
      const sr = audioCtx ? audioCtx.sampleRate : 44100;
      applyEnvelopesToBuffer(playBuffer, Math.floor(loopStart * sr), Math.floor(loopEnd * sr), fadeInLength, fadeOutLength, sr);
    }

    if (!playBuffer || playBuffer.length === 0)
      return setStatus("No audio to play", 800);
    if (!audioCtx) initAudioContext();
    if (audioCtx.state === "suspended") await audioCtx.resume();

    // Ensure `at` is a valid position
    const duration = tracksModeActive ? getPlaylistDuration() : durationSeconds();
    at = Math.max(0, Math.min(at, duration));
    lastPlayheadPos = at;

    const buf = audioCtx.createBuffer(1, playBuffer.length, audioCtx.sampleRate);
    buf.getChannelData(0).set(playBuffer);
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    src.connect(analyser || audioCtx.destination);

    if (sliceModeActive && loopEnd > loopStart) {
      // Play exactly one slice as a one-shot
      src.loop = false;
      src.start(0, loopStart, loopEnd - loopStart);
      playOffset = loopStart;
    } else if (playLoopActive) {
      src.loop = true;
      src.loopStart = loopStart;
      src.loopEnd = loopEnd;
      // If the start position is outside the loop, snap it to the loop start
      const startPos = at >= loopStart && at < loopEnd ? at : loopStart;
      src.start(0, startPos);
      playOffset = startPos;
    } else {
      src.loop = false;
      src.start(0, at);
      playOffset = at;
    }

    playSource = src;
    playing = true;
    playStartTime = audioCtx.currentTime;
    if (playBtn) playBtn.classList.add("active");

    src.onended = () => {
      // Only automatically stop if this source is still the active one
      // and we are not in a loop (unless we are in slice mode, which plays as a one-shot).
      if (src === playSource && (!playLoopActive || sliceModeActive)) {
        stopPlaybackSilent();
        setStatus("Playback ended", 800);
      }
    };
  }
  playBtn.onclick = async () => {
    if (!audioCtx) initAudioContext();
    if (playing) {
      stopPlayback();
      return;
    }
    await startPlayback(lastPlayheadPos || 0);
  };
  stopBtn.onclick = stopPlayback;

  /* ======= Overlay Interaction & Drawing ======= */
  let isDragging = false,
    dragStartX = 0,
    dragCurrentX = 0,
    pointerDown = false,
    isDraggingLoopEdge = false,
    draggingEdge = null,
    dragMode = "select"; // can be 'select' or 'gate'

  let lastPlayheadPos = 0;
  function setupOverlayInteraction() {
    overlay.addEventListener("pointerdown", (ev) => {
      if (!current) return;

      // Right-click (button 2), Middle-click (button 1) or Alt-key triggers Panning
      if (ev.button === 1 || ev.button === 2 || ev.altKey) {
        ev.preventDefault();
        isPanning = true;
        panStartX = ev.clientX;
        panStartZoomStart = zoomStart;
        panStartZoomEnd = zoomEnd;
        overlay.setPointerCapture(ev.pointerId);
        return;
      }

      overlay.setPointerCapture(ev.pointerId);
      pointerDown = true;
      const x = ev.clientX - overlay.getBoundingClientRect().left;
      dragStartX = x;
      dragCurrentX = x;
      isDragging = true;

      // NEW: Check for transient gating mode (Shift key)
      if (ev.shiftKey) {
        dragMode = "gate";
        const hasLoop = loopEnd > loopStart && loopEnd - loopStart > 0.02;
        const region = hasLoop
          ? current.slice(
              Math.floor(loopStart * audioCtx.sampleRate),
              Math.floor(loopEnd * audioCtx.sampleRate)
            )
          : current;
        transientGatingState.transients = detectTransients(region, 0.05);
        transientGatingState.active = true;
        setStatus("Transient Shaper: Drag to set gate amount");
        return; // Skip normal drag logic
      }

      dragMode = "select";
      
      // NEW: Check if dragging a slice marker (exclude first and last boundaries)
      if (sliceModeActive && hoveredSliceMarkerIndex > 0 && hoveredSliceMarkerIndex < detectedTransients.length - 1) {
        isDraggingSliceMarker = true;
        draggingSliceMarkerIndex = hoveredSliceMarkerIndex;
        return; // Skip loop boundary logic
      }

      const [sx, ex] = loopPixels();
      const edgeTolerance = 12;
      const rect = overlay.getBoundingClientRect();
      const y = ev.clientY - rect.top;

      const fadeXIn = fadeInLength > 0 ? timeToX(loopStart + fadeInLength) : sx;
      const fadeXOut = fadeOutLength > 0 ? timeToX(loopEnd - fadeOutLength) : ex;

      if ((sx !== null && x >= sx && x <= sx + 16 && y <= 16) || (fadeXIn !== null && Math.abs(x - fadeXIn) <= 8 && y <= 16)) {
        isDraggingLoopEdge = true;
        draggingEdge = "fadeIn";
      } else if ((ex !== null && x <= ex && x >= ex - 16 && y <= 16) || (fadeXOut !== null && Math.abs(x - fadeXOut) <= 8 && y <= 16)) {
        isDraggingLoopEdge = true;
        draggingEdge = "fadeOut";
      } else if (sx !== null && Math.abs(x - sx) < edgeTolerance) {
        isDraggingLoopEdge = true;
        draggingEdge = "start";
      } else if (ex !== null && Math.abs(x - ex) < edgeTolerance) {
        isDraggingLoopEdge = true;
        draggingEdge = "end";
      }
      
      if (draggingEdge) {
        if (!unfadedBuffer) {
           unfadedBuffer = new Float32Array(current);
           if (tracksModeActive && tracks[activeTrackIndex]) {
             tracks[activeTrackIndex].unfadedBuffer = unfadedBuffer;
           }
        }
        return;
      } else isDraggingLoopEdge = false;
    });

    overlay.addEventListener("pointermove", (ev) => {
      const rect = overlay.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, ev.clientX - rect.left));

      if (isPanning) {
        const dx = ev.clientX - panStartX;
        const fracDx = dx / (rect.width || 1);
        const range = panStartZoomEnd - panStartZoomStart;
        
        let newStart = panStartZoomStart - fracDx * range;
        let newEnd = panStartZoomEnd - fracDx * range;
        
        if (newStart < 0) {
          newStart = 0;
          newEnd = range;
        }
        if (newEnd > 1) {
          newEnd = 1;
          newStart = 1 - range;
        }
        
        zoomStart = newStart;
        zoomEnd = newEnd;
        drawWaveform();
        drawOverlay();
        drawMinimap();
        return;
      }

      if (!pointerDown) {
        lastPlayheadPos = xToTime(x);
        
        // Loop boundary hover styling & resize cursor feedback
        const [sx, ex] = loopPixels();
        const edgeTolerance = 12;
        const rect = overlay.getBoundingClientRect();
        const y = ev.clientY - rect.top;
        let newHover = null;
        
        if (sx !== null && x >= sx && x <= sx + 16 && y <= 16) {
          overlay.style.cursor = "ew-resize";
          newHover = "fadeIn";
        } else if (ex !== null && x <= ex && x >= ex - 16 && y <= 16) {
          overlay.style.cursor = "ew-resize";
          newHover = "fadeOut";
        } else if (sx !== null && Math.abs(x - sx) < edgeTolerance && !sliceModeActive) {
          overlay.style.cursor = "ew-resize";
          newHover = "start";
        } else if (ex !== null && Math.abs(x - ex) < edgeTolerance && !sliceModeActive) {
          overlay.style.cursor = "ew-resize";
          newHover = "end";
        } else {
          overlay.style.cursor = "crosshair";
          newHover = null;
        }
        hoveredEdge = newHover;

        if (newHover) {
          hoveredSliceMarkerIndex = -1;
          hoveredSliceIndex = -1;
          drawOverlay();
          drawMinimap();
          return;
        }

        if (sliceModeActive && detectedTransients.length > 0) {
          const t = xToTime(x);
          
          let newHoverMarkerIdx = -1;
          for (let i = 1; i < detectedTransients.length - 1; i++) {
            const markerX = timeToX(detectedTransients[i]);
            if (Math.abs(x - markerX) < 6) { // 6px tolerance
              newHoverMarkerIdx = i;
              break;
            }
          }

          let newHoverSliceIdx = -1;
          for (let i = 0; i < detectedTransients.length - 1; i++) {
            if (t >= detectedTransients[i] && t < detectedTransients[i + 1]) {
              newHoverSliceIdx = i;
              break;
            }
          }
          
          hoveredSliceMarkerIndex = newHoverMarkerIdx;
          if (newHoverMarkerIdx !== -1) {
            hoveredSliceIndex = -1;
            overlay.style.cursor = "ew-resize";
          } else {
            hoveredSliceIndex = newHoverSliceIdx;
            overlay.style.cursor = "pointer";
          }
          
          drawOverlay();
          drawMinimap();
          return;
        }
        hoveredEdge = newHover;
        drawOverlay(); // Redraw immediately for silky smooth 60+ FPS cursor tracking
        drawMinimap();
        return;
      }
      dragCurrentX = x;

      // NEW: Handle slice marker dragging
      if (isDraggingSliceMarker && dragMode === "select") {
        const t = Math.max(0, Math.min(durationSeconds(), xToTime(x)));
        const prevT = detectedTransients[draggingSliceMarkerIndex - 1] || 0;
        const nextT = detectedTransients[draggingSliceMarkerIndex + 1] || durationSeconds();
        
        let newIdx = Math.floor(t * audioCtx.sampleRate);
        const searchRange = Math.min(400, Math.floor(audioCtx.sampleRate * 0.01)); // Search 10ms around mouse
        
        for (let offset = 0; offset < searchRange; offset++) {
          let checkBack = newIdx - offset;
          if (checkBack > 0 && ((current[checkBack] >= 0 && current[checkBack - 1] < 0) || (current[checkBack] < 0 && current[checkBack - 1] >= 0))) {
            newIdx = checkBack;
            break;
          }
          let checkFwd = newIdx + offset;
          if (checkFwd < current.length - 1 && ((checkFwd > 0 && current[checkFwd] >= 0 && current[checkFwd - 1] < 0) || (checkFwd > 0 && current[checkFwd] < 0 && current[checkFwd - 1] >= 0))) {
            newIdx = checkFwd;
            break;
          }
        }
        
        newIdx = Math.max(0, Math.min(current.length - 1, newIdx));
        let newTime = newIdx / audioCtx.sampleRate;
        
        if (newTime > prevT + 0.005 && newTime < nextT - 0.005) {
          detectedTransients[draggingSliceMarkerIndex] = newTime;
          if (selectedSliceIndex === draggingSliceMarkerIndex - 1 || selectedSliceIndex === draggingSliceMarkerIndex) {
            selectSlice(selectedSliceIndex, false);
          }
        }
        drawOverlay();
        drawMinimap();
        return;
      }

      // NEW: Handle transient gating visual update
      if (dragMode === "gate") {
        const dragDistance = dragCurrentX - dragStartX;
        const maxDrag = rect.width / 2;
        transientGatingState.ratio = Math.max(
          0,
          Math.min(1, dragDistance / maxDrag)
        );
        return;
      }

      if (isDragging && isDraggingLoopEdge) {
        const t = xToTime(x);
        if (draggingEdge === "start") {
          loopStart = Math.max(0, Math.min(loopEnd - 0.02, t));
          if (fadeInLength + fadeOutLength > loopEnd - loopStart) {
            const scale = (loopEnd - loopStart) / (fadeInLength + fadeOutLength || 1);
            fadeInLength *= scale;
            fadeOutLength *= scale;
          }
        } else if (draggingEdge === "end") {
          loopEnd = Math.min(durationSeconds(), Math.max(loopStart + 0.02, t));
          if (fadeInLength + fadeOutLength > loopEnd - loopStart) {
            const scale = (loopEnd - loopStart) / (fadeInLength + fadeOutLength || 1);
            fadeInLength *= scale;
            fadeOutLength *= scale;
          }
        } else if (draggingEdge === "fadeIn") {
          fadeInLength = Math.max(0, Math.min(t - loopStart, loopEnd - loopStart - fadeOutLength));
        } else if (draggingEdge === "fadeOut") {
          fadeOutLength = Math.max(0, Math.min(loopEnd - t, loopEnd - loopStart - fadeInLength));
        }
        drawOverlay();
        drawMinimap();
        return;
      }
    });

    overlay.addEventListener("pointerup", (ev) => {
      if (isPanning) {
        overlay.releasePointerCapture(ev.pointerId);
        isPanning = false;
        return;
      }
      if (!pointerDown) return;
      pointerDown = false;
      overlay.releasePointerCapture(ev.pointerId);

      if (isDraggingSliceMarker) {
        isDraggingSliceMarker = false;
        draggingSliceMarkerIndex = -1;
        saveState(); // push history
        return;
      }

      // NEW: Apply transient gating on release
      if (dragMode === "gate") {
        const ratio = transientGatingState.ratio;
        transientGatingState.active = false;
        transientGatingState.ratio = 0;
        transientGatingState.transients = [];

        if (ratio > 0.01) {
          applyTransientGating(ratio);
        } else {
          setStatus("Ready");
        }
        dragMode = "select";
        return;
      }

      const a = dragStartX,
        b = dragCurrentX;
      const smallMove = Math.abs(b - a) < 6;

      if (isDraggingLoopEdge) {
        isDraggingLoopEdge = false;
        
        // Auto-Commit the fade into the buffer
        if (unfadedBuffer) {
           current = new Float32Array(unfadedBuffer);
           if (fadeInLength > 0 || fadeOutLength > 0) {
             const sr = audioCtx ? audioCtx.sampleRate : 44100;
             applyEnvelopesToBuffer(current, Math.floor(loopStart * sr), Math.floor(loopEnd * sr), fadeInLength, fadeOutLength, sr);
           }
           if (tracksModeActive && tracks[activeTrackIndex]) {
             tracks[activeTrackIndex].buffer = current;
           }
           updateUI(); // Draw the permanently faded waveform
        }

        draggingEdge = null;
        if (tracksModeActive) saveActiveTrackState();
        saveState();
        if (playLoopActive && !playing) startPlayback(loopStart);
        return;
      } else if (smallMove) {
        if (sliceModeActive && hoveredSliceIndex !== -1 && detectedTransients.length > 0) {
          selectSlice(hoveredSliceIndex, true); // Auto-play on click
        } else {
          const t = xToTime(b);
          lastPlayheadPos = t;
        }
      } else {
        const t1 = xToTime(a),
          t2 = xToTime(b);
        loopStart = Math.min(t1, t2);
        loopEnd = Math.max(t1, t2);
        unfadedBuffer = null;
        fadeInLength = 0;
        fadeOutLength = 0;
        if (loopEnd - loopStart < 0.02)
          loopEnd = Math.min(durationSeconds(), loopStart + 0.02);
        if (playing && playLoopActive) startPlayback(loopStart);
      }

      isDragging = false;
      isDraggingLoopEdge = false;
      draggingEdge = null;
    });

    overlay.addEventListener("pointerleave", () => {
      hoveredEdge = null;
      overlay.style.cursor = "default";
      drawOverlay();
    });

    overlay.addEventListener("dblclick", (ev) => {
      if (sliceModeActive && current && audioCtx) {
        const rect = overlay.getBoundingClientRect();
        const x = Math.max(0, Math.min(rect.width, ev.clientX - rect.left));
        const t = xToTime(x);
        
        // 1. Check if double-clicking a marker to remove it
        for (let i = 1; i < detectedTransients.length - 1; i++) {
          if (Math.abs(timeToX(detectedTransients[i]) - x) < 8) {
            detectedTransients.splice(i, 1);
            if (selectedSliceIndex >= i) selectedSliceIndex = Math.max(0, selectedSliceIndex - 1);
            saveState();
            drawOverlay();
            return;
          }
        }
        
        // 2. Otherwise add a new marker, snapping to zero-crossing
        let newIdx = Math.floor(t * audioCtx.sampleRate);
        const searchRange = Math.min(400, Math.floor(audioCtx.sampleRate * 0.01));
        
        for (let offset = 0; offset < searchRange; offset++) {
          let checkBack = newIdx - offset;
          if (checkBack > 0 && ((current[checkBack] >= 0 && current[checkBack - 1] < 0) || (current[checkBack] < 0 && current[checkBack - 1] >= 0))) {
            newIdx = checkBack;
            break;
          }
          let checkFwd = newIdx + offset;
          if (checkFwd < current.length - 1 && ((checkFwd > 0 && current[checkFwd] >= 0 && current[checkFwd - 1] < 0) || (checkFwd > 0 && current[checkFwd] < 0 && current[checkFwd - 1] >= 0))) {
            newIdx = checkFwd;
            break;
          }
        }
        
        newIdx = Math.max(0, Math.min(current.length - 1, newIdx));
        let newTime = newIdx / audioCtx.sampleRate;
        
        detectedTransients.push(newTime);
        detectedTransients.sort((a, b) => a - b);
        saveState();
        drawOverlay();
        return;
      }
      
      loopStart = 0;
      loopEnd = 0;
      unfadedBuffer = null;
      fadeInLength = 0;
      fadeOutLength = 0;
    });

    overlay.addEventListener("wheel", (e) => {
      if (!current) return;
      e.preventDefault();
      
      const zoomFactor = e.deltaY < 0 ? 0.85 : 1.15;
      const rect = overlay.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseFrac = Math.max(0, Math.min(1, mouseX / (rect.width || 1)));
      
      const currentRange = zoomEnd - zoomStart;
      const newRange = Math.max(0.0005, Math.min(1.0, currentRange * zoomFactor));
      
      const mouseTimeFrac = zoomStart + mouseFrac * currentRange;
      let newZoomStart = mouseTimeFrac - mouseFrac * newRange;
      let newZoomEnd = newZoomStart + newRange;
      
      if (newZoomStart < 0) {
        newZoomStart = 0;
        newZoomEnd = newRange;
      }
      if (newZoomEnd > 1) {
        newZoomEnd = 1;
        newZoomStart = 1 - newRange;
      }
      
      zoomStart = newZoomStart;
      zoomEnd = newZoomEnd;
      
      drawWaveform();
      drawOverlay();
      drawMinimap();
    }, { passive: false });

    overlay.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });
  }
  function setupMinimapInteraction() {
    if (!minimapCanvas) return;

    minimapCanvas.addEventListener("pointerdown", (e) => {
      if (!current) return;
      minimapCanvas.setPointerCapture(e.pointerId);
      
      const rect = minimapCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const frac = x / (rect.width || 1);
      
      const viewportWidth = zoomEnd - zoomStart;
      
      if (frac >= zoomStart && frac <= zoomEnd) {
        isDraggingViewport = true;
        dragViewportStartOffset = frac - zoomStart;
      } else {
        let newStart = frac - viewportWidth / 2;
        let newEnd = frac + viewportWidth / 2;
        
        if (newStart < 0) {
          newStart = 0;
          newEnd = viewportWidth;
        }
        if (newEnd > 1) {
          newEnd = 1;
          newStart = 1 - viewportWidth;
        }
        
        zoomStart = newStart;
        zoomEnd = newEnd;
        isDraggingViewport = true;
        dragViewportStartOffset = viewportWidth / 2;
        
        drawWaveform();
        drawOverlay();
        drawMinimap();
      }
    });

    minimapCanvas.addEventListener("pointermove", (e) => {
      if (!isDraggingViewport) return;
      const rect = minimapCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const frac = x / (rect.width || 1);
      
      const viewportWidth = zoomEnd - zoomStart;
      let newStart = frac - dragViewportStartOffset;
      let newEnd = newStart + viewportWidth;
      
      if (newStart < 0) {
        newStart = 0;
        newEnd = viewportWidth;
      }
      if (newEnd > 1) {
        newEnd = 1;
        newStart = 1 - viewportWidth;
      }
      
      zoomStart = newStart;
      zoomEnd = newEnd;
      
      drawWaveform();
      drawOverlay();
      drawMinimap();
    });

    minimapCanvas.addEventListener("pointerup", (e) => {
      if (isDraggingViewport) {
        minimapCanvas.releasePointerCapture(e.pointerId);
        isDraggingViewport = false;
      }
    });
  }
  function xToTime(x) {
    if (!audioCtx || !current) return 0;
    const rect = overlay.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, x / (rect.width || 1)));
    const tFrac = zoomStart + frac * (zoomEnd - zoomStart);
    return tFrac * durationSeconds();
  }
  function timeToX(time) {
    if (!audioCtx || !current) return 0;
    const rect = overlay.getBoundingClientRect();
    const tFrac = time / Math.max(1e-4, durationSeconds());
    const frac = (tFrac - zoomStart) / Math.max(1e-6, zoomEnd - zoomStart);
    return frac * (rect.width || 1);
  }
  function durationSeconds() {
    if (!audioCtx) return 0;
    return current ? current.length / audioCtx.sampleRate : 0;
  }
  function loopPixels() {
    if (!current || loopEnd <= loopStart) return [null, null];
    return [timeToX(loopStart), timeToX(loopEnd)];
  }

  function drawGrid(context, w, h) {
    context.save();
    context.strokeStyle = "rgba(43, 43, 53, 0.4)"; // fine dark grey lines
    context.lineWidth = 1;
    
    // Draw horizontal dashed lines
    context.setLineDash([2, 5]);
    const horizDivisions = 6;
    for (let i = 1; i < horizDivisions; i++) {
      const y = Math.floor((i / horizDivisions) * h);
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(w, y);
      context.stroke();
    }

    // Draw vertical dashed lines
    const vertDivisions = 10;
    for (let i = 1; i < vertDivisions; i++) {
      const x = Math.floor((i / vertDivisions) * w);
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, h);
      context.stroke();
    }
    context.restore();
  }

  function drawOverlay() {
    const w = octx.canvas.width / devicePixelRatio,
      h = octx.canvas.height / devicePixelRatio;
    octx.clearRect(0, 0, w, h);

    // Draw selected slice highlight (distinct from hover)
    if (sliceModeActive && selectedSliceIndex >= 0 && detectedTransients.length > 1 && !pointerDown) {
      const t1 = detectedTransients[selectedSliceIndex];
      const t2 = detectedTransients[selectedSliceIndex + 1];
      if (t1 !== undefined && t2 !== undefined) {
        const sx = timeToX(t1);
        const ex = timeToX(t2);
        octx.save();
        
        // Grey out unselected regions
        octx.fillStyle = "rgba(0, 0, 0, 0.55)";
        if (sx > 0) octx.fillRect(0, 0, sx, h);
        if (ex < w) octx.fillRect(ex, 0, w - ex, h);
        
        // Selected slice: brighter amber fill
        octx.fillStyle = hexToRGBA(accent, 0.15);
        octx.fillRect(sx, 0, ex - sx, h);
        // Top accent bar for selected slice
        octx.fillStyle = accent;
        octx.fillRect(sx, 0, ex - sx, 2.5);
        octx.restore();
      }
    }

    // Draw hovered slice highlight (lighter, only if different from selected)
    if (sliceModeActive && hoveredSliceIndex !== -1 && hoveredSliceIndex !== selectedSliceIndex && detectedTransients.length > 0 && !pointerDown) {
      const t1 = detectedTransients[hoveredSliceIndex];
      const t2 = detectedTransients[hoveredSliceIndex + 1];
      if (t1 !== undefined && t2 !== undefined) {
        const sx = timeToX(t1);
        const ex = timeToX(t2);
        octx.save();
        octx.fillStyle = hexToRGBA(accent, 0.08);
        octx.fillRect(sx, 0, ex - sx, h);
        octx.restore();
      }
    }

    // Draw transient dotted lines and slice index labels
    if (sliceModeActive && detectedTransients.length > 0) {
      octx.save();
      octx.lineWidth = 1.0;
      octx.setLineDash([3, 4]);
      for (let i = 1; i < detectedTransients.length - 1; i++) {
        const tx = timeToX(detectedTransients[i]);
        // Brighter line if it borders the selected slice
        const isSelectedBorder = (i === selectedSliceIndex || i === selectedSliceIndex + 1);
        octx.strokeStyle = isSelectedBorder ? "rgba(245, 158, 11, 0.7)" : "rgba(245, 158, 11, 0.3)";
        octx.beginPath();
        octx.moveTo(tx, 0);
        octx.lineTo(tx, h);
        octx.stroke();
      }
      octx.setLineDash([]);
      // Draw slice index labels at top
      octx.font = "9px 'JetBrains Mono', monospace";
      octx.textAlign = "center";
      for (let i = 0; i < detectedTransients.length - 1; i++) {
        const t1 = detectedTransients[i];
        const t2 = detectedTransients[i + 1];
        const sx = timeToX(t1);
        const ex = timeToX(t2);
        const midX = (sx + ex) / 2;
        // Only draw if there's enough space
        if (ex - sx > 20) {
          octx.fillStyle = i === selectedSliceIndex ? "rgba(245, 158, 11, 0.8)" : "rgba(245, 158, 11, 0.3)";
          octx.fillText(`${i + 1}`, midX, 14);
        }
      }
      octx.restore();
    }

    if (loopEnd > loopStart && current) {
      const sx = timeToX(loopStart),
        ex = timeToX(loopEnd);
      octx.save();
      // Matte selection background - no neon glows
      octx.fillStyle = hexToRGBA(accent, 0.06);
      octx.fillRect(sx, 0, ex - sx, h);
      octx.lineWidth = 1.5;
      octx.strokeStyle = accent;
      octx.strokeRect(sx + 0.5, 0.5, ex - sx - 1, h - 1);
      
      // Draw loop boundary resize handles (small tabs at top and bottom)
      const handleW = 6;
      const handleH = 16;
      
      // Start loop boundary handle
      octx.fillStyle = hoveredEdge === "start" || (isDragging && draggingEdge === "start") ? "#ffffff" : accent;
      octx.fillRect(sx - handleW / 2, 0, handleW, handleH); // top handle tab
      octx.fillRect(sx - handleW / 2, h - handleH, handleW, handleH); // bottom handle tab
      
      // End loop boundary handle
      octx.fillStyle = hoveredEdge === "end" || (isDragging && draggingEdge === "end") ? "#ffffff" : accent;
      octx.fillRect(ex - handleW / 2, 0, handleW, handleH); // top handle tab
      octx.fillRect(ex - handleW / 2, h - handleH, handleW, handleH); // bottom handle tab
      
      // Draw highlighted vertical lines if hovered or dragging
      octx.lineWidth = 2.0;
      octx.strokeStyle = "#ffffff";
      if (hoveredEdge === "start" || (isDragging && draggingEdge === "start")) {
        octx.beginPath();
        octx.moveTo(sx, 0);
        octx.lineTo(sx, h);
        octx.stroke();
      }
      if (hoveredEdge === "end" || (isDragging && draggingEdge === "end")) {
        octx.beginPath();
        octx.moveTo(ex, 0);
        octx.lineTo(ex, h);
        octx.stroke();
      }



      // Draw fade handles and curves
      if (fadeInLength > 0 || hoveredEdge === "fadeIn" || draggingEdge === "fadeIn") {
        const fadeX = timeToX(loopStart + fadeInLength);
        const color = "rgba(255, 255, 255, 0.6)";
        const handleColor = accent;
        
        // Draw fade curve
        octx.beginPath();
        octx.moveTo(sx, h);
        for (let ix = sx; ix <= fadeX; ix++) {
          const tPos = Math.max(0, Math.min(1, (ix - sx) / (fadeX - sx || 1)));
          const vol = 0.5 - 0.5 * Math.cos(Math.PI * tPos);
          octx.lineTo(ix, h - vol * h);
        }
        octx.strokeStyle = color;
        octx.stroke();
        
        // Fill under the curve
        octx.lineTo(fadeX, h);
        octx.lineTo(sx, h);
        octx.fillStyle = hexToRGBA(accent, 0.1);
        octx.fill();
        
        // Draw handle
        octx.fillStyle = hoveredEdge === "fadeIn" || draggingEdge === "fadeIn" ? "#ffffff" : handleColor;
        octx.fillRect(fadeX - 4, 0, 8, 8);
      }
      
      if (fadeOutLength > 0 || hoveredEdge === "fadeOut" || draggingEdge === "fadeOut") {
        const fadeX = timeToX(loopEnd - fadeOutLength);
        const color = "rgba(255, 255, 255, 0.6)";
        const handleColor = accent;
        
        // Draw fade curve
        octx.beginPath();
        octx.moveTo(fadeX, 0);
        for (let ix = fadeX; ix <= ex; ix++) {
          const tPos = Math.max(0, Math.min(1, (ix - fadeX) / (ex - fadeX || 1)));
          const vol = 0.5 + 0.5 * Math.cos(Math.PI * tPos);
          octx.lineTo(ix, h - vol * h);
        }
        octx.lineTo(ex, h);
        octx.lineTo(fadeX, h);
        octx.fillStyle = hexToRGBA(accent, 0.1);
        octx.fill();
        octx.strokeStyle = color;
        octx.stroke();
        
        // Draw handle
        octx.fillStyle = hoveredEdge === "fadeOut" || draggingEdge === "fadeOut" ? "#ffffff" : handleColor;
        octx.fillRect(fadeX - 4, 0, 8, 8);
      }

      octx.restore();
    }
    if (
      isDragging &&
      dragMode === "select" &&
      !isDraggingLoopEdge &&
      pointerDown
    ) {
      const sx = Math.min(dragStartX, dragCurrentX),
        ex = Math.max(dragStartX, dragCurrentX);
      octx.save();
      octx.fillStyle = hexToRGBA(accent, 0.04);
      octx.fillRect(sx, 0, ex - sx, h);
      octx.lineWidth = 1.2;
      octx.strokeStyle = accent;
      octx.setLineDash([4, 4]);
      octx.strokeRect(sx + 0.5, 0.5, ex - sx - 1, h - 1);
      octx.restore();
    }
    let playPos = lastPlayheadPos;
    if (playing && audioCtx) {
      const elapsed = audioCtx.currentTime - playStartTime;
      let posSec = playOffset + elapsed;
      if (playLoopActive && loopEnd > loopStart) {
        if (sliceModeActive) {
          posSec = Math.min(posSec, loopEnd);
        } else if (posSec >= loopEnd) {
          posSec = loopStart + ((posSec - loopStart) % (loopEnd - loopStart));
        }
      }
      playPos = posSec;
      lastPlayheadPos = posSec;
    }

    // Always draw playhead if there's audio
    if (current) {
      const x = timeToX(playPos);
      octx.save();
      octx.strokeStyle = "#ffffff";
      octx.lineWidth = 1;
      octx.globalAlpha = playing ? 0.95 : 0.6;
      octx.beginPath();
      octx.moveTo(x, 0);
      octx.lineTo(x, h);
      octx.stroke();
      octx.restore();
    }
    updateSliceToolbarPosition();
  }
  function hexToRGBA(hex, a = 1) {
    const h = hex.replace("#", ""),
      r = parseInt(h.substring(0, 2), 16),
      g = parseInt(h.substring(2, 4), 16),
      b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${a})`;
  }
  function drawWaveform() {
    if (transientGatingState.active) {
      drawGatedWaveformPreview();
      return;
    }
    const w = ctx.canvas.width / devicePixelRatio,
      h = ctx.canvas.height / devicePixelRatio;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#070709"; // Match CSS background
    ctx.fillRect(0, 0, w, h);
    
    // Draw oscilloscope background grid
    drawGrid(ctx, w, h);

    // Draw real-time FFT Spectrogram Visualizer
    const trackColor = tracks[activeTrackIndex]?.color || accent;
    if (analyser && (playing || auditioning)) {
      analyser.getByteFrequencyData(freqData);
      const numBars = freqData.length;
      const barWidth = w / numBars;
      ctx.save();
      ctx.fillStyle = hexToRGBA(trackColor, 0.12) || "rgba(245, 158, 11, 0.12)";
      for (let i = 0; i < numBars; i++) {
        const magnitude = freqData[i] / 255;
        const barHeight = magnitude * (h * 0.7);
        const x = i * barWidth;
        const y = (h - barHeight) / 2;
        ctx.fillRect(x, y, barWidth - 1, barHeight);
      }
      ctx.restore();
    }

    if (!current) return;

    // Draw zero-crossing line
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
    
    // Create dynamic vertical gradient for waveform
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, hexToRGBA(trackColor, 0.1));
    grad.addColorStop(0.2, hexToRGBA(trackColor, 0.4));
    grad.addColorStop(0.4, trackColor);
    grad.addColorStop(0.5, trackColor);
    grad.addColorStop(0.6, trackColor);
    grad.addColorStop(0.8, hexToRGBA(trackColor, 0.4));
    grad.addColorStop(1, hexToRGBA(trackColor, 0.1));

    ctx.fillStyle = grad;

    const startSample = Math.floor(zoomStart * current.length);
    const endSample = Math.ceil(zoomEnd * current.length);
    const zoomedLen = Math.max(1, endSample - startSample);
    const step = zoomedLen / w;

    if (step <= 1.0) {
      // Sub-sample precision: draw clean vector lines and dots
      ctx.save();
      ctx.strokeStyle = grad; // Use the shiny gradient instead of flat color
      ctx.shadowBlur = 12;
      ctx.shadowColor = hexToRGBA(trackColor, 0.8);
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      for (let x = 0; x < w; x++) {
        const sampleIdx = Math.min(current.length - 1, startSample + Math.floor(x * step));
        const v = current[sampleIdx];
        const y = ((v + 1) / 2) * h;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Draw dots if zoomed in very deeply (fewer than w/2 samples)
      if (step < 0.5) {
        ctx.fillStyle = "#ffffff";
        for (let x = 0; x < w; x++) {
          const sampleIdx = startSample + Math.floor(x * step);
          if (sampleIdx >= current.length) break;
          const v = current[sampleIdx];
          const y = ((v + 1) / 2) * h;
          ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
        }
      }
      ctx.restore();
    } else {
      // Premium dual-layer waveform envelope
      ctx.save();
      
      const widthInt = Math.ceil(w);
      const minArray = new Float32Array(widthInt);
      const maxArray = new Float32Array(widthInt);
      const rmsArray = new Float32Array(widthInt);

      for (let x = 0; x < widthInt; x++) {
        const i = startSample + Math.floor(x * step);
        let min = 1, max = -1;
        let sumSq = 0;
        let count = 0;
        const chunkEnd = Math.min(current.length, startSample + Math.ceil((x + 1) * step));
        
        for (let j = i; j < chunkEnd; j++) {
          const v = current[j];
          if (v < min) min = v;
          if (v > max) max = v;
          sumSq += v * v;
          count++;
        }
        
        minArray[x] = min;
        maxArray[x] = max;
        rmsArray[x] = count > 0 ? Math.sqrt(sumSq / count) : 0;
      }

      // 1. Draw Outer Envelope (Min/Max Peaks)
      ctx.beginPath();
      for (let x = 0; x < widthInt; x++) {
        ctx.lineTo(x, ((minArray[x] + 1) / 2) * h);
      }
      for (let x = widthInt - 1; x >= 0; x--) {
        ctx.lineTo(x, ((maxArray[x] + 1) / 2) * h);
      }
      ctx.closePath();
      
      ctx.fillStyle = hexToRGBA(trackColor, 0.15);
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = hexToRGBA(trackColor, 0.3);
      ctx.stroke();

      // 2. Draw Middle Envelope (RMS/Average Power)
      ctx.beginPath();
      for (let x = 0; x < widthInt; x++) {
        ctx.lineTo(x, ((-rmsArray[x] + 1) / 2) * h);
      }
      for (let x = widthInt - 1; x >= 0; x--) {
        ctx.lineTo(x, ((rmsArray[x] + 1) / 2) * h);
      }
      ctx.closePath();
      
      ctx.fillStyle = hexToRGBA(trackColor, 0.45);
      ctx.fill();

      // 3. Draw Inner Core Envelope (Dense RMS)
      ctx.beginPath();
      for (let x = 0; x < widthInt; x++) {
        ctx.lineTo(x, ((-rmsArray[x] * 0.4 + 1) / 2) * h);
      }
      for (let x = widthInt - 1; x >= 0; x--) {
        ctx.lineTo(x, ((rmsArray[x] * 0.4 + 1) / 2) * h);
      }
      ctx.closePath();
      
      ctx.fillStyle = grad;
      ctx.fill();
      
      // 4. Draw a bright center filament line for a neon tube effect
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      ctx.lineWidth = 1.0;
      ctx.stroke();

      ctx.restore();
    }
  }
  function drawMinimap() {
    if (!mctx || !current) return;
    const w = mctx.canvas.width / devicePixelRatio;
    const h = mctx.canvas.height / devicePixelRatio;
    mctx.clearRect(0, 0, w, h);
    mctx.fillStyle = "#09090b";
    mctx.fillRect(0, 0, w, h);

    // Draw full waveform in a muted secondary text color
    mctx.save();
    const mGrad = mctx.createLinearGradient(0, 0, 0, h);
    mGrad.addColorStop(0, "rgba(140, 142, 154, 0.4)");
    mGrad.addColorStop(0.5, "rgba(140, 142, 154, 0.05)");
    mGrad.addColorStop(1, "rgba(140, 142, 154, 0.4)");
    mctx.fillStyle = mGrad;
    const step = Math.ceil(current.length / w);
    for (let x = 0; x < w; x++) {
      const i = x * step;
      let min = 1, max = -1;
      for (let j = 0; j < step && i + j < current.length; j++) {
        const v = current[i + j];
        if (v < min) min = v;
        if (v > max) max = v;
      }
      const yBottom = ((max + 1) / 2) * h;
      const yTop = ((min + 1) / 2) * h;
      mctx.fillRect(x, yTop, 1, Math.max(1, yBottom - yTop));
    }

    // Draw loop selection range in minimap (in a faint accent amber)
    if (loopEnd > loopStart) {
      const duration = durationSeconds();
      if (duration > 0) {
        const lStartFrac = loopStart / duration;
        const lEndFrac = loopEnd / duration;
        mctx.fillStyle = hexToRGBA(accent, 0.08);
        mctx.fillRect(lStartFrac * w, 0, (lEndFrac - lStartFrac) * w, h);
        mctx.strokeStyle = hexToRGBA(accent, 0.25);
        mctx.lineWidth = 1;
        mctx.strokeRect(lStartFrac * w, 0.5, (lEndFrac - lStartFrac) * w, h - 1);
      }
    }

    // Draw viewport box representing current zoom
    const vx = zoomStart * w;
    const vw = (zoomEnd - zoomStart) * w;
    
    // Draw masking outside viewport
    mctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    mctx.fillRect(0, 0, vx, h);
    mctx.fillRect(vx + vw, 0, w - (vx + vw), h);
    
    // Draw viewport highlight box
    mctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    mctx.lineWidth = 1.5;
    mctx.strokeRect(vx, 0.75, vw, h - 1.5);
    
    mctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    mctx.fillRect(vx, 0, vw, h);

    // Draw active playhead in minimap if playing
    let playPos = lastPlayheadPos;
    if (playing && audioCtx) {
      const elapsed = audioCtx.currentTime - playStartTime;
      let posSec = playOffset + elapsed;
      if (playLoopActive && loopEnd > loopStart) {
        if (posSec >= loopEnd) {
          posSec = loopStart + ((posSec - loopStart) % (loopEnd - loopStart));
        }
      }
      playPos = posSec;
    }
    const duration = durationSeconds();
    if (duration > 0) {
      const playheadFrac = playPos / duration;
      if (playheadFrac >= 0 && playheadFrac <= 1) {
        mctx.strokeStyle = "#ffffff";
        mctx.lineWidth = 1;
        mctx.globalAlpha = playing ? 0.95 : 0.6;
        mctx.beginPath();
        mctx.moveTo(playheadFrac * w, 0);
        mctx.lineTo(playheadFrac * w, h);
        mctx.stroke();
      }
    }
    mctx.restore();
  }
  let lastDrawTime = 0;
  function drawLoop(ts) {
    if (
      playing ||
      isDragging ||
      pointerDown ||
      !lastDrawTime ||
      ts - lastDrawTime > 250
    ) {
      if (!lastDrawTime || ts - lastDrawTime > 16) {
        drawWaveform();
        drawOverlay();
        drawMinimap();
        lastDrawTime = ts;
      }
    }
    requestAnimationFrame(drawLoop);
  }

  /* ======= Keyboard & Export ======= */
  document.addEventListener("keydown", async (e) => {
    if (modalOverlay.classList.contains("show")) {
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        modalCommit.click();
        return;
      }
      if (e.key === "Backspace") {
        e.preventDefault();
        modalCancel.click();
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        hideModal();
        return;
      }
      if (e.key === "Enter" || e.code === "NumpadEnter") {
        e.preventDefault();
        modalCommit.click();
        return;
      }
      return;
    }

    const cmd = e.metaKey || e.ctrlKey;
    const active = document.activeElement;
    const inField =
      active &&
      (active.tagName === "INPUT" ||
        active.tagName === "TEXTAREA" ||
        active.tagName === "SELECT" ||
        active.isContentEditable);

    if (inField) return; // Ignore most shortcuts if typing in a field

    if (e.key && e.key.toLowerCase() === "p" && !cmd && !e.altKey) {
      const menu = document.getElementById("procMenu"),
        btn = document.getElementById("processorsBtn");
      if (menu) {
        e.preventDefault();
        const isShown = menu.classList.contains("show");
        if (isShown) {
          menu.classList.remove("show");
          menu.setAttribute("aria-hidden", "true");
          if (btn) btn.focus();
        } else {
          menu.classList.add("show");
          menu.setAttribute("aria-hidden", "false");
          const first = menu.querySelector(".proc-btn");
          if (first) first.focus();
        }
      } else if (btn) {
        e.preventDefault();
        btn.click();
      }
      return;
    }

    if (e.key && e.key.toLowerCase() === "t" && !cmd && !e.altKey) {
      if (sliceBtn) {
        e.preventDefault();
        sliceBtn.click();
      }
      return;
    }

    if (e.key && e.key.toLowerCase() === "m" && !cmd && !e.altKey) {
      if (tracksToggleBtn) {
        e.preventDefault();
        tracksToggleBtn.click();
      }
      return;
    }

    if (e.key >= "1" && e.key <= "4" && !cmd && !e.altKey) {
      const targetIdx = parseInt(e.key) - 1;
      const tab = document.querySelector(`.track-tab[data-index="${targetIdx}"]`);
      if (tab) {
        e.preventDefault();
        tab.click();
      }
      return;
    }

    if (e.code === "Space") {
      e.preventDefault();
      if (sliceModeActive && selectedSliceIndex >= 0 && loopEnd > loopStart) {
        // In slice mode, Space plays/stops the selected slice
        if (playing) { stopPlayback(); } else { startPlayback(loopStart); }
      } else {
        playBtn.click();
      }
    }
    if (cmd && e.key.toLowerCase() === "z") {
      e.preventDefault();
      undoBtn.click();
    }
    if (cmd && e.key.toLowerCase() === "y") {
      e.preventDefault();
      redoBtn.click();
    }
    if (cmd && e.key.toLowerCase() === "s") {
      e.preventDefault();
      exportBtn.click();
    }
    if (cmd && e.key.toLowerCase() === "d") {
      if (e.shiftKey) {
        e.preventDefault();
        if (destroyBtn) destroyBtn.click();
      } else {
        e.preventDefault();
        duplicateLoop();
      }
    }
    if (cmd && e.key.toLowerCase() === "r") {
      e.preventDefault();
      reverseBtn.click();
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      pitchTimeShift(1.0594635);
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      pitchTimeShift(1 / 1.0594635);
    }
    if (e.key === "ArrowLeft" && !cmd && !e.altKey) {
      e.preventDefault();
      if (sliceModeActive) {
        navigateSlice(-1);
      }
    }
    if (e.key === "ArrowRight" && !cmd && !e.altKey) {
      e.preventDefault();
      if (sliceModeActive) {
        navigateSlice(1);
      } else {
        applyTransientGating(0.15);
      }
    }
    if ((e.key === "Backspace" || e.key === "Delete") && loopEnd > loopStart) {
      e.preventDefault();
      deleteLoop();
    }
  });

  async function pitchTimeShift(rate) {
    if (!current) {
      setStatus("Load a file first", 800);
      return;
    }
    if (!audioCtx) initAudioContext();
    const hasLoop = loopEnd > loopStart && loopEnd - loopStart > 0.02;
    if (!hasLoop) {
      setStatus("Select a region to pitch/time shift", 1000);
      return;
    }
    if (playing) stopPlaybackSilent();

    glitchProgressStart("Pitch Shifting...", 900);
    setTimeout(async () => {
      unfadedBuffer = null;
      fadeInLength = 0;
      fadeOutLength = 0;
      await saveState();

      const sr = audioCtx.sampleRate;
      const startSample = Math.floor(loopStart * sr);
      const endSample = Math.floor(loopEnd * sr);
      const loopData = current.slice(startSample, endSample);

      const newLoopLength = Math.floor(loopData.length / rate);
      const newLoopData = new Float32Array(newLoopLength);

      for (let i = 0; i < newLoopLength; i++) {
        const oldIndex = i * rate;
        const index1 = Math.floor(oldIndex);
        const index2 = Math.min(loopData.length - 1, index1 + 1);
        const fraction = oldIndex - index1;
        newLoopData[i] =
          loopData[index1] * (1 - fraction) + loopData[index2] * fraction;
      }

      const partAfter = current.slice(endSample);
      const newBuffer = new Float32Array(
        startSample + newLoopLength + partAfter.length
      );
      newBuffer.set(current.slice(0, startSample), 0);
      newBuffer.set(newLoopData, startSample);
      newBuffer.set(partAfter, startSample + newLoopLength);
      current = newBuffer;

      const oldLoopDuration = loopEnd - loopStart;
      const newLoopDuration = oldLoopDuration / rate;
      loopEnd = loopStart + newLoopDuration;

      updateUI();
      await saveAudioToDB(current);
      setStatus("Pitch/Time Shifted", 900);
    }, 50);
  }

  function writeWAV(arr, sr) {
    const buf = new ArrayBuffer(44 + arr.length * 2),
      view = new DataView(buf);
    const writeS = (o, s) => {
      for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i));
    };
    writeS(0, "RIFF");
    view.setUint32(4, 36 + arr.length * 2, !0);
    writeS(8, "WAVE");
    writeS(12, "fmt ");
    view.setUint32(16, 16, !0);
    view.setUint16(20, 1, !0);
    view.setUint16(22, 1, !0);
    view.setUint32(24, sr, !0);
    view.setUint32(28, sr * 2, !0);
    view.setUint16(32, 2, !0);
    view.setUint16(34, 16, !0);
    writeS(36, "data");
    view.setUint32(40, arr.length * 2, !0);
    for (let i = 0; i < arr.length; i++) {
      let s = Math.max(-1, Math.min(1, arr[i]));
      view.setInt16(44 + i * 2, s < 0 ? s * 32768 : s * 32767, !0);
    }
    return new Blob([view], { type: "audio/wav" });
  }
  if (destroyBtn) {
    destroyBtn.onclick = (e) => {
      e.stopPropagation();
      applyDestroy();
    };
  }

  exportBtn.onclick = async () => {
    if (!current) return setStatus("Load a file first", 800);
    if (!audioCtx) initAudioContext();
    glitchProgressStart("Exporting...", 600);
    setTimeout(async () => {
      try {
        let exportBuffer = current;
        const wav = writeWAV(exportBuffer, audioCtx.sampleRate);

        if (window.electron && typeof window.electron.saveFileDialog === "function") {
          const ab = await wav.arrayBuffer();
          const result = await window.electron.saveFileDialog(ab);
          if (result && result.success) {
            setStatus("Exported successfully", 2000);
          } else if (result && result.reason !== "canceled") {
            setStatus("Export failed: " + result.reason, 2000);
          } else {
            setStatus("Export canceled", 1200);
          }
          return;
        }

        const url = URL.createObjectURL(wav);
        const a = document.createElement("a");
        a.href = url;
        a.download = "databend_export_" + Date.now() + ".wav";
        a.click();
        URL.revokeObjectURL(url);
        setStatus("Exported", 1000);
      } catch (e) {
        console.error(e);
        setStatus("Export failed", 1200);
      }
    }, 250);
  };



  if (exportKitBtn) {
    exportKitBtn.onclick = async () => {
      if (!current) return setStatus("Load a file first", 800);
      if (!window.electron || !window.electron.selectExportDirectory) {
        return setStatus("Export Kit requires the Desktop app.", 2000);
      }
      
      const dirPath = await window.electron.selectExportDirectory();
      if (!dirPath) return setStatus("Export canceled", 1200);
      
      glitchProgressStart("Exporting Kit...", 600);
      setTimeout(async () => {
        try {
          const thresholdEl = document.getElementById("sliceThreshold");
          const slices = detectTransients(current, thresholdEl ? parseFloat(thresholdEl.value) : 0.08);
          if (slices.length < 2) return setStatus("Not enough slices detected.", 1200);
          
          const trackName = (tracks[activeTrackIndex] && tracks[activeTrackIndex].name) || `Track_${activeTrackIndex + 1}`;
          const baseName = trackName.replace(/\.[^/.]+$/, "");
          
          const filesArray = [];
          for (let i = 0; i < slices.length - 1; i++) {
            const start = slices[i];
            const end = slices[i + 1];
            const chunk = current.slice(start, end);
            const wav = writeWAV(chunk, audioCtx ? audioCtx.sampleRate : 44100);
            const ab = await wav.arrayBuffer();
            const paddedNum = (i + 1).toString().padStart(2, "0");
            filesArray.push({
              name: `${baseName}_slice_${paddedNum}.wav`,
              data: ab
            });
          }
          
          const result = await window.electron.saveKitFiles(dirPath, filesArray);
          if (result && result.success) {
            setStatus("Kit exported successfully", 2000);
          } else {
            setStatus("Export failed: " + result.reason, 2000);
          }
        } catch (e) {
          console.error(e);
          setStatus("Export Error", 2000);
        }
      }, 50);
    };
  }

  let currentDragTempPath = null;

  const prepareDragFile = async (getAudioChunk, prefix) => {
    if (!current || !window.electron || !window.electron.saveTempDragFile) return;
    try {
      const chunk = getAudioChunk();
      if (!chunk || chunk.length === 0) return;
      const wav = writeWAV(chunk, audioCtx ? audioCtx.sampleRate : 44100);
      const ab = await wav.arrayBuffer();
      const trackName = (tracks[activeTrackIndex] && tracks[activeTrackIndex].name) || `Track_${activeTrackIndex + 1}`;
      const baseName = trackName.replace(/\.[^/.]+$/, "");
      const fileName = `${baseName}_${prefix}_${Date.now()}.wav`;
      currentDragTempPath = await window.electron.saveTempDragFile(ab, fileName);
    } catch(err) { console.error(err); }
  };

  if (dragLoopBtn) {
    dragLoopBtn.onmousedown = () => {
      currentDragTempPath = null;
      prepareDragFile(() => {
        const hasLoop = loopEnd > loopStart && loopEnd - loopStart > 0.02;
        const sr = audioCtx ? audioCtx.sampleRate : 44100;
        return hasLoop ? current.slice(Math.floor(loopStart * sr), Math.floor(loopEnd * sr)) : current;
      }, "loop");
    };
    dragLoopBtn.ondragstart = (e) => {
      e.preventDefault();
      if (currentDragTempPath && window.electron && window.electron.startDrag) {
        window.electron.startDrag(currentDragTempPath);
      }
    };
  }

  if (dragSliceBtn) {
    dragSliceBtn.onmousedown = () => {
      currentDragTempPath = null;
      prepareDragFile(() => {
        const hasLoop = loopEnd > loopStart && loopEnd - loopStart > 0.02;
        if (!hasLoop) return null;
        const sr = audioCtx ? audioCtx.sampleRate : 44100;
        return current.slice(Math.floor(loopStart * sr), Math.floor(loopEnd * sr));
      }, "slice");
    };
    dragSliceBtn.ondragstart = (e) => {
      e.preventDefault();
      if (currentDragTempPath && window.electron && window.electron.startDrag) {
        window.electron.startDrag(currentDragTempPath);
      }
    };
  }

  /* ======= Final UI Update ======= */
  function updateTrackTabs() {
    const tabs = document.querySelectorAll(".track-tab");
    tabs.forEach((tab, idx) => {
      const t = tracks[idx];
      const name = t.buffer ? (t.name.length > 15 ? t.name.substring(0, 12) + "..." : t.name) : `Track ${idx + 1}`;
      tab.textContent = `${idx + 1}: ${name}`;
      tab.title = t.buffer ? t.name : `Track ${idx + 1} (Empty)`;
      
      // Update active state
      if (idx === activeTrackIndex) {
        tab.classList.add("active");
      } else {
        tab.classList.remove("active");
      }
    });

    const trackTabsContainer = document.getElementById("trackTabs");
    if (trackTabsContainer) {
      if (tracksModeActive) {
        trackTabsContainer.classList.add("hidden");
      } else {
        trackTabsContainer.classList.remove("hidden");
      }
    }
  }

  function updateUI() {
    updateTrackTabs();
    const splash = document.getElementById("splashScreen");
    const minimapArea = document.getElementById("minimapArea");
    if (!current || current.length === 0 || !audioCtx) {
      if (splash) splash.classList.remove("hidden");
      if (minimapArea) minimapArea.classList.add("hidden");
      return;
    }
    const dur = durationSeconds();
    const trackName = (tracks[activeTrackIndex] && tracks[activeTrackIndex].name) || `Track ${activeTrackIndex + 1}`;
    if (splash) splash.classList.add("hidden");
    if (minimapArea) {
      minimapArea.classList.remove("hidden");
      const didResize = resizeCanvases();
      drawMinimap();
      if (didResize) {
        drawWaveform();
        drawOverlay();
      }
    }
    if (sliceModeActive) {
      updateSliceToolbar();
    }
  }

  /* ======= Processors popup setup ======= */
  function setupProcessorsPopup() {
    const btn = document.getElementById("processorsBtn");
    const menu = document.getElementById("procMenu");
    const close = document.getElementById("procClose");
    if (!menu) return; // menu must exist

    function open() {
      menu.classList.add("show");
      menu.setAttribute("aria-hidden", "false");
      const first = menu.querySelector(".proc-btn");
      if (first) first.focus();
    }
    function hide() {
      menu.classList.remove("show");
      menu.setAttribute("aria-hidden", "true");
      if (btn) btn.focus();
    }

    if (btn) {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (menu.classList.contains("show")) hide();
        else open();
      });
    }

    if (close) close.addEventListener("click", hide);

    menu.addEventListener("click", (e) => {
      const t = e.target.closest("[data-target]");
      if (!t) return;
      const id = t.getAttribute("data-target");
      const orig = document.getElementById(id);
      if (orig) orig.click();
    });

    document.addEventListener("click", (e) => {
      if (!menu.classList.contains("show")) return;
      const modalOverlay = document.getElementById("modalOverlay");
      if (modalOverlay && modalOverlay.classList.contains("show")) return;
      
      const clickedInsideMenu = menu.contains(e.target);
      const clickedOnBtn = btn && (e.target === btn || btn.contains(e.target));
      if (!clickedInsideMenu && !clickedOnBtn) hide();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menu.classList.contains("show")) {
        e.preventDefault();
        hide();
      }
    });
  }

  /* ======= NEW: Transient Detection and Gating Logic ======= */

  /**
   * Detects transients in an audio buffer using a simple energy-based method.
   * Returns an array of sample indices where transients are detected.
   */
  function detectTransients(buffer, threshold = 0.1) {
    if (!buffer || buffer.length < 2048) return [];
    
    const sr = audioCtx ? audioCtx.sampleRate : 44100;
    const hopSize = 256;
    const blockSize = 512;
    const numFrames = Math.floor((buffer.length - blockSize) / hopSize) + 1;
    if (numFrames < 4) return [];
    
    // --- Pre-emphasis filter to boost high-frequency transient content ---
    const emphasized = new Float32Array(buffer.length);
    emphasized[0] = buffer[0];
    for (let i = 1; i < buffer.length; i++) {
      emphasized[i] = buffer[i] - 0.97 * buffer[i - 1];
    }
    
    // --- Multi-band energy analysis using IIR bandpass filters ---
    // Biquad bandpass filter coefficient generator
    function biquadBP(fc, bw) {
      const w0 = 2 * Math.PI * Math.min(fc, sr * 0.45) / sr;
      const sinW0 = Math.sin(w0);
      const alpha = sinW0 * Math.sinh(Math.LN2 / 2 * (bw / fc) * (w0 / sinW0));
      const a0 = 1 + alpha;
      return {
        b0: alpha / a0, b1: 0, b2: -alpha / a0,
        a1: (-2 * Math.cos(w0)) / a0, a2: (1 - alpha) / a0
      };
    }
    
    // Band definitions: [centerHz, bandwidthHz, weight]
    const bandDefs = [
      { center: 80,    bw: 160,  weight: 1.5 },  // Sub-bass (kicks)
      { center: 800,   bw: 1600, weight: 1.0 },  // Low-mid (snares, toms)
      { center: 4000,  bw: 6000, weight: 1.8 },  // Hi-mid (hi-hats, transients)
      { center: 12000, bw: 8000, weight: 1.2 },  // Presence (cymbals, air)
    ];
    
    // For each band, filter and compute per-frame RMS energy
    const bandEnergies = [];
    for (const bd of bandDefs) {
      const c = biquadBP(bd.center, bd.bw);
      const filtered = new Float32Array(buffer.length);
      let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
      for (let i = 0; i < buffer.length; i++) {
        const x0 = emphasized[i];
        const y0 = c.b0 * x0 + c.b1 * x1 + c.b2 * x2 - c.a1 * y1 - c.a2 * y2;
        filtered[i] = y0;
        x2 = x1; x1 = x0;
        y2 = y1; y1 = y0;
      }
      
      const energy = new Float32Array(numFrames);
      for (let f = 0; f < numFrames; f++) {
        const start = f * hopSize;
        let sum = 0;
        const end = Math.min(start + blockSize, filtered.length);
        for (let i = start; i < end; i++) {
          sum += filtered[i] * filtered[i];
        }
        energy[f] = Math.sqrt(sum / blockSize);
      }
      bandEnergies.push({ energy, weight: bd.weight });
    }
    
    // --- Weighted multi-band onset detection function (half-wave rectified flux) ---
    const odf = new Float32Array(numFrames);
    for (let f = 1; f < numFrames; f++) {
      let totalFlux = 0;
      for (const be of bandEnergies) {
        const diff = be.energy[f] - be.energy[f - 1];
        if (diff > 0) totalFlux += diff * be.weight;
      }
      odf[f] = totalFlux;
    }
    
    // --- Adaptive median + mean thresholding (~300ms window) ---
    const medianWinFrames = Math.max(5, Math.round(0.3 * sr / hopSize));
    const halfMW = Math.floor(medianWinFrames / 2);
    const sensitivity = 1.0 + threshold * 20.0;
    const noiseFloor = 0.0003;
    const minDistSamples = Math.floor(0.03 * sr); // 30ms minimum spacing
    
    const transients = [];
    
    for (let f = 2; f < numFrames - 2; f++) {
      const val = odf[f];
      if (val < noiseFloor) continue;
      
      // Local maximum check
      if (val < odf[f - 1] || val < odf[f + 1]) continue;
      if (f > 2 && val < odf[f - 2] * 0.95) continue;
      
      // Compute local median and mean
      const winStart = Math.max(0, f - halfMW);
      const winEnd = Math.min(numFrames, f + halfMW + 1);
      const winVals = [];
      let winSum = 0;
      for (let w = winStart; w < winEnd; w++) {
        winVals.push(odf[w]);
        winSum += odf[w];
      }
      winVals.sort((a, b) => a - b);
      const localMedian = winVals[Math.floor(winVals.length / 2)];
      const localMean = winSum / winVals.length;
      const localThresh = Math.max(localMedian, localMean) * sensitivity + noiseFloor;
      
      if (val > localThresh) {
        const centerSample = f * hopSize;
        
        // Refine onset: snap to nearest zero-crossing to prevent clicks
        let onsetIdx = centerSample;
        const searchRange = Math.min(800, Math.floor(sr * 0.02)); // Search up to 20ms
        
        for (let offset = 0; offset < searchRange; offset++) {
          let checkBack = centerSample - offset;
          if (checkBack > 0 && ((buffer[checkBack] >= 0 && buffer[checkBack - 1] < 0) || (buffer[checkBack] < 0 && buffer[checkBack - 1] >= 0))) {
            onsetIdx = checkBack;
            break;
          }
          let checkFwd = centerSample + offset;
          if (checkFwd < buffer.length - 1 && ((buffer[checkFwd] >= 0 && buffer[checkFwd - 1] < 0) || (buffer[checkFwd] < 0 && buffer[checkFwd - 1] >= 0))) {
            onsetIdx = checkFwd;
            break;
          }
        }
        
        onsetIdx = Math.max(0, Math.min(buffer.length - 1, onsetIdx));
        
        if (transients.length === 0 || onsetIdx > transients[transients.length - 1] + minDistSamples) {
          transients.push(onsetIdx);
        }
      }
    }
    
    return transients;
  }

  /**
   * Visually previews the transient gating effect by modulating the waveform amplitude.
   */
  function drawGatedWaveformPreview() {
    const w = ctx.canvas.width / devicePixelRatio;
    const h = ctx.canvas.height / devicePixelRatio;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#070709"; // Match CSS background
    ctx.fillRect(0, 0, w, h);
    
    // Draw oscilloscope background grid
    drawGrid(ctx, w, h);

    // Draw real-time FFT Spectrogram Visualizer
    if (analyser && (playing || auditioning)) {
      analyser.getByteFrequencyData(freqData);
      const numBars = freqData.length;
      const barWidth = w / numBars;
      ctx.save();
      ctx.fillStyle = "rgba(245, 158, 11, 0.12)"; // Muted warm amber
      for (let i = 0; i < numBars; i++) {
        const magnitude = freqData[i] / 255;
        const barHeight = magnitude * (h * 0.7);
        const x = i * barWidth;
        const y = (h - barHeight) / 2;
        ctx.fillRect(x, y, barWidth - 1, barHeight);
      }
      ctx.restore();
    }

    if (!current || !audioCtx) return;

    // Draw zero-crossing line
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
    ctx.restore();

    const sr = audioCtx.sampleRate;
    const hasLoop = loopEnd > loopStart && loopEnd - loopStart > 0.02;
    const startSample = hasLoop ? Math.floor(loopStart * sr) : 0;
    const endSample = hasLoop ? Math.floor(loopEnd * sr) : current.length;

    const region = current.slice(startSample, endSample);
    const transients = transientGatingState.transients;
    const ratio = transientGatingState.ratio;
    const floorLevel = 1.0 - ratio;
    const decayTime = 0.05 * sr; // 50ms decay

    // Create an envelope for the region
    const envelope = new Float32Array(region.length).fill(floorLevel);
    for (const t of transients) {
      for (let i = 0; i < decayTime && t + i < region.length; i++) {
        const val = 1.0 - i / decayTime; // Linear decay
        envelope[t + i] = Math.max(
          envelope[t + i],
          floorLevel + (1 - floorLevel) * val
        );
      }
    }

    ctx.save();
    const gateGrad = ctx.createLinearGradient(0, 0, 0, h);
    gateGrad.addColorStop(0, accent);
    gateGrad.addColorStop(0.3, hexToRGBA(accent, 0.4));
    gateGrad.addColorStop(0.5, hexToRGBA(accent, 0.05));
    gateGrad.addColorStop(0.7, hexToRGBA(accent, 0.4));
    gateGrad.addColorStop(1, accent);
    ctx.fillStyle = gateGrad;
    ctx.shadowBlur = 4;
    ctx.shadowColor = hexToRGBA(accent, 0.5);

    // Viewport visible range
    const vStartSample = Math.floor(zoomStart * current.length);
    const vEndSample = Math.ceil(zoomEnd * current.length);
    const zoomedLen = Math.max(1, vEndSample - vStartSample);
    const step = zoomedLen / w;

    for (let x = 0; x < w; x++) {
      const globalIdx = vStartSample + Math.floor(x * step);
      if (globalIdx >= current.length) break;
      let v = current[globalIdx];
      
      // Apply envelope if within the gated region
      if (globalIdx >= startSample && globalIdx < endSample) {
        const envIdx = globalIdx - startSample;
        v *= envelope[envIdx];
      }

      const y = ((v + 1) / 2) * h;
      ctx.fillRect(x, Math.min(h / 2, y), 1, Math.max(1, Math.abs(h / 2 - y) * 2));
    }
    ctx.restore();
  }

  /**
   * Applies transient gating to the selected region or the whole buffer.
   */
  async function applyTransientGating(ratio) {
    if (!current || ratio <= 0 || !audioCtx) return;
    if (playing) stopPlaybackSilent();

    glitchProgressStart("Applying Transient Gate...", 1200);

    setTimeout(async () => {
      try {
        await saveState();

        const sr = audioCtx.sampleRate;
        const hasLoop = loopEnd > loopStart && loopEnd - loopStart > 0.02;
        const startSample = hasLoop ? Math.floor(loopStart * sr) : 0;
        const endSample = hasLoop ? Math.floor(loopEnd * sr) : current.length;

        const region = current.slice(startSample, endSample);
        const transients = detectTransients(region, 0.05);

        if (transients.length < 1) {
          setStatus("No transients detected in selection", 1200);
          // undo the optimistic saveState
          if (historyIndex > 0) {
            history.pop();
            historyIndex--;
          }
          return;
        }

        const floorLevel = 1.0 - ratio;
        const decayTime = 0.05 * sr; // 50ms decay
        const envelope = new Float32Array(region.length).fill(floorLevel);

        for (const t of transients) {
          for (let i = 0; i < decayTime && t + i < region.length; i++) {
            const val = 1.0 - i / decayTime;
            envelope[t + i] = Math.max(
              envelope[t + i],
              floorLevel + (1.0 - floorLevel) * val
            );
          }
        }

        const processedRegion = new Float32Array(region.length);
        for (let i = 0; i < region.length; i++) {
          processedRegion[i] = region[i] * envelope[i];
        }

        // Re-integrate into the main buffer
        const partBefore = current.slice(0, startSample);
        const partAfter = current.slice(endSample);
        const newBuffer = new Float32Array(
          partBefore.length + processedRegion.length + partAfter.length
        );
        newBuffer.set(partBefore, 0);
        newBuffer.set(processedRegion, partBefore.length);
        newBuffer.set(partAfter, partBefore.length + processedRegion.length);
        current = newBuffer;

        updateUI();
        await saveAudioToDB(current);
        setStatus("Transient Gate Applied", 1200);
      } catch (err) {
        console.error("Transient Gating Error:", err);
        setStatus("Error during gating", 1500);
      }
    }, 50);
  }

  /* ======= SAMPLE BROWSER MANAGEMENT ======= */
  let userFolderSamples = null;
  let userFolderName = "";
  let previewSource = null;
  let previewingSampleName = null;

  function stopSamplePreview() {
    if (previewSource) {
      try {
        previewSource.stop();
      } catch (e) {}
      previewSource = null;
    }
    previewingSampleName = null;
    document.querySelectorAll(".sample-action-btn.play-btn").forEach((btn) => {
      btn.classList.remove("playing-sample");
      btn.textContent = "▶";
    });
  }

  function previewSample(name, bufferData) {
    const isAlreadyPlaying = (previewingSampleName === name);
    stopSamplePreview();
    if (isAlreadyPlaying) return;

    if (!audioCtx) initAudioContext();
    
    try {
      const buf = audioCtx.createBuffer(1, bufferData.length, audioCtx.sampleRate);
      buf.getChannelData(0).set(bufferData);
      
      const src = audioCtx.createBufferSource();
      src.buffer = buf;
      src.connect(audioCtx.destination);
      
      previewSource = src;
      previewingSampleName = name;
      
      const btn = document.querySelector(`.play-btn[data-name="${name}"]`);
      if (btn) {
        btn.classList.add("playing-sample");
        btn.textContent = "■";
      }
      
      src.start(0);
      src.onended = () => {
        if (previewingSampleName === name) {
          stopSamplePreview();
        }
      };
    } catch (err) {
      console.error("Preview error", err);
    }
  }

  function renderBrowserSamples() {
    const listContainer = document.getElementById("sampleList");
    if (!listContainer) return;
    listContainer.innerHTML = "";
    
    const list = userFolderSamples || [];
    
    if (list.length === 0) {
      const empty = document.createElement("div");
      empty.className = "sample-empty-msg";
      empty.style.padding = "20px";
      empty.style.textAlign = "center";
      empty.style.color = "var(--secondary-text-color)";
      empty.style.fontSize = "0.75rem";
      empty.textContent = "Folder is empty or no folder selected";
      listContainer.appendChild(empty);
      return;
    }
    
    list.forEach((item) => {
      const el = document.createElement("div");
      el.className = "sample-item";
      
      const info = document.createElement("div");
      info.className = "sample-item-info";
      
      const name = document.createElement("span");
      name.className = "sample-item-name";
      name.textContent = item.name;
      
      const meta = document.createElement("span");
      meta.className = "sample-item-meta";
      meta.textContent = "Local Audio File";
      
      info.appendChild(name);
      info.appendChild(meta);
      
      const actions = document.createElement("div");
      actions.className = "sample-item-actions";
      
      const playBtn = document.createElement("button");
      playBtn.className = "sample-action-btn play-btn";
      playBtn.dataset.name = item.name;
      playBtn.textContent = (previewingSampleName === item.name) ? "■" : "▶";
      if (previewingSampleName === item.name) playBtn.classList.add("playing-sample");
      
      playBtn.onclick = async (e) => {
        e.stopPropagation();
        if (previewingSampleName === item.name) {
          stopSamplePreview();
          return;
        }
        try {
          setStatus("Loading local sample preview...");
          const ab = await window.electron.loadSampleFile(item.path);
          const decoded = await audioCtx.decodeAudioData(ab);
          const len = decoded.length;
          const samp = new Float32Array(len);
          if (decoded.numberOfChannels === 1) {
            samp.set(decoded.getChannelData(0));
          } else {
            const L = decoded.getChannelData(0), R = decoded.getChannelData(1);
            for (let i = 0; i < len; i++) samp[i] = (L[i] + R[i]) * 0.5;
          }
          previewSample(item.name, samp);
          setStatus("Auditioning local sample", 1500);
        } catch (err) {
          console.error("Local file preview error", err);
          setStatus("Preview load failed", 1500);
        }
      };
      
      const impBtn = document.createElement("button");
      impBtn.className = "sample-action-btn import-btn";
      impBtn.title = "Import sample into active track";
      impBtn.textContent = "↙";
      
      impBtn.onclick = async (e) => {
        e.stopPropagation();
        stopSamplePreview();
        try {
          setStatus("Importing local file...");
          const ab = await window.electron.loadSampleFile(item.path);
          const decoded = await audioCtx.decodeAudioData(ab);
          const len = decoded.length;
          const samp = new Float32Array(len);
          if (decoded.numberOfChannels === 1) {
            samp.set(decoded.getChannelData(0));
          } else {
            const L = decoded.getChannelData(0), R = decoded.getChannelData(1);
            for (let i = 0; i < len; i++) samp[i] = (L[i] + R[i]) * 0.5;
          }
          
          if (samp) {
            current = samp;
            history = [samp.slice()];
            historyIndex = 0;
            loopStart = 0;
            loopEnd = 0;
            zoomStart = 0.0;
            zoomEnd = 1.0;
            detectedTransients = [];
            sliceModeActive = false;
            
            if (tracks[activeTrackIndex]) {
               tracks[activeTrackIndex].buffer = samp;
               tracks[activeTrackIndex].name = item.name;
               tracks[activeTrackIndex].history = [samp.slice()];
               tracks[activeTrackIndex].historyIndex = 0;
               tracks[activeTrackIndex].loopStart = 0;
               tracks[activeTrackIndex].loopEnd = 0;
               tracks[activeTrackIndex].zoomStart = 0.0;
               tracks[activeTrackIndex].zoomEnd = 1.0;
               tracks[activeTrackIndex].detectedTransients = [];
               tracks[activeTrackIndex].sliceModeActive = false;
            }
            
            updateUI();
            await saveAudioToDB(current);
            closeSampleBrowser();
            setStatus(`Imported ${item.name} to Track ${activeTrackIndex + 1}`, 2500);
          }
        } catch (err) {
          console.error("Import error", err);
          setStatus("Import failed", 2000);
        }
      };
      
      actions.appendChild(playBtn);
      actions.appendChild(impBtn);
      el.appendChild(info);
      el.appendChild(actions);
      listContainer.appendChild(el);
    });
  }

  const sampleBrowserModal = document.getElementById("sampleBrowserModal");
  const sampleBrowserClose = document.getElementById("sampleBrowserClose");
  const openFolderBtn = document.getElementById("openFolderBtn");

  function openSampleBrowser() {
    if (sampleBrowserModal) {
      sampleBrowserModal.classList.add("show");
      renderBrowserSamples();
    }
  }

  function closeSampleBrowser() {
    stopSamplePreview();
    if (sampleBrowserModal) {
      sampleBrowserModal.classList.remove("show");
    }
  }

  if (sampleBrowserClose) {
    sampleBrowserClose.onclick = closeSampleBrowser;
  }

  if (openFolderBtn) {
    openFolderBtn.onclick = async () => {
      if (window.electron && typeof window.electron.selectSampleFolder === "function") {
        try {
          setStatus("Selecting sample folder...");
          const result = await window.electron.selectSampleFolder();
          if (result) {
            userFolderSamples = result.files;
            userFolderName = result.folderName;
            
            localStorage.setItem("lastSampleFolderPath", result.dirPath);
            
            const folderLabel = document.getElementById("currentFolderName");
            if (folderLabel) folderLabel.textContent = `📁 ${userFolderName} (${userFolderSamples.length} files)`;
            
            stopSamplePreview();
            renderBrowserSamples();
            setStatus(`Opened folder: ${userFolderName}`, 2000);
          }
        } catch (err) {
          console.error("Folder open error", err);
          setStatus("Folder read failed", 2000);
        }
      } else {
        alert("Local folder browser is only available in the desktop application.");
      }
    };
  }

  // Double click bindings for splash screen
  const splash = document.getElementById("splashScreen");
  if (splash) {
    splash.addEventListener("dblclick", () => {
      if (tracksModeActive) return;
      openSampleBrowser();
    });
  }

  // Kick off the application
  init();

});

