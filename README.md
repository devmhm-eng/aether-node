# aether-node

Lightweight node agent for the **Aether VPN panel**. Install this on each VPS server you want to manage. The main Aether panel connects to it to push Xray configs and read stats.

## How it works

```
┌─────────────────────┐        HTTP + API Key        ┌──────────────────────┐
│   Aether Panel      │ ──────────────────────────── │   aether-node agent  │
│  (main dashboard)   │   POST /api/config            │   (this repo)        │
│                     │   GET  /api/stats             │                      │
│                     │   GET  /api/logs              │   manages Xray-core  │
└─────────────────────┘   POST /api/restart           └──────────────────────┘
```

## Quick Install (Ubuntu/Debian)

```bash
curl -fsSL https://raw.githubusercontent.com/devmhm-eng/aether-node/main/install.sh | sudo bash
```

The installer will:
1. Install Node.js 20
2. Install Xray-core via the official XTLS installer
3. Clone this repo to `/opt/aether-node`
4. Create a `.env` with your port + API key
5. Register and start a `systemd` service

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Health check + Xray status |
| POST | `/api/config` | Yes | Push new Xray config + restart |
| GET | `/api/config` | Yes | Read current config on disk |
| GET | `/api/stats` | Yes | CPU, memory, disk, Xray status |
| GET | `/api/logs` | Yes | Recent Xray log lines |
| POST | `/api/restart` | Yes | Restart Xray process |

Auth = `X-API-Key: <your-api-key>` header.

## Manual Setup

```bash
git clone https://github.com/devmhm-eng/aether-node.git
cd aether-node
cp .env.example .env
# Edit .env — set API_KEY, PORT, XRAY_EXECUTABLE
npm install
npm run build
npm start
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `2096` | Port the agent listens on |
| `API_KEY` | — | **Required.** Secret key used by the panel |
| `XRAY_EXECUTABLE` | `/usr/local/bin/xray` | Path to xray binary |
| `XRAY_CONFIG_PATH` | `/etc/xray/config.json` | Where configs are written |
| `XRAY_LOG_DIR` | `/var/log/xray` | Xray log directory |
| `LOG_TAIL_LINES` | `200` | Max log lines returned per request |
