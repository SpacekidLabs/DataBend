const fs = require('fs');
const workerCode = fs.readFileSync('kmeansWorker.js', 'utf8');
const workerFunc = new Function('self', workerCode);
const self = {};
workerFunc(self);

self.postMessage = function(data) {
  console.log("Worker posted:", data.stage || data);
}

const rawData = new Float32Array(44100);
for(let i=0; i<rawData.length; i++) rawData[i] = Math.random() * 2 - 1;

self.onmessage({
  data: {
    rawData: rawData,
    params: {
      segmentation: 'WAVESET',
      clustering: 'KMEANS',
      clustersPerSecond: 8,
      featureWeight: 1.0
    },
    sampleRate: 44100
  }
});
