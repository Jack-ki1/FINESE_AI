import { useState, useRef } from 'react';
import type { Artifact } from '@/types';
import { aggregateData } from '@/lib/stats';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, ScatterChart, Scatter,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

const COLORS = ['#f59e0b', '#22d3ee', '#a78bfa', '#4ade80', '#f87171', '#fb923c', '#f472b6', '#818cf8', '#34d399', '#fbbf24', '#f97316', '#ec4899'];

const tooltipStyle = {
  backgroundColor: '#0d0d20',
  border: '1px solid #17173a',
  borderRadius: 6,
  fontSize: 11,
  color: '#eef2ff',
};

export function ChartArtifact({ artifact }: { artifact: Artifact }) {
  const { xCol, yCol, aggFn = 'sum', data = [] } = artifact;
  const [ctype, setCtype] = useState(artifact.ctype || 'bar');
  const [colorIdx, setColorIdx] = useState(0);
  const chartRef = useRef<HTMLDivElement>(null);

  if (!xCol || !yCol || !data.length) return <p className="text-xs text-muted-foreground p-4">No data available for chart</p>;

  const chartData = aggregateData(data, xCol, yCol, aggFn as any);
  const gridProps = { strokeDasharray: '3 3', stroke: '#17173a' };
  const xProps = { dataKey: 'x', tick: { fill: '#8892b0', fontSize: 10 }, angle: -35, textAnchor: 'end' as const, height: 50 };
  const yProps = { tick: { fill: '#8892b0', fontSize: 10 } };
  const mainColor = COLORS[colorIdx % COLORS.length];

  const downloadCSV = () => {
    const csv = `x,y\n${chartData.map(d => `"${d.x}",${d.y}`).join('\n')}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `chart-${xCol}-${yCol}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const downloadPNG = async () => {
    // Fallback: download as JSON if canvas not available (Recharts SVG)
    const svg = chartRef.current?.querySelector('svg');
    if (!svg) return downloadCSV();
    const data = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([data], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `chart-${xCol}-${yCol}.svg`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5 px-3 pt-2">
        <div className="flex gap-1 bg-muted/50 rounded-md p-0.5">
          {(['bar','line','area','pie','scatter'] as const).map(t => (
            <button key={t} onClick={()=>setCtype(t)} className={`px-2 py-1 text-[10px] font-mono rounded capitalize ${ctype===t ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>{t}</button>
          ))}
        </div>
        <div className="flex gap-1 ml-auto">
          {COLORS.slice(0,6).map((c,i)=> (
            <button key={c} onClick={()=>setColorIdx(i)} className={`w-5 h-5 rounded-full border-2 ${i===colorIdx ? 'border-foreground scale-110' : 'border-transparent'}`} style={{background:c}} title={c} />
          ))}
        </div>
        <button onClick={downloadCSV} className="ml-2 px-2 py-1 text-[10px] font-mono border border-border rounded hover:bg-accent">CSV</button>
        <button onClick={downloadPNG} className="px-2 py-1 text-[10px] font-mono border border-border rounded hover:bg-accent">SVG</button>
      </div>
      <div className="p-3 pt-1" ref={chartRef}>
        <ResponsiveContainer width="100%" height={210}>
          {ctype === 'line' ? (
            <LineChart data={chartData}>
              <CartesianGrid {...gridProps} />
              <XAxis {...xProps} /><YAxis {...yProps} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="y" stroke={mainColor} strokeWidth={2} dot={{ fill: mainColor, r: 3 }} />
            </LineChart>
          ) : ctype === 'area' ? (
            <AreaChart data={chartData}>
              <CartesianGrid {...gridProps} />
              <XAxis {...xProps} /><YAxis {...yProps} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="y" stroke={mainColor} fill={mainColor} fillOpacity={0.14} />
            </AreaChart>
          ) : ctype === 'pie' ? (
            <PieChart>
              <Tooltip contentStyle={tooltipStyle} />
              <Pie data={chartData} dataKey="y" nameKey="x" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={9}>
                {chartData.map((_, i) => <Cell key={i} fill={COLORS[(i+colorIdx) % COLORS.length]} />)}
              </Pie>
            </PieChart>
          ) : ctype === 'scatter' ? (
            <ScatterChart>
              <CartesianGrid {...gridProps} />
              <XAxis {...xProps} type="number" /><YAxis {...yProps} />
              <Tooltip contentStyle={tooltipStyle} />
              <Scatter data={chartData} fill={mainColor} fillOpacity={0.6} />
            </ScatterChart>
          ) : (
            <BarChart data={chartData}>
              <CartesianGrid {...gridProps} />
              <XAxis {...xProps} /><YAxis {...yProps} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="y" radius={[3, 3, 0, 0]}>
                {chartData.map((_, i) => <Cell key={i} fill={COLORS[(i+colorIdx) % COLORS.length]} />)}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
      <div className="px-3 pb-2 text-[10px] font-mono text-muted-foreground flex justify-between">
        <span>{xCol} → {yCol} ({aggFn}) • {chartData.length} groups • hover for values</span>
        <span className="text-primary">Interactive • click legend to customize</span>
      </div>
    </div>
  );
}
