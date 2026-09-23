import { supabase } from "@/integrations/supabase/client";

export interface IngestResponse {
  file_hash: string;
  file_name: string;
  row_count: number;
  col_count: number;
  profile: any[];
  correlations: any[];
  advanced: any;
  health_score: number;
  cached: boolean;
}

export interface IngestOptions {
  /** Called with upload progress percentage (0-100) during the POST body upload. */
  onUploadProgress?: (pct: number) => void;
  /** Fires once the request body has finished uploading and we're waiting on the server. */
  onUploaded?: () => void;
  /** Abort in-flight request. */
  signal?: AbortSignal;
}

async function localIngest(rows: Record<string, any>[], fileName: string): Promise<IngestResponse> {
  // Open-mode fallback: compute profile locally via shared stats, no network
  const { buildProfile, buildAdvanced, healthScore } = await import('@shared/stats/profile');
  const profile = buildProfile(rows);
  const { correlations, advanced } = buildAdvanced(rows, profile);
  const health_score = healthScore(profile);
  const file_hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(rows))).then(b=> Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join(''));
  // Store locally for later load
  try {
    const key = `finese-dataset-${file_hash}`;
    // Don't store huge datasets in localStorage (5MB limit) — store preview for building
    if (JSON.stringify(rows).length < 2_000_000) localStorage.setItem(key, JSON.stringify(rows));
    localStorage.setItem(`${key}-profile`, JSON.stringify({ file_hash, file_name: fileName, row_count: rows.length, col_count: profile.length, profile, correlations, advanced, health_score, cached: false }));
  } catch {}
  return { file_hash, file_name: fileName, row_count: rows.length, col_count: profile.length, profile, correlations, advanced, health_score, cached: false };
}

export async function ingestDataset(
  rows: Record<string, any>[],
  fileName: string,
  opts: IngestOptions = {}
): Promise<IngestResponse> {
  const isOpen = (import.meta as any).env?.VITE_OPEN_MODE === 'true';
  // Try local fast path if open mode and no real session
  try {
    const fileExt = fileName.split(".").pop()?.toLowerCase() || "csv";
    const body = JSON.stringify({ rows, file_name: fileName, file_ext: fileExt });
    const { data: sess } = await supabase.auth.getSession();
    const token = sess?.session?.access_token;
    // In open mode with mock token, still try Supabase first, fallback on network error
    if (!token && !isOpen) throw new Error("You must be signed in to upload a dataset.");
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dataset-ingest`;
    // If open mode and token is mock, use local directly to avoid fetch
    if (isOpen && token === 'open-mode-jwt') {
      opts.onUploadProgress?.(100); opts.onUploaded?.();
      return await localIngest(rows, fileName);
    }

    // XHR gives us real upload-progress + cancel; fetch does not expose upload progress.
    return await new Promise<IngestResponse>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url);
      xhr.setRequestHeader("Content-Type", "application/json");
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.setRequestHeader("apikey", import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string);
      xhr.responseType = "text";

      xhr.upload.onprogress = (e) => {
        if (!e.lengthComputable) return;
        opts.onUploadProgress?.(Math.min(100, Math.round((e.loaded / e.total) * 100)));
      };
      xhr.upload.onload = () => {
        opts.onUploadProgress?.(100);
        opts.onUploaded?.();
      };
      xhr.onerror = async () => {
        if (isOpen) {
          try { const local = await localIngest(rows, fileName); return resolve(local); } catch {}
        }
        reject(new Error("Network error uploading dataset"));
      };
      xhr.onabort = () => reject(new DOMException("Upload cancelled", "AbortError"));
      xhr.onload = async () => {
        let json: any = null;
        try { json = JSON.parse(xhr.responseText); } catch { /* leave null */ }
        if (xhr.status >= 200 && xhr.status < 300 && json) return resolve(json as IngestResponse);
        // On 5xx or network-like, fallback to local in open mode
        if (isOpen && (xhr.status === 0 || xhr.status >= 500)) {
          try { const local = await localIngest(rows, fileName); return resolve(local); } catch {}
        }
        const msg = json?.error || (xhr.status === 413 ? "File is too large for the server." : `Ingest failed (${xhr.status})`);
        reject(new Error(msg));
      };

      if (opts.signal) {
        if (opts.signal.aborted) { xhr.abort(); return; }
        opts.signal.addEventListener("abort", () => xhr.abort(), { once: true });
      }

      xhr.send(body);
    });
  } catch (e:any) {
    if (isOpen && e.message?.toLowerCase().includes('fetch')) {
      return await localIngest(rows, fileName);
    }
    throw e;
  }
}

/** Download dataset rows from Storage by hash (for viewers). */
export async function loadDatasetRows(file_hash: string): Promise<any[]> {
  const isOpen = (import.meta as any).env?.VITE_OPEN_MODE === 'true';
  // Try local storage first in open mode
  if (isOpen) {
    try {
      const local = localStorage.getItem(`finese-dataset-${file_hash}`);
      if (local) return JSON.parse(local);
    } catch {}
  }
  const { data, error } = await supabase.functions.invoke("dataset-fetch", {
    body: { file_hash },
  });
  if (error) {
    if (isOpen) {
      const local = localStorage.getItem(`finese-dataset-${file_hash}`);
      if (local) return JSON.parse(local);
    }
    throw new Error(error.message || "Failed to download dataset");
  }
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as any[];
}

/** Lightweight profile fetch — does NOT download full dataset rows. */
export async function loadDatasetProfile(file_hash: string): Promise<IngestResponse> {
  const isOpen = (import.meta as any).env?.VITE_OPEN_MODE === 'true';
  if (isOpen) {
    try {
      const local = localStorage.getItem(`finese-dataset-${file_hash}-profile`);
      if (local) return JSON.parse(local);
    } catch {}
  }
  const { data, error } = await supabase.functions.invoke("dataset-fetch", {
    body: { file_hash, profile_only: true },
  });
  if (error) {
    if (isOpen) {
      const local = localStorage.getItem(`finese-dataset-${file_hash}-profile`);
      if (local) return JSON.parse(local);
    }
    throw new Error(error.message || "Failed to fetch profile");
  }
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as IngestResponse;
}

/** Run a compute tool directly (for the Pyodide alternative path). */
export async function callComputeTool(
  tool: string,
  args: any,
  file_hash: string
) {
  const { data, error } = await supabase.functions.invoke("compute-tools", {
    body: { tool, args, file_hash },
  });
  if (error) throw new Error(error.message);
  return (data as any)?.result;
}