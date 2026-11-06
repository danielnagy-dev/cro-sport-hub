#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PINNED_NODE="$(tr -d ' \t\n' < "$ROOT/.node-version")"
WANT_MAJOR="${PINNED_NODE%%.*}"

need_nvm='false'
if ! command -v node >/dev/null 2>&1; then
  need_nvm='true'
else
  CURRENT_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
  if [ "$CURRENT_MAJOR" != "$WANT_MAJOR" ]; then
    need_nvm='true'
  fi
fi

if [ "$need_nvm" = 'true' ]; then
  export NVM_DIR="${NVM_DIR:-/usr/local/nvm}"
  if [ ! -s "$NVM_DIR/nvm.sh" ]; then
    sudo mkdir -p "$NVM_DIR"
    sudo chown "$(id -u)":"$(id -g)" "$NVM_DIR"
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
  fi
  # shellcheck source=/dev/null
  . "$NVM_DIR/nvm.sh"
  nvm install "$PINNED_NODE"
  nvm alias default "$PINNED_NODE"
  nvm use "$PINNED_NODE" >/dev/null
  NODE_BIN="${NVM_DIR}/versions/node/v${PINNED_NODE}/bin/node"
  if [ ! -x "$NODE_BIN" ]; then
    echo "install-cloud-agent: expected Node at $NODE_BIN" >&2
    exit 1
  fi
  NODE_DIR="$(dirname "$NODE_BIN")"
  for bin_name in node npm npx corepack; do
    sudo ln -sf "$NODE_DIR/$bin_name" "/usr/local/bin/$bin_name"
  done
fi

# Login shells on this image put `/exec-daemon` before `/usr/local/bin`, so the
# pinned Node must win for `pnpm exec` and `vp` (see `.cursor/skills/verify/SKILL.md`).
sudo tee /etc/profile.d/cro-sport-hub-local-bin-first.sh >/dev/null <<'EOF'
export PATH="/usr/local/bin:$PATH"
EOF

cd "$ROOT"
corepack enable
corepack prepare pnpm@12.15.0 --activate
pnpm install --frozen-lockfile
pnpm exec playwright install chromium --with-deps
