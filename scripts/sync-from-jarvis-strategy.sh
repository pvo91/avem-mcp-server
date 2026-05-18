#!/usr/bin/env bash
# sync-from-jarvis-strategy.sh
#
# Pulls curated content from Jarvis strategy folder into src/data/*.json.
# Manual trigger pre-deploy. NOT automated (single-source-of-truth in Jarvis,
# avem-mcp-server is a curated public-safe subset).
#
# Sprint 1 Phase A / Avem-Bundle, 2026-05-18.

set -euo pipefail

JARVIS_STRATEGY="/Users/pvo/01 Projects/01 Jarvis/second-brain-documents/strategy"
JARVIS_ROOT="/Users/pvo/01 Projects/01 Jarvis"
HERE="$(cd "$(dirname "$0")/.." && pwd)"
DATA_DIR="$HERE/src/data"

# Pre-flight
for f in \
  "$JARVIS_STRATEGY/consulting-services.md" \
  "$JARVIS_STRATEGY/case-study-25-agents.md" \
  "$JARVIS_STRATEGY/avem-strategy-2026.md" \
  "$JARVIS_ROOT/MISSION.md"; do
  if [[ ! -f "$f" ]]; then
    echo "ERROR: missing source file: $f" >&2
    exit 1
  fi
done

echo "Sync source files:"
for f in \
  "$JARVIS_STRATEGY/consulting-services.md" \
  "$JARVIS_STRATEGY/case-study-25-agents.md" \
  "$JARVIS_STRATEGY/avem-strategy-2026.md" \
  "$JARVIS_ROOT/MISSION.md"; do
  echo "  - $f ($(wc -l <"$f") lines)"
done

echo ""
echo "Manual curation reminders (Patric):"
echo "  1. data/about.json — Founder bio + mission + tagline"
echo "  2. data/services.json — 4 listings from consulting-services.md §2"
echo "  3. data/pricing.json — Pricing tiers extracted per listing"
echo "  4. data/case-studies.json — From case-study-25-agents.md + walkthrough-marco-franco.md (sanitized)"
echo "  5. data/strategy-thesis.json — PUBLIC-SAFE subset from avem-strategy-2026.md"
echo "  6. data/cal-link.json — Cal.com URL hardcoded"
echo ""
echo "Source files have been refreshed. Curate JSON manually then run: npm run deploy:production"
echo ""

# Sanity: ensure data dir exists
mkdir -p "$DATA_DIR"

# List current data files (audit)
echo "Current src/data/ contents:"
ls -la "$DATA_DIR" 2>/dev/null || echo "  (empty)"
