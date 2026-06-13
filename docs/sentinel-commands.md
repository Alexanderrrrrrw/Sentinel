# Sentinel DNS — Command Reference

> Complete list of every command, API endpoint, palette action, and management operation available in Sentinel DNS.

---

## Table of Contents

- [Command Palette (Ctrl+K)](#command-palette-ctrlk)
- [REST API Endpoints](#rest-api-endpoints)
- [CLI / Docker Commands](#cli--docker-commands)
- [Install Script Flags](#install-script-flags)
- [Environment Variables](#environment-variables)
- [Network Hardening (iptables)](#network-hardening-iptables)

---

## Command Palette (Ctrl+K)

Press **Ctrl+K** (or **⌘+K** on macOS) anywhere in the dashboard to open the command palette. Type to filter, use ↑↓ to navigate, ↵ to execute, Esc to close.

### Navigation Commands

| Command | Description | Keywords |
|---|---|---|
| `Go to Dashboard` | Navigate to the main dashboard overview | `home` |
| `Go to Query Log` | Navigate to the query log / live tail page | `logs`, `queries` |
| `Go to Adlists` | Navigate to the blocklist management page | `blocklists` |
| `Go to Domains` | Navigate to the domain rules page | `rules`, `allowlist`, `denylist` |
| `Go to Heuristics` | Navigate to the heuristic scoring page | `dga`, `scoring` |
| `Go to Groups` | Navigate to the group management page | — |
| `Go to Clients` | Navigate to the client/device management page | `devices` |
| `Go to Settings` | Navigate to the settings page | `config` |

### Action Commands

| Command | Description | Keywords |
|---|---|---|
| `Update Gravity (pull blocklists)` | Triggers an immediate gravity sync — downloads all configured adlists and hot-swaps the policy engine | `refresh`, `update`, `gravity`, `pull` |
| `Enable Heuristic Engine` | Turns on the 9-signal heuristic scoring engine for all DNS queries | `heuristic`, `enable` |
| `Disable Heuristic Engine` | Turns off heuristic scoring (static blocklists + regex still active) | `heuristic`, `disable` |
| `Export Configuration` | Downloads a JSON backup of all adlists, domain rules, groups, and clients | `export`, `backup`, `config` |

### Inline Domain Actions

These commands are triggered by typing directly into the palette input:

| Syntax | Description | Example |
|---|---|---|
| `block <domain>` | Adds the domain as an exact deny rule | `block ads.example.com` |
| `allow <domain>` | Adds the domain as an exact allow (whitelist) rule | `allow youtube.com` |
| `whitelist <domain>` | Alias for `allow` | `whitelist cdn.example.com` |

---

## REST API Endpoints

All admin endpoints require the `x-admin-token` header when `SENTINEL_ADMIN_TOKEN` is set.

Base URL: `http://<pi-ip>:8080`

### Health & Metrics

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/healthz` | No | Health check — returns `ok` |
| `GET` | `/metrics` | No | Prometheus metrics scrape endpoint |

### DNS Resolution

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/resolve` | No | Resolve a domain through Sentinel's pipeline. Rate-limited: 600/min |

**Body:**
```json
{
  "client_id": "192.168.1.10",
  "query_domain": "example.com",
  "protocol": "udp"           // optional: "udp" | "dot" | "doh"
}
```

**Response:**
```json
{
  "action": "allowed",        // "allowed" | "blocked"
  "cname_chain": [],
  "response_time_ms": 3
}
```

### Query Logs

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/logs` | Yes | Query DNS log records (merged RAM + DuckDB) |
| `GET` | `/api/logs/live` | Yes | SSE stream — real-time DNS query feed |
| `GET` | `/api/stats` | Yes | Aggregated statistics (total queries, blocked, top domains) |

**Log query parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `limit` | `u32` | `100` | Max records to return (cap: 1000) |
| `offset` | `u32` | `0` | Pagination offset |
| `domain` | `string` | — | Filter by domain substring |
| `action` | `string` | — | Filter by action (`allowed` / `blocked`) |

### Adlists & Gravity

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/lists` | Yes | List all configured adlists |
| `POST` | `/api/lists` | Yes | Add a new adlist |
| `DELETE` | `/api/lists/{id}` | Yes | Delete an adlist |
| `PUT` | `/api/lists/{id}/toggle` | Yes | Enable/disable an adlist |
| `POST` | `/api/gravity/update` | Yes | Trigger immediate gravity sync (pull + hot-swap) |
| `GET` | `/api/gravity/status` | Yes | Check gravity status (bootstrap index, last sync time) |

**Create adlist body:**
```json
{
  "url": "https://raw.githubusercontent.com/.../hosts",
  "name": "My Custom List",     // optional
  "kind": "block"               // optional: "block" (default) | "allow"
}
```

**Toggle body:**
```json
{ "enabled": true }
```

### Domain Rules

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/domains` | Yes | List all domain rules |
| `POST` | `/api/domains` | Yes | Create a domain rule |
| `DELETE` | `/api/domains/{id}` | Yes | Delete a domain rule |
| `PUT` | `/api/domains/{id}/toggle` | Yes | Enable/disable a domain rule |

**Create domain rule body:**
```json
{
  "kind": "exact_deny",       // "exact_deny" | "exact_allow" | "regex_deny" | "regex_allow"
  "value": "ads.example.com",
  "comment": "Blocked manually" // optional
}
```

### Groups

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/groups` | Yes | List all groups |
| `POST` | `/api/groups` | Yes | Create a group |
| `DELETE` | `/api/groups/{id}` | Yes | Delete a group |
| `PUT` | `/api/groups/{group_id}/adlists/{adlist_id}` | Yes | Assign an adlist to a group |
| `DELETE` | `/api/groups/{group_id}/adlists/{adlist_id}` | Yes | Remove an adlist from a group |
| `PUT` | `/api/groups/{group_id}/rules/{rule_id}` | Yes | Assign a domain rule to a group |
| `DELETE` | `/api/groups/{group_id}/rules/{rule_id}` | Yes | Remove a domain rule from a group |

**Create group body:**
```json
{
  "name": "Kids Devices",
  "description": "Extra-strict filtering" // optional
}
```

### Clients

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/clients` | Yes | List all managed clients |
| `POST` | `/api/clients` | Yes | Create or update a client |
| `DELETE` | `/api/clients/{id}` | Yes | Delete a client |
| `GET` | `/api/discovered-clients` | Yes | List mDNS-discovered clients (auto-detected devices) |

**Upsert client body:**
```json
{
  "ip": "192.168.1.42",
  "name": "Living Room TV",    // optional
  "group_ids": [1, 3]          // optional
}
```

### Devices (Policy)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/devices` | Yes | List all device policies |
| `POST` | `/api/devices` | Yes | Create or update a device policy |
| `GET` | `/api/devices/{id}` | Yes | Get a specific device policy |

**Upsert device body:**
```json
{
  "mac_address": "AA:BB:CC:DD:EE:FF",
  "group_memberships": ["default"],
  "wireguard_enabled": false,
  "risk_policy_mode": "block"   // "block" | "bypass"
}
```

### Heuristic Scoring

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/heuristics/score` | Yes | Score a domain against the 9-signal heuristic engine |
| `PUT` | `/api/heuristics/toggle` | Yes | Enable/disable the heuristic engine at runtime |
| `GET` | `/api/heuristics/status` | Yes | Check heuristic engine status and thresholds |

**Score domain body:**
```json
{ "domain": "xk4m2z9q.xyz" }
```

**Response:**
```json
{
  "domain": "xk4m2z9q.xyz",
  "score": 82.5,
  "verdict": "blocked",
  "signals": [
    { "name": "shannon_entropy", "weight": 18.0, "detail": "entropy=4.21 (high)" },
    { "name": "suspicious_tld", "weight": 15.0, "detail": ".xyz is commonly abused" }
  ],
  "threshold_block": 70.0,
  "threshold_warn": 45.0
}
```

### Config Export / Import

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/config/export` | Yes | Export full config as JSON (adlists, rules, groups, clients) |
| `POST` | `/api/config/import` | Yes | Import a config JSON — merges into existing data |

### WireGuard (Stub)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/wireguard/{device_id}` | Yes | Generate WireGuard profile — **not yet implemented** (returns 501) |

---

## CLI / Docker Commands

### Installation

```bash
# Standard install (pre-built Docker images from GHCR)
curl -sSL https://raw.githubusercontent.com/Alexanderrrrrrw/SentinelDNS/main/deploy/install.sh | sudo bash

# Developer install — compile from source
curl -sSL https://raw.githubusercontent.com/Alexanderrrrrrw/SentinelDNS/main/deploy/install.sh | sudo bash -s -- --build-from-source

# Full source build (both control-plane and dashboard)
curl -sSL https://raw.githubusercontent.com/Alexanderrrrrrw/SentinelDNS/main/deploy/install.sh | sudo bash -s -- --full-source-build
```

### Service Management

```bash
# Check service status
cd /opt/sentinel-dns/deploy
docker compose ps

# View recent logs
docker compose logs --tail=100

# Follow logs in real-time
docker compose logs -f

# Restart services
docker compose restart

# Stop all services
docker compose down

# Start services
docker compose up -d
```

### Rollback / Restore System DNS

```bash
cd /opt/sentinel-dns/deploy
docker compose down
sudo systemctl enable --now systemd-resolved
```

### DNS Sanity Checks

```bash
# Test allowed domain
nslookup example.com 127.0.0.1

# Test blocked domain
nslookup doubleclick.net 127.0.0.1

# Test with dig (more verbose)
dig @127.0.0.1 example.com
dig @127.0.0.1 doubleclick.net
```

### Development (Local)

```bash
# Run backend
SENTINEL_BLOCKLIST_PATH=fixtures/blocklist.txt cargo run -p sentinel-control-plane

# Run dashboard (separate terminal)
cd apps/dashboard && pnpm install && pnpm dev
```

---

## Install Script Flags

| Flag | Description |
|---|---|
| *(none)* | Default install — pulls pre-built Docker images from GHCR |
| `--build-from-source` | Compiles `control-plane` from source; uses pre-built dashboard image |
| `--full-source-build` | Compiles both `control-plane` and `dashboard` from source |

The installer automatically:
- Installs Docker if not present
- Disables `systemd-resolved` with a self-healing fallback
- Generates a random admin token
- Applies SD card tuning (`sd-card-tuning.sh`)
- Sets up iptables DNS interception rules
- Starts all services via Docker Compose
- Installs a cron-based safety net (restores `systemd-resolved` if port 53 goes down)

---

## Environment Variables

All variables are optional and have sensible defaults.

### Core

| Variable | Default | Description |
|---|---|---|
| `SENTINEL_DNS_BIND` | `0.0.0.0:5353` | DNS listener bind address (UDP + TCP) |
| `SENTINEL_API_BIND` | `0.0.0.0:8080` | HTTP API bind address |
| `SENTINEL_ADMIN_TOKEN` | *(generated)* | Admin token for protected API endpoints |
| `SENTINEL_REQUIRE_AUTH` | `false` | If `true`, the app won't start without `SENTINEL_ADMIN_TOKEN` |
| `SENTINEL_BLOCK_MODE` | `nxdomain` | How blocked domains respond: `nxdomain` or `null_ip` |
| `SENTINEL_BLOCKLIST_PATH` | `fixtures/blocklist.txt` | Path to the initial file-based blocklist |

### Upstream DNS

| Variable | Default | Description |
|---|---|---|
| `SENTINEL_UPSTREAM` | *(system default)* | Encrypted upstream resolver |

**Supported formats:**
```
tls://1.1.1.1:853#cloudflare-dns.com       # DNS-over-TLS
https://1.1.1.1:443#cloudflare-dns.com      # DNS-over-HTTPS
plain://8.8.8.8:53                           # Plain DNS (explicit)
(empty)                                      # System default
```

### Heuristic Engine

| Variable | Default | Description |
|---|---|---|
| `SENTINEL_HEURISTICS` | `true` | Enable heuristic domain scoring on startup |

### RAM-First Log Pipeline

| Variable | Default | Description |
|---|---|---|
| `SENTINEL_RAM_LOG_CAPACITY` | `100000` | Max log entries buffered in RAM |
| `SENTINEL_CHECKPOINT_SECS` | `900` | Flush interval in seconds (default: 15 min) |
| `SENTINEL_CHECKPOINT_BATCH` | `50000` | Max records per checkpoint batch |

### Storage

| Variable | Default | Description |
|---|---|---|
| `SENTINEL_DB_DIR` | `.` (cwd) | Directory for SQLite config + DuckDB log databases |
| `SENTINEL_BOOTSTRAP_INDEX_PATH` | `default.fst` | Path to the bootstrap FST index (first-boot accelerator) |

### Gravity

| Variable | Default | Description |
|---|---|---|
| `SENTINEL_GRAVITY_INTERVAL_SECS` | `604800` | Auto-update interval for blocklists (default: 7 days). Set to `0` to disable. |

---

## Network Hardening (iptables)

These rules are automatically applied by the installer. They ensure no device on your network can bypass Sentinel.

### DNS Interception (Force all port-53 traffic through Sentinel)

```bash
# Redirect all outbound UDP DNS to Sentinel
sudo iptables -t nat -A PREROUTING -p udp --dport 53 -j REDIRECT --to-port 5353

# Redirect all outbound TCP DNS to Sentinel
sudo iptables -t nat -A PREROUTING -p tcp --dport 53 -j REDIRECT --to-port 5353
```

### DoH Bypass Prevention (Block known DoH providers)

```bash
# Block Google DoH
sudo iptables -A FORWARD -p tcp -d 8.8.8.8 --dport 443 -j REJECT
sudo iptables -A FORWARD -p tcp -d 8.8.4.4 --dport 443 -j REJECT

# Block Cloudflare DoH
sudo iptables -A FORWARD -p tcp -d 1.1.1.1 --dport 443 -j REJECT
sudo iptables -A FORWARD -p tcp -d 1.0.0.1 --dport 443 -j REJECT

# Block Quad9 DoH
sudo iptables -A FORWARD -p tcp -d 9.9.9.9 --dport 443 -j REJECT
sudo iptables -A FORWARD -p tcp -d 149.112.112.112 --dport 443 -j REJECT
```

### SD Card Tuning

The `deploy/sd-card-tuning.sh` script applies these OS-level optimizations:

| Optimization | Effect |
|---|---|
| `noatime` mount option | Eliminates access-time writes on every file read |
| tmpfs on `/tmp`, `/var/tmp` | Temporary files stay in RAM |
| Swap disabled | Prevents swap writes to SD card |
| Journald set to `Storage=volatile` | System logs stay in RAM |

---

## Quick Reference — Common Workflows

### Block a domain immediately
```
Ctrl+K → type "block ads.example.com" → Enter
```

### Whitelist a domain
```
Ctrl+K → type "allow youtube.com" → Enter
```

### Force a blocklist refresh
```
Ctrl+K → type "gravity" → select "Update Gravity" → Enter
```

Or via API:
```bash
curl -X POST http://<pi-ip>:8080/api/gravity/update \
  -H "x-admin-token: YOUR_TOKEN"
```

### Score a suspicious domain
```bash
curl -X POST http://<pi-ip>:8080/api/heuristics/score \
  -H "x-admin-token: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"domain": "xk4m2z9q.xyz"}'
```

### Export config for backup
```bash
curl http://<pi-ip>:8080/api/config/export \
  -H "x-admin-token: YOUR_TOKEN" \
  -o sentinel-backup.json
```

### Import config on a new Pi
```bash
curl -X POST http://<pi-ip>:8080/api/config/import \
  -H "x-admin-token: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @sentinel-backup.json
```

### Watch live DNS queries
```bash
curl -N http://<pi-ip>:8080/api/logs/live \
  -H "x-admin-token: YOUR_TOKEN"
```
