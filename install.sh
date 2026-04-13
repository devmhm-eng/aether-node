#!/usr/bin/env bash
set -e

# aether-node installer
# Installs the Aether node agent + Xray-core
# Tested on: Ubuntu 22.04 / Debian 12
#
# Usage (defaults):
#   curl -fsSL https://raw.githubusercontent.com/devmhm-eng/aether-node/main/install.sh | sudo bash
#
# Custom port / key:
#   PORT=3000 API_KEY=mysecret bash <(curl -fsSL ...)

INSTALL_DIR="/opt/aether-node"
SERVICE_NAME="aether-node"
XRAY_INSTALL_SCRIPT="https://github.com/XTLS/Xray-install/raw/main/install-release.sh"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# Root check
if [ "$(id -u)" -ne 0 ]; then
  error "Run as root: sudo bash install.sh"
fi

# Config — env overrides or auto-defaults
PORT="${PORT:-2096}"
API_KEY="${API_KEY:-$(openssl rand -hex 32)}"

info "Port    : $PORT"
info "API Key : $API_KEY"

# Install dependencies
info "Updating package list..."
apt-get update -qq

info "Installing Node.js 20..."
if ! command -v node > /dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null
  apt-get install -y nodejs > /dev/null
fi

info "Installing Xray-core..."
if ! command -v xray > /dev/null 2>&1; then
  bash -c "$(curl -fsSL $XRAY_INSTALL_SCRIPT)" @ install
fi

XRAY_BIN=$(command -v xray || echo "/usr/local/bin/xray")
info "Xray binary: $XRAY_BIN"

# Clone or update aether-node
info "Installing aether-node to $INSTALL_DIR..."
if [ -d "$INSTALL_DIR/.git" ]; then
  cd "$INSTALL_DIR" && git pull --quiet
else
  rm -rf "$INSTALL_DIR"
  git clone --quiet https://github.com/devmhm-eng/aether-node.git "$INSTALL_DIR"
fi

cd "$INSTALL_DIR"
npm install --omit=dev --quiet

# Write .env
cat > "$INSTALL_DIR/.env" << ENVEOF
PORT=$PORT
API_KEY=$API_KEY
XRAY_EXECUTABLE=$XRAY_BIN
XRAY_CONFIG_PATH=/etc/xray/config.json
XRAY_LOG_DIR=/var/log/xray
LOG_TAIL_LINES=200
ENVEOF

info ".env written."

# Create systemd service
cat > "/etc/systemd/system/${SERVICE_NAME}.service" << SVCEOF
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
SVCEOF

systemctl daemon-reload
systemctl enable --now "$SERVICE_NAME"

NODE_IP=$(hostname -I | awk '{print $1}')
info "----------------------------------------------"
info "aether-node installed and running!"
info ""
info "  Node agent URL : http://${NODE_IP}:${PORT}"
info "  API Key        : $API_KEY"
info ""
info "Add this node in your Aether panel with the above address and API key."
info ""
info "  Status : systemctl status $SERVICE_NAME"
info "  Logs   : journalctl -u $SERVICE_NAME -f"
info "----------------------------------------------"
