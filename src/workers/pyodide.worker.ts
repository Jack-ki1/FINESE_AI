/// <reference lib="webworker" />
// Pyodide worker — runs real Python in the browser. Receives the dataset rows
// as JSON, exposes them as a pandas DataFrame named `df`, runs user code,
// returns stdout + last expression value + any error.

let pyodide: any = null;
let loading: Promise<any> | null = null;

async function load() {
  if (pyodide) return pyodide;
  if (loading) return loading;
  loading = (async () => {
    // Prefer self-hosted bundle at /pyodide/ (run `npm run vendor:pyodide`); fallback to CDN.
    const CDN_VERSION = "v0.29.3";
    const CDN_URL = `https://cdn.jsdelivr.net/pyodide/${CDN_VERSION}/full/`;
    const LOCAL_URL = "/pyodide/";
    let indexURL = CDN_URL;
    let loadUrl = `${CDN_URL}pyodide.mjs`;
    // Probe local bundle first
    try {
      const probe = await fetch(`${LOCAL_URL}pyodide.mjs`, { method: 'HEAD' });
      if (probe.ok) { indexURL = LOCAL_URL; loadUrl = `${LOCAL_URL}pyodide.mjs`; }
    } catch {}
    // @ts-expect-error - dynamic import keeps bundle small; swap to local import for self-host
    const { loadPyodide } = await import(/* @vite-ignore */ loadUrl);
    pyodide = await loadPyodide({ indexURL });
    await pyodide.loadPackage(["pandas", "numpy"]);
    return pyodide;
  })();
  return loading;
}

self.onmessage = async (e: MessageEvent) => {
  const { id, type, code, rows } = e.data;
  try {
    const py = await load();
    if (type === "ping") {
      (self as any).postMessage({ id, ok: true, ready: true });
      return;
    }
    if (rows) {
      py.globals.set("__rows_json__", JSON.stringify(rows));
      await py.runPythonAsync(`
import json, pandas as pd, numpy as np
df = pd.DataFrame(json.loads(__rows_json__))
`);
    }
    let stdout = "";
    py.setStdout({ batched: (s: string) => { stdout += s + "\n"; } });
    py.setStderr({ batched: (s: string) => { stdout += s + "\n"; } });
    const result = await py.runPythonAsync(code);
    let value = "";
    try {
      if (result !== undefined && result !== null) {
        value = result.toString ? result.toString() : String(result);
      }
    } catch {}
    (self as any).postMessage({ id, ok: true, stdout, value });
  } catch (err: any) {
    (self as any).postMessage({ id, ok: false, error: err?.message || String(err) });
  }
};

export {};