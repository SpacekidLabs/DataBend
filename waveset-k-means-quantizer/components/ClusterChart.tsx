
import React, { useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Waveset } from '../types';

interface ClusterChartProps {
  wavesets: Waveset[];
}

const COLORS = [
  '#f87171', '#fb923c', '#fbbf24', '#facc15', '#a3e635', 
  '#4ade80', '#34d399', '#2dd4bf', '#22d3ee', '#38bdf8', 
  '#60a5fa', '#818cf8', '#a78bfa', '#c084fc', '#e879f9', '#f472b6'
];

const ClusterChart: React.FC<ClusterChartProps> = ({ wavesets }) => {
  const chartData = useMemo(() => {
    // Sample a subset for performance if the array is too large
    const step = Math.max(1, Math.floor(wavesets.length / 2000));
    return wavesets.filter((_, i) => i % step === 0).map(w => ({
      length: w.length,
      rms: w.rms,
      clusterId: w.clusterId ?? 0,
    }));
  }, [wavesets]);

  const uniqueClusters = Array.from(new Set(chartData.map(d => d.clusterId)));

  return (
    <div className="w-full h-80 bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-xl">
      <h3 className="text-slate-400 text-sm font-semibold mb-2 uppercase tracking-wider flex items-center gap-2">
        <i className="fas fa-chart-scatter"></i> Feature Space Distribution
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
          <XAxis 
            type="number" 
            dataKey="length" 
            name="Length" 
            unit=" samples" 
            stroke="#94a3b8" 
            fontSize={12}
            tickLine={false}
          />
          <YAxis 
            type="number" 
            dataKey="rms" 
            name="RMS" 
            stroke="#94a3b8" 
            fontSize={12}
            tickLine={false}
          />
          <ZAxis type="number" range={[40, 40]} />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }} 
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
          />
          <Scatter name="Wavesets" data={chartData}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.clusterId % COLORS.length]} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <p className="text-[10px] text-slate-500 mt-2 italic text-center">
        Showing up to 2000 sampled segments. X: Duration (Samples), Y: Amplitude (RMS).
      </p>
    </div>
  );
};

export default ClusterChart;
