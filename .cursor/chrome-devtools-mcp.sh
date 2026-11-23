#!/usr/bin/env bash
# Launch the pinned chrome-devtools-mcp from .cursor/mcp.json.
# Reuses Playwright's Chrome for Testing (pnpm exec playwright install chromium).
# Headless, an isolated profile, and the telemetry flags are args from mcp.json.
# No secrets. Linux and macOS.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [ "$#" -lt 1 ]; then
  echo "chrome-devtools-mcp: usage: chrome-devtools-mcp.sh <package-spec> [server flags...]" >&2
  exit 1
fi

PKG="$1"
shift

PINNED="$(tr -d ' \t\n' < "$ROOT/.node-version")"
WANT_MAJOR="${PINNED%%.*}"
if [ -x /usr/local/bin/node ]; then
  LOCAL_MAJOR="$(/usr/local/bin/node -p "process.versions.node.split('.')[0]")"
  if [ "$LOCAL_MAJOR" = "$WANT_MAJOR" ]; then
    PATH="/usr/local/bin:$PATH"
  fi
fi

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "chrome-devtools-mcp: node and npm must be on PATH" >&2
  exit 1
fi

EXEC="$(
  node --input-type=module -e "import { chromium } from '@playwright/test'; console.log(chromium.executablePath())"
)"
if [ ! -x "$EXEC" ]; then
  echo "chrome-devtools-mcp: Playwright Chromium is not installed (${EXEC}). Run: pnpm exec playwright install chromium" >&2
  exit 1
fi

# npm refuses to exec inside this repo (package.json devEngines requires pnpm).
# Install the pin beside the repo cache and skip puppeteer's browser download.
CACHE_DIR="${XDG_CACHE_HOME:-$HOME/.cache}/cro-sport-hub/${PKG}"
BIN="${CACHE_DIR}/node_modules/.bin/chrome-devtools-mcp"
if [ ! -x "$BIN" ]; then
  mkdir -p "$CACHE_DIR"
  echo "chrome-devtools-mcp: installing ${PKG}" >&2
  (
    cd "$CACHE_DIR"
    npm install --no-fund --no-audit --ignore-scripts --save-exact "$PKG"
  )
fi

# Ignore a user cd4a config and skip the npm update check. Flags in mcp.json still apply.
export CHROME_DEVTOOLS_MCP_NO_CONFIG_DISCOVERY=1
export CHROME_DEVTOOLS_MCP_NO_UPDATE_CHECKS=1
exec "$BIN" --executablePath="$EXEC" "$@"
