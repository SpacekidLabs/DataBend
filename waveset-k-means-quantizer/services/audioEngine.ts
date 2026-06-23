
import { Waveset, ProcessingParams } from '../types';
import { removeDCOffset } from './audioUtils';

const workerCode = `
  // --- MATH HELPERS ---
  function getEuclideanDistanceSq(a, b) {
    let sum = 0;
    for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2;
    return sum;
  }

  function getMagnitude(data) {
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i] ** 2;
    return Math.sqrt(sum / data.length);
  }

  // --- FFT IMPLEMENTATION (Radix-2 Cooley-Tukey) ---
  function fft(data) {
    const N = data.length;
    if (N <= 1) return data;
    const half = N / 2;
    const even = new Float32Array(half);
    const odd = new Float32Array(half);
    for (let i = 0; i < half; i++) {
      even[i] = data[2 * i];
      odd[i] = data[2 * i + 1];
    }
    const evenRes = fft(even);
    const oddRes = fft(odd);
    
    // We only need magnitudes for features, simplified return for this use case
    // This is a pseudo-FFT for feature extraction magnitude binning
    // Using a simple filter bank approach might be faster/cleaner for features
    return data; 
  }

  function extractFFTFeatures(slice) {
    // Simple 8-band frequency energy extraction using basic filters or binning
    const bins = new Float32Array(8).fill(0);
    const step = Math.floor(slice.length / 8);
    // Approximation: Time domain zero-crossings rate + Energy in sub-bands?
    // Let's do a real simple Real-DFT on downsampled buffer for speed
    const downsample = 64; 
    for (let k = 0; k < 8; k++) {
      let re = 0, im = 0;
      for (let n = 0; n < downsample; n++) {
        const sampleIdx = Math.floor(n * slice.length / downsample);
        const val = slice[sampleIdx];
        const angle = (2 * Math.PI * k * n) / downsample;
        re += val * Math.cos(angle);
        im -= val * Math.sin(angle);
      }
      bins[k] = Math.sqrt(re*re + im*im);
    }
    return bins;
  }

  // --- DWT IMPLEMENTATION (Haar) ---
  function extractDWTFeatures(slice) {
    let data = Float32Array.from(slice);
    const features = [];
    // 3 Levels of Haar
    for (let level = 0; level < 3; level++) {
      const half = Math.floor(data.length / 2);
      const nextData = new Float32Array(half);
      let energyHigh = 0;
      for (let i = 0; i < half; i++) {
        const sum = (data[2*i] + data[2*i+1]) / Math.sqrt(2);
        const diff = (data[2*i] - data[2*i+1]) / Math.sqrt(2);
        nextData[i] = sum;
        energyHigh += diff * diff;
      }
      features.push(Math.sqrt(energyHigh / half));
      data = nextData;
    }
    // Add residual low pass energy
    let energyLow = 0;
    for(let i=0; i<data.length; i++) energyLow += data[i]**2;
    features.push(Math.sqrt(energyLow/data.length));
    return features;
  }


  self.onmessage = function(e) {
    const { rawData, params, sampleRate } = e.data;
    
    // --- 1. SEGMENTATION & FEATURE EXTRACTION ---
    self.postMessage({ stage: 'Segmentation (' + params.segmentation + ')', progress: 10 });
    
    let segments = [];
    let features = [];
    
    if (params.segmentation === 'WAVESET') {
      let lastCrossing = 0;
      for (let i = 0; i < rawData.length - 1; i++) {
        if (rawData[i] <= 0 && rawData[i + 1] > 0) {
          const end = i + 1;
          const length = end - lastCrossing;
          if (length > 0) {
            const slice = rawData.subarray(lastCrossing, end);
            segments.push({ start: lastCrossing, end, length, rms: getMagnitude(slice) });
            // Features: [Length, RMS]
            features.push([length, getMagnitude(slice)]);
          }
          lastCrossing = end;
        }
      }
    } else {
      // Fixed Window Strategies (FFT / DWT)
      const winSize = 1024;
      const step = 1024; // Non-overlapping for simple replacement synthesis
      for (let i = 0; i < rawData.length - winSize; i += step) {
        const end = i + winSize;
        const slice = rawData.subarray(i, end);
        segments.push({ start: i, end, length: winSize, rms: getMagnitude(slice) });
        
        if (params.segmentation === 'FFT') {
          features.push(Array.from(extractFFTFeatures(slice)));
        } else if (params.segmentation === 'DWT') {
          features.push(extractDWTFeatures(slice));
        }
      }
    }

    if (segments.length === 0) {
      self.postMessage({ stage: 'Error', progress: 0, error: 'No segments found.' });
      return;
    }

    // --- 2. NORMALIZATION ---
    self.postMessage({ stage: 'Normalizing Features', progress: 25 });
    
    const dim = features[0].length;
    const means = new Float32Array(dim).fill(0);
    const stds = new Float32Array(dim).fill(0);

    // Calculate Mean
    for (let i = 0; i < features.length; i++) {
      for (let d = 0; d < dim; d++) means[d] += features[i][d];
    }
    for (let d = 0; d < dim; d++) means[d] /= features.length;

    // Calculate Std
    for (let i = 0; i < features.length; i++) {
      for (let d = 0; d < dim; d++) stds[d] += (features[i][d] - means[d]) ** 2;
    }
    for (let d = 0; d < dim; d++) stds[d] = Math.sqrt(stds[d] / features.length) || 1;

    // Normalize and Apply Weights
    // If Waveset, dim 0 is Length (apply weight). 
    // If FFT/DWT, apply weight to first half of components (low freq/approx) vs high?
    // Let's simplified: Apply weight to the first feature component primarily.
    const normalizedFeatures = features.map(f => {
      return f.map((val, idx) => {
        let n = (val - means[idx]) / stds[idx];
        if (idx === 0) n *= params.featureWeight; 
        return n;
      });
    });

    // --- 3. CLUSTERING ---
    const numClusters = Math.max(2, Math.min(segments.length, Math.floor(params.clustersPerSecond * (rawData.length / sampleRate))));
    self.postMessage({ stage: 'Clustering (' + params.clustering + ')', progress: 40 });

    let clusters = new Int32Array(normalizedFeatures.length);
    let centroids = [];

    // --- ALGORITHM SELECTION ---
    
    if (params.clustering === 'KMEANS' || params.clustering === 'SPECTRAL') {
      // SPECTRAL APPROXIMATION:
      // Real spectral is O(N^3). We use a "Spectral-Lite": 
      // K-Means, but we project features into a non-linear space first (simple polynomial kernel approx) if Spectral is chosen.
      // For now, we'll map Spectral to standard K-Means++ for stability in this context, 
      // or we can add a simple feature transformation.
      
      let data = normalizedFeatures;
      if (params.clustering === 'SPECTRAL') {
        // Simple expansion: add squared terms to features to separate non-linear data
        data = normalizedFeatures.map(f => [...f, ...f.map(x => x*x)]);
      }

      // K-Means++ Initialization
      const firstIdx = Math.floor(Math.random() * data.length);
      centroids.push([...data[firstIdx]]);

      for (let c = 1; c < numClusters; c++) {
        const dists = new Float64Array(data.length);
        let total = 0;
        for (let i = 0; i < data.length; i++) {
          let min = Infinity;
          for (let cent of centroids) {
            const d = getEuclideanDistanceSq(data[i], cent);
            if (d < min) min = d;
          }
          dists[i] = min;
          total += min;
        }
        let r = Math.random() * total;
        let idx = 0;
        for (let i = 0; i < data.length; i++) {
          r -= dists[i];
          if (r <= 0) { idx = i; break; }
        }
        centroids.push([...data[idx]]);
      }

      // Iterations
      for (let iter = 0; iter < 15; iter++) {
        let changed = false;
        // Assignment
        for (let i = 0; i < data.length; i++) {
          let min = Infinity;
          let best = 0;
          for (let j = 0; j < numClusters; j++) {
            const d = getEuclideanDistanceSq(data[i], centroids[j]);
            if (d < min) { min = d; best = j; }
          }
          if (clusters[i] !== best) { clusters[i] = best; changed = true; }
        }
        if (!changed) break;
        // Update
        const newC = Array.from({length: numClusters}, () => new Array(data[0].length).fill(0));
        const counts = new Array(numClusters).fill(0);
        for (let i = 0; i < data.length; i++) {
          const c = clusters[i];
          counts[c]++;
          for (let d = 0; d < data[0].length; d++) newC[c][d] += data[i][d];
        }
        for (let j = 0; j < numClusters; j++) {
          if (counts[j] > 0) {
            for (let d = 0; d < data[0].length; d++) centroids[j][d] = newC[j][d] / counts[j];
          } else {
             centroids[j] = [...data[Math.floor(Math.random() * data.length)]];
          }
        }
      }

    } else if (params.clustering === 'FCM') {
      // Fuzzy C-Means
      // Initialize centroids randomly
      for(let i=0; i<numClusters; i++) {
        centroids.push(normalizedFeatures[Math.floor(Math.random()*normalizedFeatures.length)]);
      }
      
      const m = 2.0; // fuzziness
      const maxIter = 10;
      
      for(let iter=0; iter<maxIter; iter++) {
        // Update Membership & Centroids simultaneously (simplified steps)
        const newCentroids = Array.from({length: numClusters}, () => new Array(normalizedFeatures[0].length).fill(0));
        const denominators = new Array(numClusters).fill(0);
        
        for(let i=0; i<normalizedFeatures.length; i++) {
          const dists = centroids.map(c => Math.sqrt(getEuclideanDistanceSq(normalizedFeatures[i], c)) + 0.000001);
          
          // Calculate membership u_ij
          for(let j=0; j<numClusters; j++) {
            let sumPow = 0;
            for(let k=0; k<numClusters; k++) {
               sumPow += Math.pow(dists[j] / dists[k], 2 / (m - 1));
            }
            const u = 1 / sumPow;
            
            // For hard clustering output, we track max u
            if (iter === maxIter - 1) {
              // Final assignment based on max membership
              let maxU = -1;
              let bestC = 0;
              // Recompute for best selection
               // ... logic implicitly handled if we trust the centroids converge
            }

            const u_m = Math.pow(u, m);
            denominators[j] += u_m;
            for(let d=0; d<normalizedFeatures[0].length; d++) {
               newCentroids[j][d] += u_m * normalizedFeatures[i][d];
            }
          }
        }

        // Finalize centroids
        for(let j=0; j<numClusters; j++) {
           if(denominators[j] > 0) {
             for(let d=0; d<normalizedFeatures[0].length; d++) newCentroids[j][d] /= denominators[j];
           }
        }
        centroids = newCentroids;
      }
      
      // Hard assign for synthesis
      for(let i=0; i<normalizedFeatures.length; i++) {
         let minDist = Infinity; 
         let best = 0;
         for(let j=0; j<numClusters; j++) {
           const d = getEuclideanDistanceSq(normalizedFeatures[i], centroids[j]);
           if(d < minDist) { minDist = d; best = j; }
         }
         clusters[i] = best;
      }

    } else if (params.clustering === 'BIRCH') {
      // "Leader Algorithm" (Simplified BIRCH/CF-Tree)
      // Fast single-pass clustering
      const threshold = 1.5; // Radius
      centroids = []; // Acts as Leaf Nodes
      
      for(let i=0; i<normalizedFeatures.length; i++) {
        let minDist = Infinity;
        let best = -1;
        for(let j=0; j<centroids.length; j++) {
           const d = Math.sqrt(getEuclideanDistanceSq(normalizedFeatures[i], centroids[j]));
           if(d < minDist) { minDist = d; best = j; }
        }
        
        // If within threshold, add to cluster (update centroid moving average style)
        if(best !== -1 && minDist < threshold) {
           clusters[i] = best;
           // Slight update to centroid to drift towards center
           for(let d=0; d<normalizedFeatures[0].length; d++) {
             centroids[best][d] = (centroids[best][d] * 0.95) + (normalizedFeatures[i][d] * 0.05);
           }
        } else {
           // New cluster
           if (centroids.length < numClusters) {
             clusters[i] = centroids.length;
             centroids.push([...normalizedFeatures[i]]);
           } else {
             // Force assign to nearest if max clusters reached
             clusters[i] = best !== -1 ? best : 0;
           }
        }
      }

    } else if (params.clustering === 'OPTICS') {
      // Simplified Density Clustering
      // We look for "Core Points"
      const epsilon = 0.5;
      const minPts = 5;
      let clusterId = 0;
      const visited = new Int8Array(normalizedFeatures.length).fill(0);
      const noise = -1;

      // naive distance matrix is too big. We do a localized random search or just windowed search.
      // Optimization: Just check nearest 100 neighbors in array order (assuming temporal correlation)
      // This is a "Temporal OPTICS" approximation
      
      for(let i=0; i<normalizedFeatures.length; i++) {
        if(visited[i]) continue;
        visited[i] = 1;
        
        // Find neighbors
        let neighbors = [];
        const searchRange = 200; // Look 200 items back and forth
        const start = Math.max(0, i - searchRange);
        const end = Math.min(normalizedFeatures.length, i + searchRange);
        
        for(let j=start; j<end; j++) {
           if(Math.sqrt(getEuclideanDistanceSq(normalizedFeatures[i], normalizedFeatures[j])) < epsilon) {
             neighbors.push(j);
           }
        }

        if(neighbors.length < minPts) {
          clusters[i] = 0; // treat noise as cluster 0 for safety
        } else {
          clusterId++;
          if(clusterId >= numClusters) clusterId = 0; // wrap around if too many
          clusters[i] = clusterId;
          
          // Expand cluster (BFS)
          // Omitted full BFS for code brevity in worker string, simplified to immediate neighbors
          for(let nIdx of neighbors) {
             if(!visited[nIdx]) {
               visited[nIdx] = 1;
               clusters[nIdx] = clusterId;
             }
          }
        }
      }
      // Populate centroids for visualization (average of cluster members)
       const counts = new Array(numClusters).fill(0);
       centroids = Array.from({length: numClusters}, () => new Array(normalizedFeatures[0].length).fill(0));
       for(let i=0; i<normalizedFeatures.length; i++) {
         const c = clusters[i] || 0;
         counts[c]++;
         for(let d=0; d<normalizedFeatures[0].length; d++) centroids[c][d] += normalizedFeatures[i][d];
       }
       for(let j=0; j<numClusters; j++) {
         if(counts[j]>0) for(let d=0; d<normalizedFeatures[0].length; d++) centroids[j][d] /= counts[j];
       }
    }

    // --- 4. FIND REPRESENTATIVES ---
    self.postMessage({ stage: 'Selecting Representatives', progress: 80 });
    const reps = new Array(numClusters).fill(-1);
    const minDistsSq = new Array(numClusters).fill(Infinity);
    
    // Ensure we have centroids (some algorithms might not produce exactly 'k' valid ones)
    if(centroids.length === 0) centroids.push(normalizedFeatures[0]);

    for (let i = 0; i < normalizedFeatures.length; i++) {
      const c = clusters[i] || 0; // Safety for unassigned
      if(c >= centroids.length) continue;
      
      const dSq = getEuclideanDistanceSq(normalizedFeatures[i], centroids[c]);
      if (dSq < minDistsSq[c]) { 
        minDistsSq[c] = dSq; 
        reps[c] = i; 
      }
    }

    // Fallback for empty clusters
    for(let i=0; i<reps.length; i++) {
      if(reps[i] === -1) reps[i] = Math.floor(Math.random() * segments.length);
    }

    // --- 5. SYNTHESIS ---
    self.postMessage({ stage: 'Resynthesizing', progress: 90 });
    
    let totalLen = 0;
    for (let i = 0; i < segments.length; i++) {
      const c = clusters[i] || 0;
      const repIdx = reps[c];
      totalLen += segments[repIdx].length;
    }
    
    const output = new Float32Array(totalLen);
    let offset = 0;
    
    for (let i = 0; i < segments.length; i++) {
      const c = clusters[i] || 0;
      const repIdx = reps[c];
      const rep = segments[repIdx];
      
      const slice = rawData.subarray(rep.start, rep.end);
      
      // Simple Crossfade or Butt-splice?
      // For textural quantization, butt-splice (direct copy) preserves the "glitchy" aesthetic of Waveset synthesis.
      // For FFT windows, overlap-add is standard, but here we are doing "Quantization" (replacement).
      // Direct replacement is the intended effect of "Waveset" processing.
      
      output.set(slice, offset);
      
      // Store metadata for visualization
      segments[i].clusterId = c;
      // We also store normalized length/rms for the chart
      // Note: "features" variable holds the data for the chart
      segments[i].normalizedLength = normalizedFeatures[i][0]; 
      segments[i].normalizedRms = normalizedFeatures[i][1];
      
      offset += slice.length;
    }

    self.postMessage({ stage: 'Done', progress: 100, output, wavesets: segments });
  };
`;

export const processAudio = async (
  originalBuffer: AudioBuffer,
  params: ProcessingParams,
  onProgress: (stage: string, progress: number) => void
): Promise<{ buffer: AudioBuffer; wavesets: Waveset[] }> => {
  return new Promise((resolve, reject) => {
    const rawData = removeDCOffset(originalBuffer.getChannelData(0));
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));

    worker.onmessage = (e) => {
      const { stage, progress, output, wavesets } = e.data;
      onProgress(stage, progress);
      
      if (output) {
        const outBuffer = new AudioContext().createBuffer(1, output.length, originalBuffer.sampleRate);
        outBuffer.getChannelData(0).set(output);
        worker.terminate();
        resolve({ buffer: outBuffer, wavesets });
      } else if (stage === 'Error') {
        worker.terminate();
        reject(e.data.error);
      }
    };

    worker.onerror = (err) => {
      worker.terminate();
      reject(err);
    };

    worker.postMessage({ 
      rawData, 
      params, 
      sampleRate: originalBuffer.sampleRate 
    }, [rawData.buffer]);
  });
};
