#!/usr/bin/env bash
set -e

# ──────────────────────────────────────────────
#  aether-node installer
#  Installs the Aether node agent + Xray-core
#  Tested on: Ubuntu 22.04 / Debian 12
# ──────────────────────────────────────────────

INSTALL_DIR="/opt/aether-node"
SERVICE_NAME="aether-node"
XRAY_INSTALL_SCRIPT="https://github.com/XTLS/Xray-install/raw/main/install-release.sh"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()    { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ── Root check ──────────────────────────────────
if [ "$(id -u)" -ne 0 ]; then
  error "Run as root: sudo bash install.sh"
fi

# ── Collect inputs ───────────────────────────────
read -rp "Enter the port for aether-node to listen on [2096]: " PORT
PORT="${PORT:-2096}"

read -rp "Enter the API key (leave blank to auto-generate): " API_KEY
if [ -z "$API_KEY" ]; then
  API_KEY=$(openssl rand -hex 32)
  info "Generated API key: $API_KEY"
fi

# ── Install dependencies ─────────────────────────
info "Updating package list..."
apt-get update -qq

info "Installing Node.js 20..."
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null
  apt-get install -y nodejs >/dev/null
fi

info "Installing Xray-core..."
if ! command -v xray &>/dev/null; then
  bash -c "$(curl -fsSL $XRAY_INSTALL_SCRIPT)" @ install
fi

XRAY_BIN=$(command -v xray || echo "/usr/local/bin/xray")
info "Xray binary: $XRAY_BIN"

# ── Clone / update aether-node ───────────────────
info "Installing aether-node to $INSTALL_DIR..."
if [ -d "$INSTALL_DIR" ]; then
  cd "$INSTALL_DIR" && git pull --quiet
else
  git clone --quiet https://github.com/devmhm-eng/aether-node.git "$INSTALL_DIR"
fi

cd "$INSTALL_DIR"
npm install --omit=dev --quiet
npm run build --quiet

# ── Write .env ───────────────────────────────────
cat > "$INSTALL_DIR/.env" <<EOF
PORT=$PORT
API_KEY=$API_KEY
XRAY_EXECUTABLE=$XRAY_BIN
XRAY_CONFIG_PATH=/etc/xray/config.json
XRAY_LOG_DIR=/var/log/xray
LOG_TAIL_LINES=200
EOF

info ".env written."

# ── Create systemd service ────────────────────────
cat > "/etc/systemd/system/${SERVICE_NAME}.service" <<EOF
[Unit]
Description=Aether Node Agent
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/node $INSTALL_DIR/dist/index.js
Restart=always
RestartSec=5
EnvironmentFile=$INSTALL_DIR/.env

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now "$SERVICE_NAME"

info "──────────────────────────────────────────────"
info "aether-node installed and running!"
info ""
info "  Node agent URL:  http://$(hostname -I | awk '{print $1}'):${PORT}"
info "  API Key:         $API_KEY"
info ""
info "Add this node in your Aether panel with the above address and API key."
info ""
info "  Status:  systemctl status $SERVICE_NAME"
info "  Logs:    journalctl -u $SERVICE_NAME -f"
info "──────────────────────────────────────────────"
