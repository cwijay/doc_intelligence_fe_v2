#!/usr/bin/env bash

# =============================================================================
# Run the Next.js frontend locally against LOCAL backends
# =============================================================================
# Main API (auth, documents, folders, users, parsing) -> http://127.0.0.1:8000
# AI API   (summary, FAQ, questions, RAG chat, usage) -> http://127.0.0.1:8001
# Agent API (templates, agents, runs)                 -> http://127.0.0.1:8010
#
# Self-contained: the URLs live in this script, exported into the dev server's
# environment so they take precedence over any .env.local on disk.
#
# First-time setup:
#   npm install
#
# Usage:
#   ./scripts/local_exec/start-local.sh                    # 127.0.0.1:3000, Turbopack
#   ./scripts/local_exec/start-local.sh --port 3001        # pin a port (fails if busy)
#   ./scripts/local_exec/start-local.sh --host 0.0.0.0     # bind all interfaces
#   ./scripts/local_exec/start-local.sh --webpack          # webpack instead of Turbopack
#   ./scripts/local_exec/start-local.sh --skip-checks      # skip backend reachability checks
#   ./scripts/local_exec/start-local.sh --tunnel           # also expose a public HTTPS URL
#   ./scripts/local_exec/start-local.sh --ai-api http://127.0.0.1:9001
#
# If port 3000 is taken (and --port was not given), the script names whatever
# holds it and moves up to the first free port in 3001-3010.
#
# --tunnel runs a Cloudflare quick tunnel (needs 'brew install cloudflared') and
# prints a public https://<random>.trycloudflare.com URL for the dev server.
# ANYONE WITH THAT LINK CAN REACH THE APP - the URL is unguessable but not
# access-controlled, and only the backend JWT check stands between a visitor and
# your data. Only the Next.js port is exposed; the APIs on :8000/:8001/:8010 stay
# bound to localhost and are reached server-side. Stop the script to close it.
#
# Any of the three URLs can also be overridden from the environment, e.g.
#   NEXT_PUBLIC_AI_API_URL=http://127.0.0.1:9001 ./scripts/local_exec/start-local.sh
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()  { echo -e "${BLUE}[INFO]${NC} $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
die()       { log_error "$1"; exit 1; }

command_exists() { command -v "$1" >/dev/null 2>&1; }

# ---------------------------- defaults ----------------------------
MAIN_API="${NEXT_PUBLIC_API_URL:-http://127.0.0.1:8000}"
AI_API="${NEXT_PUBLIC_AI_API_URL:-http://127.0.0.1:8001}"
AGENT_API="${NEXT_PUBLIC_AGENT_API_URL:-http://127.0.0.1:8010}"
GCS_BUCKET="${NEXT_PUBLIC_GCS_BUCKET_NAME:-biz2bricks-dev-v1-document-store}"

HOST="127.0.0.1"
PORT="3000"
PORT_EXPLICIT="false"
BUNDLER="turbo"
SKIP_CHECKS="false"
TUNNEL="false"

# ---------------------------- arg parsing ----------------------------
while [[ $# -gt 0 ]]; do
    case "$1" in
        --host)        HOST="${2:?--host needs a value}"; shift 2 ;;
        --port)        PORT="${2:?--port needs a value}"; PORT_EXPLICIT="true"; shift 2 ;;
        --main-api)    MAIN_API="${2:?--main-api needs a value}"; shift 2 ;;
        --ai-api)      AI_API="${2:?--ai-api needs a value}"; shift 2 ;;
        --agent-api)   AGENT_API="${2:?--agent-api needs a value}"; shift 2 ;;
        --webpack)     BUNDLER="webpack"; shift ;;
        --turbo)       BUNDLER="turbo"; shift ;;
        --skip-checks) SKIP_CHECKS="true"; shift ;;
        --tunnel)      TUNNEL="true"; shift ;;
        -h|--help)     awk 'NR > 2 && /^#/ { print; next } NR > 2 { exit }' "$0"; exit 0 ;;
        *)             die "Unknown option: $1 (try --help)" ;;
    esac
done

# ---------------------------- prerequisites ----------------------------
command_exists node || die "node not installed"
command_exists npm  || die "npm not installed"
[[ -d "node_modules" ]] || die "node_modules missing - run 'npm install' in $PROJECT_ROOT first"

# ---------------------------- environment ----------------------------
# Exported so `next dev` inherits them; process env beats .env.local in Next.js.
export NEXT_PUBLIC_API_URL="$MAIN_API"
export NEXT_PUBLIC_AI_API_URL="$AI_API"
export NEXT_PUBLIC_AGENT_API_URL="$AGENT_API"
export NEXT_PUBLIC_GCS_BUCKET_NAME="$GCS_BUCKET"
export NEXT_PUBLIC_APP_NAME="${NEXT_PUBLIC_APP_NAME:-Biz-To-Bricks}"
export NEXT_PUBLIC_APP_VERSION="${NEXT_PUBLIC_APP_VERSION:-1.0.0}"
export NEXT_PUBLIC_AUTH_ENABLED="${NEXT_PUBLIC_AUTH_ENABLED:-true}"
export NEXT_PUBLIC_SESSION_TIMEOUT_HOURS="${NEXT_PUBLIC_SESSION_TIMEOUT_HOURS:-12}"
export NODE_OPTIONS="${NODE_OPTIONS:---disable-warning=ExperimentalWarning}"

