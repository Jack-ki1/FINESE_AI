/* FINESE AI — "Grab this table" bookmarklet.
 *
 * Install: drag the "Grab table → FINESE" link (in Data → Web table tab) to
 * your bookmarks bar. On any page with an HTML table, click it: the largest
 * table is converted to CSV and downloaded as finese-table.csv, ready to
 * upload. Nothing leaves your machine — pure client-side DOM scraping.
 */
(function () {
  function cellText(el) {
    return (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
  }
  function csvEscape(v) {
    return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }
  var tables = Array.prototype.slice.call(document.querySelectorAll('table'));
  if (!tables.length) {
    alert('FINESE: no <table> found on this page.');
    return;
  }
  var best = null;
  var bestScore = -1;
  tables.forEach(function (t) {
    var rows = t.querySelectorAll('tr').length;
    var cells = t.querySelectorAll('td, th').length;
    var score = rows * 2 + cells;
    if (score > bestScore) { bestScore = score; best = t; }
  });
  var out = [];
  Array.prototype.forEach.call(best.querySelectorAll('tr'), function (tr) {
    var cells = tr.querySelectorAll('th, td');
    if (!cells.length) return;
    out.push(Array.prototype.map.call(cells, function (c) { return csvEscape(cellText(c)); }).join(','));
  });
  if (out.length < 2) {
    alert('FINESE: the largest table has fewer than 2 rows — nothing to grab.');
    return;
  }
  var blob = new Blob([out.join('\n')], { type: 'text/csv' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'finese-table.csv';
  document.body.appendChild(a);
  a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  alert('FINESE: grabbed ' + (out.length - 1) + ' data rows → finese-table.csv. Upload it in Data → Upload.');
})();
