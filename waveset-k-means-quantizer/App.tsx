
import React, { useState, useCallback, useRef } from 'react';
import { Waveset, ProcessingState, ProcessingParams, SegmentationMethod, ClusteringMethod } from './types';
import { processAudio } from './services/audioEngine';
import { audioBufferToWav } from './services/audioUtils';
import ClusterChart from './components/ClusterChart';
import WaveformView from './components/WaveformView';

const App: React.FC = () => {
  const [originalBuffer, setOriginalBuffer] = useState<AudioBuffer | null>(null);
  const [processedBuffer, setProcessedBuffer] = useState<AudioBuffer | null>(null);
  const [wavesets, setWavesets] = useState<Waveset[]>([]);
  
  const [params, setParams] = useState<ProcessingParams>({
    clustersPerSecond: 6.0,
    featureWeight: 8.0,
    segmentation: 'WAVESET',
    clustering: 'KMEANS'
  });

  const [status, setStatus] = useState<ProcessingState>({
    isProcessing: false,
    stage: 'Waiting for upload',
    progress: 0,
    error: null
  });
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [exportFilename, setExportFilename] = useState<string>("waveset_quantized.wav");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus({ isProcessing: true, stage: 'Decoding Audio', progress: 0, error: null });
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer);
      setOriginalBuffer(decodedBuffer);
      setStatus({ isProcessing: false, stage: 'Ready', progress: 100, error: null });
    } catch (err) {
      console.error(err);
      setStatus({ isProcessing: false, stage: 'Error', progress: 0, error: 'Failed to decode audio file.' });
    }
  };

  const handleProcess = useCallback(async () => {
    if (!originalBuffer) return;

    setStatus({ isProcessing: true, stage: 'Initializing Worker', progress: 0, error: null });

    try {
      const { buffer, wavesets: ws } = await processAudio(
        originalBuffer, 
        params, 
        (stage, progress) => {
          setStatus(prev => ({ ...prev, stage, progress }));
        }
      );

      setProcessedBuffer(buffer);
      setWavesets(ws);
      
      const wavBlob = audioBufferToWav(buffer);
      const url = URL.createObjectURL(wavBlob);
      setProcessedUrl(url);
      
      const randomId = Math.random().toString(36).substring(2, 9);
      setExportFilename(`waveset_quantized_${randomId}.wav`);
      
      setStatus({ isProcessing: false, stage: 'Complete', progress: 100, error: null });
    } catch (err: any) {
      console.error(err);
      setStatus({ isProcessing: false, stage: 'Error', progress: 0, error: err?.toString() || 'Processing failed.' });
    }
  }, [originalBuffer, params]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <header className="mb-12 flex flex-col items-center">
        <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-widest mb-4">
          <i className="fas fa-microchip animate-pulse"></i> DSP Algorithmic Synthesis
        </div>
        <h1 className="text-6xl font-black text-white mb-4 tracking-tighter">
          WAVESET <span className="text-cyan-400">K-MEANS</span>
        </h1>
        <p className="text-slate-400 max-w-2xl text-center text-lg leading-relaxed">
          Segment audio into individual wave cycles, cluster them in feature space, and resynthesize using quantized representatives.
        </p>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Sidebar: Controls */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <i className="fas fa-sliders-h text-6xl"></i>
            </div>
            
            <h2 className="text-xl font-bold mb-8 text-white flex items-center gap-3">
              Control Panel
            </h2>
            
            <div className="space-y-8">
              
              {/* Dropdowns */}
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Segment with?</label>
                  <div className="relative">
                    <select 
                      value={params.segmentation}
                      onChange={(e) => setParams(p => ({ ...p, segmentation: e.target.value as SegmentationMethod }))}
                      className="w-full bg-slate-900 text-white rounded-xl border border-slate-600 px-4 py-3 appearance-none focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
                    >
                      <option value="WAVESET">Waveset (Zero-Crossing)</option>
                      <option value="DWT">Discrete Wavelet Transform</option>
                      <option value="FFT">Fast Fourier Transform</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                      <i className="fas fa-chevron-down text-xs"></i>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Cluster how?</label>
                  <div className="relative">
                    <select 
                      value={params.clustering}
                      onChange={(e) => setParams(p => ({ ...p, clustering: e.target.value as ClusteringMethod }))}
                      className="w-full bg-slate-900 text-white rounded-xl border border-slate-600 px-4 py-3 appearance-none focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
                    >
                      <option value="KMEANS">K-Means (Standard)</option>
                      <option value="SPECTRAL">Spectral (Approximated)</option>
                      <option value="OPTICS">OPTICS (Density)</option>
                      <option value="FCM">Fuzzy C-Means</option>
                      <option value="BIRCH">Birch (Hierarchical)</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                      <i className="fas fa-chevron-down text-xs"></i>
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-700/50"></div>

              {/* Sliders */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Cluster Density</label>
                  <span className="text-cyan-400 font-mono text-sm px-3 py-1 bg-cyan-400/10 rounded-full border border-cyan-500/20">{params.clustersPerSecond.toFixed(1)} /s</span>
                </div>
                <input 
                  type="range" min="0.5" max="40.0" step="0.5"
                  value={params.clustersPerSecond}
                  onChange={(e) => setParams(p => ({ ...p, clustersPerSecond: parseFloat(e.target.value) }))}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Feature Weight</label>
                  <span className="text-blue-400 font-mono text-sm px-3 py-1 bg-blue-400/10 rounded-full border border-blue-500/20">{params.featureWeight.toFixed(1)}x</span>
                </div>
                <input 
                  type="range" min="1.0" max="25.0" step="0.5"
                  value={params.featureWeight}
                  onChange={(e) => setParams(p => ({ ...p, featureWeight: parseFloat(e.target.value) }))}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <p className="text-[10px] text-slate-500 italic">Weights the primary feature (Length in Waveset, Low Energy in DWT/FFT).</p>
              </div>

              {!originalBuffer ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-600 rounded-2xl p-10 text-center cursor-pointer hover:border-cyan-500 hover:bg-slate-700/50 transition-all group flex flex-col items-center gap-4"
                >
                  <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center text-2xl text-slate-500 group-hover:text-cyan-400 group-hover:bg-cyan-500/10 transition-colors">
                    <i className="fas fa-upload"></i>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-300">Drop Source File</p>
                    <p className="text-[11px] text-slate-500">WAV, MP3, or AAC</p>
                  </div>
                  <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
                </div>
              ) : (
                <div className="space-y-3 pt-4">
                  <button 
                    onClick={handleProcess}
                    disabled={status.isProcessing}
                    className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-4 transition-all shadow-xl ${
                      status.isProcessing 
                      ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:scale-[1.02] active:scale-[0.98]'
                    }`}
                  >
                    {status.isProcessing ? <i className="fas fa-sync fa-spin"></i> : <i className="fas fa-play"></i>}
                    {status.isProcessing ? 'Processing DSP' : 'Render Quantization'}
                  </button>
                  <button 
                    onClick={() => { setOriginalBuffer(null); setProcessedBuffer(null); setWavesets([]); }} 
                    className="w-full py-3 text-slate-500 hover:text-red-400 text-[11px] font-bold uppercase tracking-widest transition-colors"
                  >
                    Reset Project
                  </button>
                </div>
              )}

              {status.error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-3">
                  <i className="fas fa-exclamation-triangle"></i>
                  <span>{status.error}</span>
                </div>
              )}
            </div>
          </section>

          {originalBuffer && (
            <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50 flex items-center gap-4">
               <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center text-cyan-500 shadow-inner">
                 <i className="fas fa-wave-square"></i>
               </div>
               <div className="min-w-0">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Source Buffer</p>
                 <p className="text-sm font-mono text-white truncate">{originalBuffer.duration.toFixed(2)}s @ {originalBuffer.sampleRate}Hz</p>
               </div>
            </div>
          )}
        </div>

        {/* Workspace: Results & Stats */}
        <div className="lg:col-span-8 space-y-8">
          
          {status.isProcessing && (
            <div className="bg-slate-800 p-20 rounded-[2.5rem] border border-slate-700 shadow-2xl flex flex-col items-center justify-center space-y-8 min-h-[500px]">
              <div className="relative">
                 <div className="w-24 h-24 border-[6px] border-slate-700 rounded-full"></div>
                 <div className="w-24 h-24 border-[6px] border-t-cyan-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                 <div className="absolute inset-0 flex items-center justify-center font-black text-2xl text-white">{status.progress}%</div>
              </div>
              <div className="text-center space-y-2">
                <p className="text-2xl font-black text-white uppercase tracking-tighter">{status.stage}</p>
                <p className="text-slate-500 text-sm max-w-xs mx-auto">Calculations are performed in a background worker to keep your UI reactive.</p>
              </div>
            </div>
          )}

          {!status.isProcessing && processedBuffer && (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-700">
              
              <div className="bg-slate-800 p-10 rounded-[2.5rem] border border-slate-700 shadow-2xl space-y-8">
                <div className="flex flex-col md:flex-row items-center gap-10">
                  <div className="w-40 h-40 bg-slate-900 rounded-3xl flex items-center justify-center text-6xl text-cyan-400 shadow-2xl border border-slate-700 ring-4 ring-cyan-500/5">
                    <i className="fas fa-waveform-lines"></i>
                  </div>
                  <div className="flex-1 space-y-6 text-center md:text-left">
                    <div>
                      <h3 className="text-3xl font-black text-white leading-none mb-2 tracking-tight">Synthesized Artifact</h3>
                      <p className="text-slate-500 font-mono text-sm uppercase">Mapping {wavesets.length} segments using {params.clustering} clustering</p>
                    </div>
                    
                    <WaveformView buffer={processedBuffer} />

                    {processedUrl && (
                      <div className="flex flex-wrap items-center gap-6 justify-center md:justify-start pt-2">
                        <audio controls src={processedUrl} className="h-10 opacity-90 contrast-125" />
                        <a 
                          href={processedUrl} 
                          download={exportFilename}
                          className="px-8 py-3 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-cyan-400 hover:text-slate-900 transition-all shadow-xl flex items-center gap-2"
                        >
                          <i className="fas fa-download"></i> Save Master
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8">
                <ClusterChart wavesets={wavesets} />
              </div>
            </div>
          )}

          {!status.isProcessing && !processedBuffer && (
            <div className="bg-slate-800/20 border-2 border-dashed border-slate-800 rounded-[2.5rem] p-24 flex flex-col items-center text-center space-y-8 group transition-all hover:bg-slate-800/40">
              <div className="w-28 h-28 bg-slate-800 rounded-full flex items-center justify-center text-5xl text-slate-700 group-hover:text-cyan-500 group-hover:scale-110 transition-all duration-500">
                <i className="fas fa-layer-group"></i>
              </div>
              <div className="max-w-md space-y-3">
                <h3 className="text-3xl font-black text-slate-300 tracking-tight">Granular Laboratory</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Start by uploading a short audio sample. Choose your segmentation strategy (Waveset/FFT/DWT) and clustering algorithm to generate unique textural quantization artifacts.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="mt-24 pt-10 border-t border-slate-800 text-center space-y-2">
        <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em]">Waveset K-Means Quantizer v2.0</p>
        <p className="text-slate-700 text-[10px]">Multi-strategy segmentation and clustering engine running on Web Workers.</p>
      </footer>
    </div>
  );
};

export default App;
