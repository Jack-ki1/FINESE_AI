import { useMemo } from 'react';
import type { ColumnProfile } from '@/types';
import { formatNumber } from '@/lib/stats';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

interface AutoEDAProps {
  data: Record<string, any>[];
  profile: ColumnProfile[];
  fileName: string;
}

const COLORS = ['#f59e0b','#22d3ee','#a78bfa','#4ade80','#f87171','#fb923c'];

export function AutoEDA({ data, profile, fileName }: AutoEDAProps) {
  const numeric = profile.filter(p=>p.type==='numeric');
  const categorical = profile.filter(p=>p.type==='categorical');
  const missing = profile.filter(p=>p.nullCount>0).sort((a,b)=>b.nullCount-a.nullCount);
  const quality = Math.round((1 - profile.reduce((s,p)=>s+p.nullCount,0) / profile.reduce((s,p)=>s+p.total,0)) * 100);

  const corrData = useMemo(()=>{
    // Simple correlation matrix for numeric cols
    const cols = numeric.slice(0,5).map(p=>p.col);
    if(cols.length<2) return [];
    return cols.map(col=> {
      const row:any={col};
      cols.forEach(c2=>{
        if(col===c2) row[c2]=1;
        else {
          const pairs = data.map(r=>[Number(r[col]), Number(r[c2])]).filter(([a,b])=>!isNaN(a)&&!isNaN(b));
          const n=pairs.length; if(n<3){ row[c2]=0; return; }
          const mx=pairs.reduce((s,[a])=>s+a,0)/n, my=pairs.reduce((s,[,b])=>s+b,0)/n;
          let num=0,dx=0,dy=0; pairs.forEach(([a,b])=>{ num+=(a-mx)*(b-my); dx+=(a-mx)**2; dy+=(b-my)**2; });
          const r = Math.sqrt(dx*dy)===0?0:num/Math.sqrt(dx*dy);
          row[c2]=Number(r.toFixed(2));
        }
      });
      return row;
    });
  },[data, numeric]);

  const topOutliers = useMemo(()=> numeric.filter(p=> (p.outliers||0)>0).sort((a,b)=>(b.outliers||0)-(a.outliers||0)).slice(0,5),[numeric]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Auto-EDA — {fileName}</h3>
        <span className={`text-xs px-2 py-1 rounded-full border ${quality>=80?'bg-green-500/10 text-green-600 border-green-500/20': quality>=60?'bg-amber-500/10 text-amber-600 border-amber-500/20':'bg-red-500/10 text-red-600 border-red-500/20'}`}>Quality {quality}%</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-card p-4"><p className="text-[10px] uppercase text-muted-foreground">Rows</p><p className="text-xl font-bold">{formatNumber(data.length)}</p></div>
        <div className="rounded-xl border bg-card p-4"><p className="text-[10px] uppercase text-muted-foreground">Columns</p><p className="text-xl font-bold">{profile.length}</p></div>
        <div className="rounded-xl border bg-card p-4"><p className="text-[10px] uppercase text-muted-foreground">Numeric</p><p className="text-xl font-bold">{numeric.length}</p></div>
        <div className="rounded-xl border bg-card p-4"><p className="text-[10px] uppercase text-muted-foreground">Missing</p><p className="text-xl font-bold">{missing.length}</p></div>
      </div>

      {missing.length>0 && (
        <div className="rounded-xl border bg-card p-4">
          <h4 className="text-xs font-semibold mb-3">Missing Values</h4>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={missing.map(m=>({name:m.col, nulls:m.nullCount, pct: Math.round(m.nullCount/m.total*100)}))} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{fontSize:9}} />
              <YAxis dataKey="name" type="category" width={90} tick={{fontSize:9}} />
              <Tooltip />
              <Bar dataKey="nulls" fill="#f59e0b" radius={[0,3,3,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {corrData.length>0 && (
        <div className="rounded-xl border bg-card p-4">
          <h4 className="text-xs font-semibold mb-3">Correlation (top 5 numeric)</h4>
          <div className="overflow-auto">
            <table className="w-full text-xs">
              <thead><tr><th className="text-left p-2"></th>{corrData[0] && Object.keys(corrData[0]).filter(k=>k!=='col').map(c=><th key={c} className="p-2 text-center font-mono text-[10px]">{c}</th>)}</tr></thead>
              <tbody>
                {corrData.map(row=>(
                  <tr key={row.col} className="border-t border-border/50">
                    <td className="p-2 font-mono font-medium">{row.col}</td>
                    {Object.keys(row).filter(k=>k!=='col').map(col=>{
                      const v=row[col]; const intensity=Math.abs(v);
                      return <td key={col} className="p-2 text-center font-mono" style={{background: `rgba(245,158,11,${intensity*0.6})`, color: intensity>0.5?'white':'inherit'}}>{v}</td>
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {topOutliers.length>0 && (
        <div className="rounded-xl border bg-card p-4">
          <h4 className="text-xs font-semibold mb-2">Top Outliers</h4>
          <div className="space-y-2">
            {topOutliers.map(o=>(
              <div key={o.col} className="flex items-center justify-between text-xs">
                <span className="font-mono">{o.col}</span>
                <span className="text-muted-foreground">{o.outliers} outliers • mean {o.mean?.toFixed(1)} • std {o.std?.toFixed(1)}</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 text-[10px]">{o.min} — {o.max}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {categorical.slice(0,2).map(cat=>{
          const counts:any={}; data.forEach(r=>{ const v=String(r[cat.col]??'null'); counts[v]=(counts[v]||0)+1; });
          const chartData = Object.entries(counts).sort((a:any,b:any)=>b[1]-a[1]).slice(0,6).map(([name,value])=>({name,value}));
          return (
            <div key={cat.col} className="rounded-xl border bg-card p-4">
              <p className="text-xs font-medium mb-2">{cat.col} — top categories</p>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart><Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={50} label>{chartData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}</Pie><Tooltip /></PieChart>
              </ResponsiveContainer>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border bg-amber-500/5 p-4 border-amber-500/20">
        <h4 className="text-xs font-semibold text-amber-700 mb-2">Next steps (auto-suggested)</h4>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
          {missing.length>0 && <li>Handle missing in {missing[0].col} — {missing[0].nullCount} nulls ({Math.round(missing[0].nullCount/missing[0].total*100)}%)</li>}
          {topOutliers.length>0 && <li>Inspect outliers in {topOutliers[0].col}</li>}
          {numeric.length>=2 && <li>Explore correlation between {numeric[0]?.col} and {numeric[1]?.col}</li>}
          <li>Generate cleaning script or ask chat: "Clean this dataset"</li>
        </ul>
      </div>
    </div>
  );
}
