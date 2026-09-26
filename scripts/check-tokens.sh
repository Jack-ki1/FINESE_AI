#!/usr/bin/env bash
set -e
# Design-token lint: no raw hex literals outside index.css
# Allows hex in comments? We fail on any hex literal in src/components or src/pages TS/TSX.
# Exemptions: src/components/artifacts/ChartArtifact colors are now tokenized; google SVG fills in Auth are brand logos (allowed via comment below).
# To allow a specific line, add // allow-hex on that line.
echo "Checking for raw hex literals outside src/index.css…"
# Find hex literals, excluding lines with allow-hex and excluding index.css
if grep -rn --include='*.tsx' --include='*.ts' -E '#[0-9a-fA-F]{3,6}\b' src/components src/pages 2>/dev/null | grep -v 'allow-hex' | grep -v 'index.css'; then
  echo ""
  echo "❌ Raw hex literal found outside src/index.css (use hsl(var(--token)) instead)."
  echo "   If this is a chart palette or intentional brand asset, convert to CSS variable or add // allow-hex on that line."
  exit 1
fi
echo "✓ No raw hex literals found."
