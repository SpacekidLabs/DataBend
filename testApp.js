const fs = require('fs');
const workerCode = fs.readFileSync('kmeansWorker.js', 'utf8');
const workerFunc = new Function('self', workerCode);

const sr = 44100;
const region = new Float32Array(44100);
for(let i=0; i<region.length; i++) region[i] = Math.sin(2 * Math.PI * 440 * i / sr);

const worker = {};
workerFunc(worker);

worker.postMessage = function(data) {
  if(data.output) {
     console.log("Worker returned output of length", data.output.length);
     // let's check if output is different from region
     let diff = 0;
     for(let i=0; i<data.output.length && i<region.length; i++) {
        diff += Math.abs(data.output[i] - region[i]);
     }
     console.log("Difference sum:", diff);
  } else {
     console.log("Worker:", data.stage, data.progress);
  }
}

const rawData = new Float32Array(region);
worker.onmessage({
  data: {
    rawData: rawData,
    params: {
      clustersPerSecond: 8,
      featureWeight: 1.0,
      segmentation: 'WAVESET',
      clustering: 'KMEANS'
    },
    sampleRate: sr
  }
});
