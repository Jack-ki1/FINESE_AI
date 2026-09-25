import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useDatumStore } from "@/store/datum.store";
export function GoogleSheetsConnector() {
  const { ingest } = useDatumStore();
  const [sheetId, setSheetId] = useState("");
  const [range, setRange] = useState("Sheet1!A1:Z1000");
  const [busy, setBusy] = useState(false);
  const onImport = async () => {
    setBusy(true);
    try {
      const url = sheetId.includes("http") ? sheetId : `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&range=${encodeURIComponent(range)}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`Sheets fetch ${resp.status} — make sure sheet is "Anyone with link can view"`);
      const text = await resp.text();
      const lines = text.trim().split("\n").map(l=>l.split(","));
      const headers = lines[0].map(h=>h.trim()||"col");
      const rows = lines.slice(1).map(vals=>Object.fromEntries(headers.map((h,i)=>[h, vals[i]?.trim()??""])));
      await ingest(rows as any, `sheets_${sheetId.slice(0,8)}.csv`);
      toast.success(`Imported ${rows.length} rows from Google Sheets`);
    } catch(e:any){ toast.error(e.message); } finally { setBusy(false); }
  };
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <h4 className="text-sm font-semibold">Google Sheets — one real connector (read-only)</h4>
      <p className="text-xs text-muted-foreground">Paste a Sheet ID or full link (must be shared as "Anyone with link can view"). Manual refresh — no live sync yet.</p>
      <div><Label className="text-xs">Sheet ID or link</Label><Input value={sheetId} onChange={e=>setSheetId(e.target.value)} placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms or https://docs.google.com/..." className="h-8 font-mono text-xs"/></div>
      <div><Label className="text-xs">Range</Label><Input value={range} onChange={e=>setRange(e.target.value)} placeholder="Sheet1!A1:Z1000" className="h-8 font-mono text-xs"/></div>
      <Button size="sm" onClick={onImport} disabled={!sheetId || busy}>{busy? "Importing…":"Import Sheet (read-only)"}</Button>
    </div>
  );
}
