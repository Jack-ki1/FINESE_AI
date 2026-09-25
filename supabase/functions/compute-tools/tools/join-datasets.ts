export default function joinDatasets(args: any, _data: any[]) {
  // Two calling conventions: via compute-tools (file_hash route) data is left dataset, right via args.right_data
  // or via MCP which passes {left, right} in args and _data empty.
  const { left_key, right_key, how = "inner", left, right } = args as {
    left_key: string; right_key: string; how?: "inner" | "left"; left?: any[]; right?: any[];
  };
  // For compute-tools direct call, we handle via special path in index.ts; this fallback handles MCP
  const lData: any[] = left || _data;
  const rData: any[] = right || [];
  if (!left_key || !right_key) return { error: "left_key and right_key required" };
  if (!lData?.length || !rData?.length) return { error: `both datasets must have rows (left ${lData?.length||0}, right ${rData?.length||0})` };
  const rMap = new Map<string, any[]>();
  for (const r of rData) {
    const k = String(r[right_key] ?? "");
    if (!rMap.has(k)) rMap.set(k, []);
    rMap.get(k)!.push(r);
  }
  const joined: any[] = [];
  let matched = 0, unmatched = 0;
  for (const l of lData) {
    const k = String(l[left_key] ?? "");
    const matches = rMap.get(k);
    if (matches?.length) {
      matched++;
      for (const r of matches) {
        const row: any = { ...l };
        for (const [rk, rv] of Object.entries(r)) {
          if (rk === right_key && rk === left_key) continue;
          const outKey = rk in row ? `${rk}_right` : rk;
          row[outKey] = rv;
        }
        joined.push(row);
      }
    } else {
      unmatched++;
      if (how === "left") joined.push({ ...l });
    }
  }
  return {
    verified: true,
    left_key, right_key, how,
    left_rows: lData.length,
    right_rows: rData.length,
    joined_rows: joined.length,
    matched_left_keys: matched,
    unmatched_left_keys: unmatched,
    columns: joined[0] ? Object.keys(joined[0]) : [],
    preview: joined.slice(0, 5),
    // caller can persist joined dataset if needed
  };
}