# ---------------------------- backend reachability ----------------------------
check_backend() {
    local name="$1" url="$2"
    if curl -fsS --max-time 2 "$url" >/dev/null 2>&1 \
    || curl -fsS --max-time 2 "$url/health" >/dev/null 2>&1 \
    || curl -fsS --max-time 2 "$url/docs" >/dev/null 2>&1; then
        log_ok "$name reachable at $url"
    else
        log_warn "$name NOT reachable at $url - start it before using the UI"
    fi
}

if [[ "$SKIP_CHECKS" != "true" ]]; then
    if command_exists curl; then
        check_backend "Main API " "$MAIN_API"
        check_backend "AI API   " "$AI_API"
        check_backend "Agent API" "$AGENT_API"
    else
        log_warn "curl not installed - skipping backend reachability checks"
    fi
fi

# ---------------------------- port selection ----------------------------
port_in_use() { lsof -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1; }

# "node (pid 123)" for whatever is listening, or a docker container name when
# the listener is Docker's port forwarder.
port_holder() {
    local port="$1" holder
    holder="$(lsof -nP +c 0 -iTCP:"$port" -sTCP:LISTEN 2>/dev/null \
        | awk 'NR > 1 { print $1 " (pid " $2 ")" }' | sort -u | paste -sd', ' -)"
    if [[ "$holder" == *docker* ]] && command_exists docker; then
        local container
        container="$(docker ps --format '{{.Names}}\t{{.Ports}}' 2>/dev/null \
            | awk -v p=":$port->" '$0 ~ p { print $1; exit }')"
        [[ -n "$container" ]] && holder="docker container '$container'"
    fi
    echo "${holder:-another process}"
}

if command_exists lsof && port_in_use "$PORT"; then
    HOLDER="$(port_holder "$PORT")"
    if [[ "$PORT_EXPLICIT" == "true" ]]; then
        log_error "Port $PORT is already in use by $HOLDER"
        die "Free that port or pass a different --port"
    fi

    log_warn "Port $PORT is in use by $HOLDER - searching for a free port"
    FALLBACK=""
    for candidate in $(seq $((PORT + 1)) $((PORT + 10))); do
        if ! port_in_use "$candidate"; then FALLBACK="$candidate"; break; fi
    done
    [[ -n "$FALLBACK" ]] || die "No free port in $((PORT + 1))-$((PORT + 10)) - pass --port <other>"

    PORT="$FALLBACK"
    log_ok "Using port $PORT instead (override with --port)"
    if [[ "$PORT" != "3000" && "$PORT" != "3001" ]]; then
        log_warn "Backend CORS whitelists ports 3000/3001 - add http://$HOST:$PORT there if direct API calls fail"
    fi
fi

# ---------------------------- launch ----------------------------
echo ""
log_info "Starting Next.js dev server against local backends"
echo "  Main API:   $MAIN_API"
echo "  AI API:     $AI_API"
echo "  Agent API:  $AGENT_API"
echo "  GCS bucket: gs://$GCS_BUCKET"
echo "  Bundler:    $BUNDLER"
echo "  Frontend:   http://$HOST:$PORT"
echo ""

NEXT_ARGS=(npx next dev --hostname "$HOST" --port "$PORT")
[[ "$BUNDLER" == "turbo" ]] && NEXT_ARGS+=(--turbopack)

if [[ "$TUNNEL" != "true" ]]; then
    exec "${NEXT_ARGS[@]}"
fi

# ---------------------------- cloudflare quick tunnel ----------------------------
command_exists cloudflared || die "cloudflared not installed - run 'brew install cloudflared'"

TUNNEL_LOG="$(mktemp -t b2b-tunnel)"
TUNNEL_PID=""
cleanup_tunnel() {
    [[ -n "$TUNNEL_PID" ]] && kill "$TUNNEL_PID" 2>/dev/null || true
}
trap cleanup_tunnel EXIT INT TERM

log_info "Starting Cloudflare quick tunnel to http://127.0.0.1:$PORT"
cloudflared tunnel --no-autoupdate --url "http://127.0.0.1:$PORT" >"$TUNNEL_LOG" 2>&1 &
TUNNEL_PID=$!

PUBLIC_URL=""
for _ in $(seq 1 30); do
    PUBLIC_URL="$(grep -Eo 'https://[a-z0-9-]+\.trycloudflare\.com' "$TUNNEL_LOG" | head -1 || true)"
    [[ -n "$PUBLIC_URL" ]] && break
    kill -0 "$TUNNEL_PID" 2>/dev/null || die "cloudflared exited early - see $TUNNEL_LOG"
    sleep 1
done
[[ -n "$PUBLIC_URL" ]] || die "Timed out waiting for a tunnel URL - see $TUNNEL_LOG"

log_ok "Public URL: $PUBLIC_URL"
log_warn "That URL is reachable by anyone who has it. Stop this script to close it."
echo "  tunnel log: $TUNNEL_LOG"
echo ""

"${NEXT_ARGS[@]}"
