
/**
 * Enhanced K-Means implementation with K-Means++ initialization.
 */
export interface KmeansResult {
  clusters: number[];
  centroids: number[][];
}

export const kmeans = (data: number[][], k: number, maxIterations = 20): KmeansResult => {
  if (data.length === 0) return { clusters: [], centroids: [] };
  if (k >= data.length) return { 
    clusters: data.map((_, i) => i), 
    centroids: data.map(v => [...v]) 
  };

  // 1. K-Means++ Initialization
  let centroids: number[][] = [];
  
  // Pick first centroid uniformly at random
  const firstIdx = Math.floor(Math.random() * data.length);
  centroids.push([...data[firstIdx]]);

  // Pick remaining k-1 centroids
  for (let c = 1; c < k; c++) {
    const distancesSq = new Float64Array(data.length);
    let totalDistSq = 0;

    for (let i = 0; i < data.length; i++) {
      let minDistSq = Infinity;
      for (let j = 0; j < centroids.length; j++) {
        const dSq = squaredEuclideanDistance(data[i], centroids[j]);
        if (dSq < minDistSq) minDistSq = dSq;
      }
      distancesSq[i] = minDistSq;
      totalDistSq += minDistSq;
    }

    // Weighted random selection based on distance squared
    let r = Math.random() * totalDistSq;
    let cumulativeDistSq = 0;
    let nextCentroidIdx = data.length - 1;

    for (let i = 0; i < data.length; i++) {
      cumulativeDistSq += distancesSq[i];
      if (cumulativeDistSq >= r) {
        nextCentroidIdx = i;
        break;
      }
    }
    centroids.push([...data[nextCentroidIdx]]);
  }

  let clusters: number[] = new Array(data.length).fill(0);

  for (let iter = 0; iter < maxIterations; iter++) {
    let changed = false;

    // 2. Assignment Step
    for (let i = 0; i < data.length; i++) {
      let minDistSq = Infinity;
      let clusterIdx = 0;
      for (let j = 0; j < k; j++) {
        const dSq = squaredEuclideanDistance(data[i], centroids[j]);
        if (dSq < minDistSq) {
          minDistSq = dSq;
          clusterIdx = j;
        }
      }
      if (clusters[i] !== clusterIdx) {
        clusters[i] = clusterIdx;
        changed = true;
      }
    }

    if (!changed) break;

    // 3. Update Step
    const newCentroids: number[][] = Array.from({ length: k }, () => new Array(data[0].length).fill(0));
    const counts: number[] = new Array(k).fill(0);

    for (let i = 0; i < data.length; i++) {
      const c = clusters[i];
      counts[c]++;
      for (let d = 0; d < data[0].length; d++) {
        newCentroids[c][d] += data[i][d];
      }
    }

    for (let j = 0; j < k; j++) {
      if (counts[j] > 0) {
        for (let d = 0; d < data[0].length; d++) {
          newCentroids[j][d] /= counts[j];
        }
      } else {
        newCentroids[j] = [...data[Math.floor(Math.random() * data.length)]];
      }
    }
    centroids = newCentroids;
  }

  return { clusters, centroids };
};

function squaredEuclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += (a[i] - b[i]) ** 2;
  }
  return sum;
}
