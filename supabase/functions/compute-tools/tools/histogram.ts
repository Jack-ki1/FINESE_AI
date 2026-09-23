export default function histogram(args: any, data: any[]) {
  const { column, bins = 10 } = args;
  const vals = data.map((r) => Number(r[column])).filter((n) => !isNaN(n));
  if (!vals.length) return { column, bins: [] };
  const min = Math.min(...vals), max = Math.max(...vals);
  const w = (max - min) / bins || 1;
  const counts = Array(bins).fill(0);
  vals.forEach((v) => { const idx = Math.min(Math.floor((v - min) / w), bins - 1); counts[idx]++; });
  return { column, bins: counts.map((c, i) => ({ range: [Math.round((min + i * w) * 100) / 100, Math.round((min + (i + 1) * w) * 100) / 100], count: c })) };
}
