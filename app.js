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
  const undoBtn = document.getElementById("undoBtn");
  const redoBtn = document.getElementById("redoBtn");
  const duplicateBtn = document.getElementById("duplicateBtn");
  const deleteBtn = document.getElementById("deleteBtn");
  const bitcrushBtn = document.getElementById("bitcrushBtn");
  const foldBtn = document.getElementById("foldBtn");
  const shiftBtn = document.getElementById("shiftBtn");
  const invertBtn = document.getElementById("invertBtn");
  const randomBtn = document.getElementById("randomBtn");
  const corruptBtn = document.getElementById("corruptBtn");
  const granularBtn = document.getElementById("granularBtn");
  const stutterBtn = document.getElementById("stutterBtn");
  const reverseBtn = document.getElementById("reverseBtn");
  const scrambleBtn = document.getElementById("scrambleBtn");
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
  const shredderBtn = document.getElementById("shredderBtn");
  const bitScrambleBtn = document.getElementById("bitScrambleBtn");
  // New wavelet buttons
  const waveletChaosBtn = document.getElementById("waveletChaosBtn");
  const scaleCorruptorBtn = document.getElementById("scaleCorruptorBtn");
  const waveletTreeDisruptorBtn = document.getElementById(
    "waveletTreeDisruptorBtn"
  );
  const entropyGlitchBtn = document.getElementById("entropyGlitchBtn");
  
  // Obscure processor buttons
  const muLawBtn = document.getElementById("muLawBtn");
  const bytebeatBtn = document.getElementById("bytebeatBtn");
  const phaseScrambleBtn = document.getElementById("phaseScrambleBtn");
  const selfFmBtn = document.getElementById("selfFmBtn");
  const chaosMapBtn = document.getElementById("chaosMapBtn");
  const karplusBtn = document.getElementById("karplusBtn");
  const shimmerDelayBtn = document.getElementById("shimmerDelayBtn");
  const formantFilterBtn = document.getElementById("formantFilterBtn");

  const intensityEl = document.getElementById("intensity");
  const chunkSizeEl = document.getElementById("chunkSize");
  const chunkValEl = document.getElementById("chunkVal");
  // keep the chunk number in sync with the fader
  if (chunkSizeEl && chunkValEl) {
    chunkValEl.textContent = chunkSizeEl.value;
    chunkSizeEl.addEventListener("input", () => {
      chunkValEl.textContent = chunkSizeEl.value;
    });
  }
  const statusEl = document.getElementById("status");
  const fileInfoEl = document.getElementById("fileInfo");
  const durationEl = document.getElementById("duration");
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
    loopEnd = 0;
  
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

    try {
      setStatus("Checking for saved audio...");
      const savedAudio = await loadAudioFromDB();
      if (savedAudio && savedAudio.length > 0) {
        current = savedAudio;
        history = [savedAudio.slice()];
        historyIndex = 0;
        updateUI();
        setStatus("Restored previous audio", 1200);
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
    contexts.forEach((c) => {
      const canvasEl = c.canvas;
      c.setTransform(1, 0, 0, 1, 0, 0);
      canvasEl.width = canvasEl.offsetWidth * devicePixelRatio;
      canvasEl.height = canvasEl.offsetHeight * devicePixelRatio;
      c.scale(devicePixelRatio, devicePixelRatio);
    });
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
  async function handleAudioFile(file) {
    if (!file) {
      setStatus("No file selected", 800);
      return;
    }
    setStatus("Loading " + file.name + "...");

    try {
      if (!audioCtx) initAudioContext();
      if (audioCtx.state === "suspended") await audioCtx.resume();

      const ab = await file.arrayBuffer();
      const decoded = await audioCtx.decodeAudioData(ab);

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
      updateUI();
      await saveState();
      setStatus("Loaded: " + file.name, 2000);
    } catch (err) {
      console.error("Error loading file:", err);
      setStatus("Error: " + err.message, 3000);
      alert(
        "Error loading file: " +
          err.message +
          "\n\nPlease check the browser console (F12) for more details."
      );
    }
  }

  loadBtn.onclick = () => {
    initAudioContext();
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept =
      "audio/*,audio/wav,audio/mp3,audio/ogg,audio/mpeg,audio/aac,audio/flac";
    inp.multiple = false;

    inp.onchange = (e) => {
      const file = e.target.files[0];
      handleAudioFile(file);
    };

    try {
      inp.click();
    } catch (err) {
      console.error("Error opening file picker:", err);
      alert("Could not open file picker. Please try again.");
    }
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
    } catch (err) {
      console.error("Failed to save state:", err);
      setStatus("Save failed", 1000);
    }
  }
  undoBtn.onclick = async () => {
    if (historyIndex > 0) {
      historyIndex--;
      current = history[historyIndex].slice();
      updateUI();
      setStatus("Undo");
      await saveAudioToDB(current);
    } else setStatus("Nothing to undo", 600);
  };
  redoBtn.onclick = async () => {
    if (historyIndex < history.length - 1) {
      historyIndex++;
      current = history[historyIndex].slice();
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

    if (isAuditionMode) {
      try {
        const region = current.slice(startSample, endSample);

        let oldPeak = 0;
        for (let i = 0; i < region.length; i++) {
          const a = Math.abs(region[i]);
          if (a > oldPeak) oldPeak = a;
        }
        oldPeak = Math.max(oldPeak, 1e-6);

        const processed = fn(region, { ...opts, sr });

        let newPeak = 0;
        for (let i = 0; i < processed.length; i++) {
          const a = Math.abs(processed[i]);
          if (a > newPeak) newPeak = a;
        }
        newPeak = Math.max(newPeak, 1e-6);

        const scale = oldPeak / newPeak;
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

        let oldPeak = 0;
        for (let i = 0; i < region.length; i++) {
          const a = Math.abs(region[i]);
          if (a > oldPeak) oldPeak = a;
        }
        oldPeak = Math.max(oldPeak, 1e-6);

        const processed = fn(region, { ...opts, sr });

        let newPeak = 0;
        for (let i = 0; i < processed.length; i++) {
          const a = Math.abs(processed[i]);
          if (a > newPeak) newPeak = a;
        }
        newPeak = Math.max(newPeak, 1e-6);

        const scale = oldPeak / newPeak;
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
        current = newBuffer;

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
        } else if (input.tagName === "SELECT") {
          values[key] = input.value;
        }
      }
    }
    return values;
  }

  function setupModal() {
    modalCancel.onclick = hideModal;
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
        const inputHTML = `<input type="range" id="${id}" min="${c.min}" max="${
          c.max
        }" step="${c.step || 1}" value="${c.defaultValue}">`;
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
          vDisplay = document.getElementById(`${id}-value`);
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

  /* ======= WAVELET IMPLEMENTATION END ======= */

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
            const o = new Float32Array(r.length),
              s = Math.pow(0.5, opts.bits - 1);
            for (let i = 0; i < r.length; i++)
              o[i] = s * Math.floor(r[i] / s + 0.5);
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
  shiftBtn.onclick = () =>
    applybend(
      (r) => {
        const s = Math.floor(parseInt(intensityEl.value || 50) / 10),
          d = new DataView(f32ToInt16Buffer(r));
        for (let i = 0; i < d.byteLength; i += 2) {
          let v = d.getInt16(i, !0);
          d.setInt16(i, Math.max(-32768, Math.min(32767, v << s)), !0);
        }
        return int16BufferToF32(d.buffer);
      },
      { label: "Shifting..." }
    );
  invertBtn.onclick = () =>
    applybend(
      (r) => {
        const c = parseInt(intensityEl.value || 50) / 100,
          a = new Uint8Array(f32ToInt16Buffer(r));
        for (let i = 0; i < a.length; i++)
          if (Math.random() < c) a[i] = ~a[i] & 255;
        return int16BufferToF32(a.buffer);
      },
      { label: "Inverting..." }
    );
  randomBtn.onclick = () =>
    applybend(
      (r) => {
        const c = parseInt(intensityEl.value || 50) / 100,
          d = new DataView(f32ToInt16Buffer(r));
        for (let i = 0; i < d.byteLength; i++)
          if (Math.random() < c) d.setUint8(i, Math.floor(Math.random() * 256));
        return int16BufferToF32(d.buffer);
      },
      { label: "Randomizing..." }
    );
  corruptBtn.onclick = () =>
    applybend(
      (r) => {
        const n = Math.floor(
            ((r.length * 2) / 100) * parseInt(intensityEl.value || 50)
          ),
          d = new DataView(f32ToInt16Buffer(r));
        for (let i = 0; i < n; i++)
          d.setUint8(
            Math.floor(Math.random() * d.byteLength),
            Math.floor(Math.random() * 256)
          );
        return int16BufferToF32(d.buffer);
      },
      { label: "Corrupting..." }
    );
  granularBtn.onclick = () => {
    const c = Math.max(4, parseInt(chunkSizeEl.value) || 512);
    applybend(
      (r) => {
        const o = new Float32Array(r.length),
          cs = Math.floor(r.length / c);
        if (cs < 1) return r.slice();
        for (let i = 0; i < r.length; i++) {
          const g = Math.floor(Math.random() * cs) * c;
          o[i] = r[Math.min(g + (i % c), r.length - 1)];
        }
        return o;
      },
      { label: "Granularizing..." }
    );
  };
  stutterBtn.onclick = () => {
    const c = Math.max(4, parseInt(chunkSizeEl.value) || 512);
    applybend(
      (r) => {
        const o = new Float32Array(r.length);
        for (let i = 0; i < r.length; i++) {
          const s = Math.floor(i / c) * c;
          o[i] = r[Math.min(s, r.length - 1)];
        }
        return o;
      },
      { label: "Stuttering..." }
    );
  };
  reverseBtn.onclick = () =>
    applybend(
      (r) => {
        const o = r.slice();
        o.reverse();
        return o;
      },
      { label: "Reversing..." }
    );
  scrambleBtn.onclick = () =>
    applybend(
      (r) => {
        const c = Math.max(4, parseInt(chunkSizeEl.value) || 512),
          o = r.slice();
        for (let i = 0; i < o.length; i += c) {
          const s = o.slice(i, Math.min(i + c, o.length));
          for (let j = s.length - 1; j > 0; j--) {
            const k = Math.floor(Math.random() * (j + 1));
            [s[j], s[k]] = [s[k], s[j]];
          }
          o.set(s, i);
        }
        return o;
      },
      { label: "Scrambling..." }
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
  bitScrambleBtn.onclick = () =>
    showModal({
      title: "Bit Scramble",
      controls: {
        chunkSize: {
          label: "Chunk Size (bytes)",
          min: 2,
          max: 64,
          step: 2,
          defaultValue: 8,
        },
        intensity: {
          label: "Intensity",
          min: 0,
          max: 1,
          step: 0.01,
          defaultValue: 0.5,
        },
      },
      callback: (opts) =>
        applybend(
          (r) => {
            const arr = new Uint8Array(f32ToInt16Buffer(r));
            for (let i = 0; i < arr.length; i += opts.chunkSize) {
              if (Math.random() < opts.intensity) {
                const s = arr.slice(i, i + opts.chunkSize);
                for (let j = s.length - 1; j > 0; j--) {
                  const k = Math.floor(Math.random() * (j + 1));
                  [s[j], s[k]] = [s[k], s[j]];
                }
                arr.set(s, i);
              }
            }
            return int16BufferToF32(arr.buffer);
          },
          { label: "Scrambling Bits..." }
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
            const o = new Float32Array(r.length),
              w0 = (2 * Math.PI * opts.freq) / sr,
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
            let x1 = 0,
              x2 = 0,
              y1 = 0,
              y2 = 0;
            for (let i = 0; i < r.length; i++) {
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
                fb: opts.roomSize,
              })),
              y = new Float32Array(r.length);
            for (let i = 0; i < r.length; i++) {
              let s = r[i],
                cb_out = 0;
              for (const c of cs) {
                const d = c.buf[c.idx];
                c.buf[c.idx] = s + d * c.fb;
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

  /* ======= Selection & Playback ======= */
  duplicateBtn.onclick = () => duplicateLoop();
  deleteBtn.onclick = () => deleteLoop();

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
      playSource.onended = null; // Prevent onended from firing on manual stop
      try {
        playSource.stop();
      } catch (e) {}
      try {
        playSource.disconnect();
      } catch (e) {}
      playSource = null;
    }
    playing = false;
    if (playBtn) playBtn.classList.remove("active");
  }

  function stopPlayback() {
    stopPlaybackSilent();
    setStatus("Stopped", 600);
  }

  async function startPlayback(at = 0) {
    stopPlaybackSilent();
    if (!current || current.length === 0)
      return setStatus("No audio to play", 800);
    if (!audioCtx) initAudioContext();
    if (audioCtx.state === "suspended") await audioCtx.resume();

    // Ensure `at` is a valid position
    const duration = durationSeconds();
    at = Math.max(0, Math.min(at, duration));
    lastPlayheadPos = at;

    const buf = audioCtx.createBuffer(1, current.length, audioCtx.sampleRate);
    buf.getChannelData(0).set(current);
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    src.connect(analyser || audioCtx.destination);

    playLoopActive = loopEnd > loopStart && loopEnd - loopStart > 0.02;
    if (playLoopActive) {
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
      // and we are not in a loop.
      if (src === playSource && !playLoopActive) {
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
      const [sx, ex] = loopPixels();
      const edgeTolerance = 12;
      if (sx !== null && Math.abs(x - sx) < edgeTolerance) {
        isDraggingLoopEdge = true;
        draggingEdge = "start";
      } else if (ex !== null && Math.abs(x - ex) < edgeTolerance) {
        isDraggingLoopEdge = true;
        draggingEdge = "end";
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
        let newHover = null;
        if (sx !== null && Math.abs(x - sx) < edgeTolerance) {
          overlay.style.cursor = "ew-resize";
          newHover = "start";
        } else if (ex !== null && Math.abs(x - ex) < edgeTolerance) {
          overlay.style.cursor = "ew-resize";
          newHover = "end";
        } else {
          overlay.style.cursor = "crosshair";
          newHover = null;
        }
        if (newHover !== hoveredEdge) {
          hoveredEdge = newHover;
          drawOverlay();
        }
        return;
      }
      dragCurrentX = x;

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
        } else {
          loopEnd = Math.min(durationSeconds(), Math.max(loopStart + 0.02, t));
        }
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
        if (loopEnd - loopStart < 0.02)
          loopEnd = Math.min(durationSeconds(), loopStart + 0.02);
        if (playing && playLoopActive) {
          startPlayback(loopStart);
        }
      } else if (smallMove) {
        const t = xToTime(b);
        lastPlayheadPos = t;
      } else {
        const t1 = xToTime(a),
          t2 = xToTime(b);
        loopStart = Math.min(t1, t2);
        loopEnd = Math.max(t1, t2);
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

    overlay.addEventListener("dblclick", () => {
      loopStart = 0;
      loopEnd = 0;
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
        if (posSec >= loopEnd) {
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

    if (!current) return;

    const startSample = Math.floor(zoomStart * current.length);
    const endSample = Math.ceil(zoomEnd * current.length);
    const zoomedLen = Math.max(1, endSample - startSample);
    const step = zoomedLen / w;

    if (step <= 1.0) {
      // Sub-sample precision: draw clean vector lines and dots
      ctx.save();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.5;
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
      // Traditional block min-max lines
      ctx.save();
      ctx.fillStyle = accent;
      for (let x = 0; x < w; x++) {
        const i = startSample + Math.floor(x * step);
        let min = 1, max = -1;
        const chunkEnd = Math.min(current.length, startSample + Math.ceil((x + 1) * step));
        for (let j = i; j < chunkEnd; j++) {
          const v = current[j];
          if (v < min) min = v;
          if (v > max) max = v;
        }
        const y1 = ((max + 1) / 2) * h,
          y2 = ((min + 1) / 2) * h;
        ctx.fillRect(x, y1, 1, Math.max(1, y2 - y1));
      }
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
    mctx.fillStyle = "rgba(140, 142, 154, 0.25)";
    const step = Math.ceil(current.length / w);
    for (let x = 0; x < w; x++) {
      const i = x * step;
      let min = 1, max = -1;
      for (let j = 0; j < step && i + j < current.length; j++) {
        const v = current[i + j];
        if (v < min) min = v;
        if (v > max) max = v;
      }
      const y1 = ((max + 1) / 2) * h;
      const y2 = ((min + 1) / 2) * h;
      mctx.fillRect(x, y1, 1, Math.max(1, y2 - y1));
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

    if (e.code === "Space") {
      e.preventDefault();
      playBtn.click();
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
      e.preventDefault();
      duplicateLoop();
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
    if (e.key === "ArrowRight" && !cmd && !e.altKey) {
      e.preventDefault();
      applyTransientGating(0.15);
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
  exportBtn.onclick = async () => {
    if (!current) return setStatus("Load a file first", 800);
    if (!audioCtx) initAudioContext();
    glitchProgressStart("Exporting...", 600);
    setTimeout(() => {
      try {
        const wav = writeWAV(current, audioCtx.sampleRate);
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

  /* ======= Final UI Update ======= */
  function updateUI() {
    const splash = document.getElementById("splashScreen");
    const minimapArea = document.getElementById("minimapArea");
    if (!current || current.length === 0 || !audioCtx) {
      durationEl.textContent = "0.00s";
      fileInfoEl.textContent = "No file loaded";
      if (splash) splash.classList.remove("hidden");
      if (minimapArea) minimapArea.classList.add("hidden");
      return;
    }
    const dur = durationSeconds();
    durationEl.textContent = (dur > 0 ? dur.toFixed(2) : "0.00") + "s";
    fileInfoEl.textContent = `${(current.length / 1000).toFixed(
      0
    )}k samples @ ${audioCtx.sampleRate}Hz`;
    if (splash) splash.classList.add("hidden");
    if (minimapArea) {
      minimapArea.classList.remove("hidden");
      resizeCanvases();
      drawMinimap();
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
      hide();
      if (orig) orig.click();
    });

    document.addEventListener("click", (e) => {
      if (!menu.classList.contains("show")) return;
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
    if (!buffer || buffer.length < 1024) return [];
    const transients = [];
    const chunkSize = 512;
    const historySize = 4;
    const energyHistory = [];
    for (let i = 0; i < buffer.length; i += chunkSize) {
      let blockEnergy = 0;
      for (let j = 0; j < chunkSize && i + j < buffer.length; j++) {
        blockEnergy += buffer[i + j] * buffer[i + j];
      }
      energyHistory.push(blockEnergy);
      if (energyHistory.length > historySize) energyHistory.shift();
      if (energyHistory.length === historySize) {
        const avgEnergy =
          energyHistory.slice(0, -1).reduce((a, b) => a + b, 0) /
          (historySize - 1);
        if (blockEnergy > avgEnergy * (1 + threshold) + 0.001) {
          let peakIndex = i;
          if (
            !transients.length ||
            peakIndex > transients[transients.length - 1] + chunkSize
          ) {
            transients.push(peakIndex);
          }
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
    ctx.fillStyle = accent;

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

  // Kick off the application
  init();
});
