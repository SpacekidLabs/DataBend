const fs = require('fs');
let code = fs.readFileSync('kmeansWorker.js', 'utf8');

// Wrap it
const finalCode = "const KMEANS_WORKER_CODE = `" + code.replace(/`/g, '\\`').replace(/\$/g, '\\$') + "`;\n\n" +
"function createKMeansWorker() {\n" +
"  const blob = new Blob([KMEANS_WORKER_CODE], { type: 'application/javascript' });\n" +
"  const url = URL.createObjectURL(blob);\n" +
"  return new Worker(url);\n" +
"}\n\n" +
"window.createKMeansWorker = createKMeansWorker;\n";

fs.writeFileSync('kmeansWorker.js', finalCode);
