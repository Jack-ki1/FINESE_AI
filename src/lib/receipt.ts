import type { Artifact } from "@/types";
export function buildReceipt(artifact: Artifact, fileHash: string, fileName: string) {
  const raw: any = artifact as any;
  return {
    finese_receipt_version: "1.0",
    dataset: { file_hash: fileHash, file_name: fileName },
    tool: raw.toolName || raw.tool || artifact.type,
    args: raw.toolArgs || raw.args || null,
    result: artifact,
    timestamp: new Date().toISOString(),
    verified: raw.verified === true,
    note: "Re-run the tool with identical args and file_hash to reproduce. For audit, hash the dataset file and compare file_hash.",
  };
}
export function downloadReceipt(artifact: any, fileHash: string, fileName: string) {
  const receipt = buildReceipt(artifact, fileHash, fileName);
  const blob = new Blob([JSON.stringify(receipt, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `receipt_${artifact.type}_${fileHash.slice(0,8)}.json`; a.click();
  URL.revokeObjectURL(url);
}
export function receiptToIpynb(receipt: any) {
  return {
    cells: [
      { cell_type: "markdown", metadata: {}, source: [`# FINESE Receipt — ${receipt.tool}\n`, `Dataset: ${receipt.dataset.file_name} (${receipt.dataset.file_hash})\n`, `Verified: ${receipt.verified}\n`] },
      { cell_type: "code", execution_count: null, metadata: {}, outputs: [], source: [`# Reproduce via compute-tools\n# file_hash=${receipt.dataset.file_hash}\n# tool=${receipt.tool}\n# args=${JSON.stringify(receipt.args)}\n`] },
    ],
    metadata: {}, nbformat: 4, nbformat_minor: 5
  };
}
