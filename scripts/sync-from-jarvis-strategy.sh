#!/usr/bin/env bash
# sync-from-jarvis-strategy.sh
#
# Drift-Detection between Jarvis-source-files (single-source-of-truth) and
# avem-mcp-server's curated JSON files. Does NOT auto-rewrite JSON — the JSON
# content is hand-curated for brand voice + outcome language (Sprint 3 work),
# and an MD-to-JSON auto-extraction would lose that polish.
#
# Hook: runs as `predeploy` and on `npm run sync` (manual trigger).
# Exit:
#   0  — no drift, JSONs match last-known-state
#   1  — drift detected, prints which Jarvis-source-files changed
#
# When drift detected, the curator's job is:
#   1. Read the diff in the listed Jarvis-source-files
#   2. Manually update src/data/*.json with relevant changes
#   3. Run `npm run sync -- --accept` to update the state hash
#
# Sprint 1 Phase A / Avem-Bundle, 2026-05-18. Auto-sync hardening (Q2 2026).

set -euo pipefail

JARVIS_STRATEGY="/Users/pvo/01 Projects/01 Jarvis/second-brain-documents/strategy"
JARVIS_ROOT="/Users/pvo/01 Projects/01 Jarvis"
HERE="$(cd "$(dirname "$0")/.." && pwd)"
STATE_FILE="$HERE/.sync-state.json"

# Source files that the JSON tools depend on. If any of these change, the
# curator must review and update the corresponding JSON.
SOURCES=(
  "$JARVIS_STRATEGY/consulting-services.md"
  "$JARVIS_STRATEGY/case-study-25-agents.md"
  "$JARVIS_STRATEGY/walkthrough-marco-franco.md"
  "$JARVIS_STRATEGY/avem-strategy-2026.md"
  "$JARVIS_ROOT/MISSION.md"
)

# CLI flag handling
ACCEPT_MODE=false
for arg in "$@"; do
  case "$arg" in
    --accept)
      ACCEPT_MODE=true
      ;;
    --help|-h)
      echo "Usage: $0 [--accept]"
      echo ""
      echo "  (no flag)  Check drift, exit 1 if any source changed."
      echo "  --accept   Mark current source hashes as the new baseline."
      echo "             Run this AFTER manually curating JSON to match."
      exit 0
      ;;
  esac
done

# Pre-flight: all sources must exist.
for f in "${SOURCES[@]}"; do
  if [[ ! -f "$f" ]]; then
    echo "ERROR: missing source file: $f" >&2
    exit 2
  fi
done

# Compute current hash for each source.
declare -A CURRENT_HASHES
for f in "${SOURCES[@]}"; do
  hash=$(shasum -a 256 "$f" | awk '{print $1}')
  CURRENT_HASHES["$f"]="$hash"
done

# --accept mode: write hashes to state file, no drift check.
if [[ "$ACCEPT_MODE" == "true" ]]; then
  echo "{" > "$STATE_FILE"
  echo "  \"_note\": \"Auto-managed by scripts/sync-from-jarvis-strategy.sh — run --accept after manually curating JSON.\"," >> "$STATE_FILE"
  echo "  \"updated_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"," >> "$STATE_FILE"
  echo "  \"sources\": {" >> "$STATE_FILE"
  first=true
  for f in "${SOURCES[@]}"; do
    rel_path="${f#$JARVIS_ROOT/}"
    if [[ "$first" == "true" ]]; then
      first=false
    else
      echo "," >> "$STATE_FILE"
    fi
    echo -n "    \"$rel_path\": \"${CURRENT_HASHES[$f]}\"" >> "$STATE_FILE"
  done
  echo "" >> "$STATE_FILE"
  echo "  }" >> "$STATE_FILE"
  echo "}" >> "$STATE_FILE"
  echo "✓ Baseline hashes written to .sync-state.json"
  echo "  ${#SOURCES[@]} sources tracked."
  exit 0
fi

# Drift-check mode (default).
if [[ ! -f "$STATE_FILE" ]]; then
  echo "⚠ No .sync-state.json found. First-time setup."
  echo "  Run: npm run sync -- --accept  (to mark current state as baseline)"
  exit 1
fi

# Parse existing hashes via plain JSON-grep (Bash-portable, no jq dep).
drift_count=0
drift_files=()
for f in "${SOURCES[@]}"; do
  rel_path="${f#$JARVIS_ROOT/}"
  # Extract hash for this path from state file.
  prev_hash=$(grep -E "\"${rel_path//\//\\/}\":" "$STATE_FILE" | sed -E 's/.*: *"([a-f0-9]+)".*/\1/' | head -1)
  if [[ -z "$prev_hash" ]]; then
    drift_count=$((drift_count + 1))
    drift_files+=("NEW: $rel_path")
  elif [[ "$prev_hash" != "${CURRENT_HASHES[$f]}" ]]; then
    drift_count=$((drift_count + 1))
    drift_files+=("DRIFT: $rel_path")
  fi
done

if [[ $drift_count -eq 0 ]]; then
  echo "✓ Sync state matches Jarvis sources (${#SOURCES[@]} files checked)."
  exit 0
fi

echo "⚠ Drift detected in $drift_count source file(s):"
for f in "${drift_files[@]}"; do
  echo "  - $f"
done
echo ""
echo "Action required by curator:"
echo "  1. Review the diff in each drifted source file"
echo "  2. Update src/data/*.json manually with relevant changes"
echo "  3. Run: npm run sync -- --accept"
echo ""
echo "Last accepted baseline: $(grep updated_at "$STATE_FILE" | sed -E 's/.*: *"([^"]+)".*/\1/')"
exit 1
