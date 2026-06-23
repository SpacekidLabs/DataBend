const PYTHON_SCRIPT = `
import numpy as np
from scipy.fftpack import ifft
import scipy.signal as signal
import scipy.io.wavfile as wavfile
import sys
import json

def rotate_signal(signal_in, flip_input=False):
    """
    Performs Lossless Spectral Rotation.
    Swaps Time and Frequency axes.
    """
    sig = signal_in.astype(np.complex64)
    if flip_input:
        sig = sig[::-1]
    
    # 1. Concatenate
    part2 = sig[1:][::-1]
    sym_signal = np.concatenate((sig, part2))
    
    # 2. IFFT
    rot_sig = ifft(sym_signal)
    
    # 3. Truncate
    rot_sig = rot_sig[:len(rot_sig)//2 + 1]
    
    # 4. Energy Normalization (Required for IFFT scaling)
    input_energy = np.sum(np.abs(sig)**2)
    output_energy = np.sum(np.abs(rot_sig)**2)
    
    if output_energy > 0:
        rot_sig = rot_sig * np.sqrt(input_energy / output_energy)
    
    return np.real(rot_sig)

def apply_effect(data, effect_type, params):
    # Simplified version for DATABEND, no sub-effects needed, just pure rotation
    return data

def process_audio(input_filename, output_filename, effect_type, params_json):
    try:
        params = json.loads(params_json)
        rate, data = wavfile.read(input_filename)
        
        # Normalize
        if data.dtype == np.int16:
            data = data.astype(np.float32) / 32768.0
        elif data.dtype == np.int32:
            data = data.astype(np.float32) / 2147483648.0
        elif data.dtype == np.uint8:
            data = (data.astype(np.float32) - 128.0) / 128.0
        else:
            data = data.astype(np.float32)

        # Handle Channels
        original_shape = data.shape
        is_stereo = False
        
        if len(original_shape) == 1:
            data = data[:, np.newaxis]
        else:
            is_stereo = True
            
        num_channels = data.shape[1]
        processed_channels = []
        
        for i in range(num_channels):
            chan = data[:, i]
            
            # Rotate
            rotated = rotate_signal(chan, flip_input=False)
            
            processed_channels.append(rotated)

        # Recombine
        out_data = np.column_stack(processed_channels)
        if not is_stereo:
            out_data = out_data.flatten()
            
        out_data = np.clip(out_data, -1.0, 1.0)
        wavfile.write(output_filename, rate, out_data.astype(np.float32))
        
        return "SUCCESS"
        
    except Exception as e:
        return f"ERROR: {str(e)}"
`;

const WORKER_CODE = `
importScripts('https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js');

let pyodide = null;
let isReady = false;

async function initPyodide(pythonScript) {
  try {
    self.postMessage({ type: 'PROGRESS', payload: 'Initializing Python Engine...' });
    
    pyodide = await loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/',
      stdout: (text) => {
        if (text && text.trim()) {
           self.postMessage({ type: 'PROGRESS', payload: text });
        }
      }
    });
    
    self.postMessage({ type: 'PROGRESS', payload: 'Loading DSP Packages...' });
    await pyodide.loadPackage(['numpy', 'scipy']);
    
    pyodide.runPython(pythonScript);
    
    isReady = true;
    self.postMessage({ type: 'STATUS', payload: 'READY' });
  } catch (err) {
    self.postMessage({ type: 'STATUS', payload: 'ERROR', error: err.message });
  }
}

self.onmessage = async (event) => {
  const { type, payload } = event.data;

  if (type === 'INIT') {
     await initPyodide(payload);
     return;
  }
  
  if (type === 'PROCESS') {
    if (!pyodide || !isReady) {
      self.postMessage({ type: 'ERROR', payload: 'Pyodide not ready' });
      return;
    }

    const { fileBuffer, effect, params } = payload;
    const paramsJson = JSON.stringify(params || {});
    
    const inputFilename = 'input.wav';
    const outputFilename = 'output.wav';

    try {
       self.postMessage({ type: 'PROGRESS', payload: 'Uploading to Virtual RAM...' });
       pyodide.FS.writeFile(inputFilename, new Uint8Array(fileBuffer));
       
       pyodide.globals.set("g_input", inputFilename);
       pyodide.globals.set("g_output", outputFilename);
       pyodide.globals.set("g_effect", effect || "none");
       pyodide.globals.set("g_params", paramsJson);
       
       const pythonCmd = \`process_audio(g_input, g_output, g_effect, g_params)\`;
       self.postMessage({ type: 'PROGRESS', payload: 'Processing Spectral Rotation...' });
       const result = pyodide.runPython(pythonCmd);
       
       if (result !== 'SUCCESS') {
         throw new Error(result);
       }
       
       self.postMessage({ type: 'PROGRESS', payload: 'Downloading Master...' });
       const outputFile = pyodide.FS.readFile(outputFilename);
       
       try {
         pyodide.FS.unlink(inputFilename);
         pyodide.FS.unlink(outputFilename);
       } catch(e) {}
       
       self.postMessage({ type: 'RESULT', payload: outputFile }, [outputFile.buffer]);
       
    } catch (err) {
      self.postMessage({ type: 'ERROR', payload: err.message || 'Unknown processing error' });
    }
  }
};
`;

function createSpectralWorker() {
  const blob = new Blob([WORKER_CODE], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  return new Worker(url);
}

// Export to window so app.js can use it
window.createSpectralWorker = createSpectralWorker;
window.SPECTRAL_PYTHON_SCRIPT = PYTHON_SCRIPT;
