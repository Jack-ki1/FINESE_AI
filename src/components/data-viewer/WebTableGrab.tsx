import { Globe } from 'lucide-react';

// Browser-extension alternative, zero-install edition: a bookmarklet that
// pulls the largest HTML table off any webpage (internal dashboard, public
// stats page) into a CSV you upload. Complements the Sheets connector — most
// real-world grabbable data starts as an HTML table, not a file.
const BOOKMARKLET_HREF = `javascript:(function(){var s=document.createElement('script');s.src='${typeof window !== 'undefined' ? window.location.origin : ''}/finese-bookmarklet.js';document.body.appendChild(s);})()`;

export function WebTableGrab() {
  return (
    <div className="max-w-2xl space-y-4">
      <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" /> Pull a table off any webpage
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Most data worth analyzing starts as an HTML table on some dashboard — not a file. Drag this link to your
          bookmarks bar, then click it on any page with a table. The largest table downloads as CSV, ready to upload here.
        </p>
        <div>
          <a
            href={BOOKMARKLET_HREF}
            title="Drag me to your bookmarks bar"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-medium cursor-grab"
          >
            <Globe className="w-3.5 h-3.5" /> Grab table → FINESE
          </a>
          <p className="text-[11px] text-muted-foreground mt-2">← drag to bookmarks bar (clicking it here does nothing useful)</p>
        </div>
        <ol className="text-xs text-muted-foreground space-y-1 list-decimal pl-4">
          <li>Open the dashboard / wiki / stats page with the table.</li>
          <li>Click the <span className="font-medium">Grab table → FINESE</span> bookmark.</li>
          <li>Upload the downloaded <code className="font-mono">finese-table.csv</code> in the Upload tab.</li>
        </ol>
        <p className="text-[11px] text-muted-foreground border-t border-border pt-2">
          Private by construction: the bookmarklet runs entirely in the page — no data is sent anywhere until you upload the file yourself.
        </p>
      </div>
    </div>
  );
}
