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
  offlinePreview?: boolean;
}

export interface IngestOptions {
  onUploadProgress?: (pct: number) => void;
  onUploaded?: () => void;
  signal?: AbortSignal;
}

async function localIngest(rows: Record<string, any>[], fileName: string): Promise<IngestResponse> {
  const { buildProfile, buildAdvanced, healthScore } = await import('@shared/stats/profile');
  const profile = buildProfile(rows);
  const { correlations, advanced } = buildAdvanced(rows, profile);
  const health_score = healthScore(profile);
  const file_hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(rows))).then(b=> Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join(''));
  try {
    const key = `finese-dataset-${file_hash}`;
    if (JSON.stringify(rows).length < 2_000_000) localStorage.setItem(key, JSON.stringify(rows));
    localStorage.setItem(`${key}-profile`, JSON.stringify({ file_hash, file_name: fileName, row_count: rows.length, col_count: profile.length, profile, correlations, advanced, health_score, cached: false, offlinePreview: true }));
  } catch {}
  return { file_hash, file_name: fileName, row_count: rows.length, col_count: profile.length, profile, correlations, advanced, health_score, cached: false, offlinePreview: true };
}

function isOfflinePreviewEnabled(): boolean {
  return (import.meta as any).env?.VITE_OFFLINE_PREVIEW !== 'false';
}

export async function ingestDataset(
  rows: Record<string, any>[],
  fileName: string,
  opts: IngestOptions = {}
): Promise<IngestResponse> {
  const fileExt = fileName.split(".").pop()?.toLowerCase() || "csv";
  const body = JSON.stringify({ rows, file_name: fileName, file_ext: fileExt });
  const { data: sess } = await supabase.auth.getSession();
  const token = sess?.session?.access_token;
  if (!token) throw new Error("You must be signed in to upload a dataset.");
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dataset-ingest`;

  return await new Promise<IngestResponse>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
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
      if (isOfflinePreviewEnabled()) {
        try { const local = await localIngest(rows, fileName); return resolve(local); } catch {}
      }
      reject(new Error("Network error uploading dataset"));
    };
    xhr.onabort = () => reject(new DOMException("Upload cancelled", "AbortError"));
    xhr.onload = async () => {
      let json: any = null;
      try { json = JSON.parse(xhr.responseText); } catch {}
      if (xhr.status >= 200 && xhr.status < 300 && json) return resolve(json as IngestResponse);
      if (isOfflinePreviewEnabled() && (xhr.status === 0 || xhr.status >= 500)) {
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
}

export async function loadDatasetRows(file_hash: string): Promise<any[]> {
  if (isOfflinePreviewEnabled()) {
    try {
      const local = localStorage.getItem(`finese-dataset-${file_hash}`);
      if (local) {
        // Try server first; if fails we have fallback
      }
    } catch {}
  }
  const { data, error } = await supabase.functions.invoke("dataset-fetch", {
    body: { file_hash },
  });
  if (error) {
    if (isOfflinePreviewEnabled()) {
      const local = localStorage.getItem(`finese-dataset-${file_hash}`);
      if (local) return JSON.parse(local);
    }
    throw new Error(error.message || "Failed to download dataset");
  }
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as any[];
}

export async function loadDatasetProfile(file_hash: string): Promise<IngestResponse> {
  const { data, error } = await supabase.functions.invoke("dataset-fetch", {
    body: { file_hash, profile_only: true },
  });
  if (error) {
    if (isOfflinePreviewEnabled()) {
      const local = localStorage.getItem(`finese-dataset-${file_hash}-profile`);
      if (local) return JSON.parse(local);
    }
    throw new Error(error.message || "Failed to fetch profile");
  }
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as IngestResponse;
}

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
