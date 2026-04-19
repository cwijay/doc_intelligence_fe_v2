#!/usr/bin/env bash

# =============================================================================
# Local Next.js dev server -> local Main API (:8000) + local AI API (:8001)
# =============================================================================
# Loads .env.local-gcp, verifies the two backends are reachable, then launches
# `next dev` with the loaded env.
#
# First-time setup:
#   npm install
#
# Usage:
#   ./start-local-gcp.sh                 # start on 127.0.0.1:3000 (Turbopack)
#   ./start-local-gcp.sh --port 3001     # custom port
#   ./start-local-gcp.sh --host 0.0.0.0  # bind on all interfaces
#   ./start-local-gcp.sh --webpack       # use webpack instead of Turbopack
#   ./start-local-gcp.sh --skip-checks   # skip backend reachability checks
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

ENV_FILE=".env.local-gcp"

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

# ---------------------------- arg parsing ----------------------------
HOST_OVERRIDE=""
PORT_OVERRIDE=""
BUNDLER="turbo"
SKIP_CHECKS="false"

while [[ $# -gt 0 ]]; do
    case "$1" in
        --host)         HOST_OVERRIDE="$2"; shift 2 ;;
        --port)         PORT_OVERRIDE="$2"; shift 2 ;;
        --webpack)      BUNDLER="webpack"; shift ;;
        --turbo)        BUNDLER="turbo"; shift ;;
        --skip-checks)  SKIP_CHECKS="true"; shift ;;
        -h|--help)
            sed -n '3,18p' "$0"
            exit 0
            ;;
        *) die "Unknown option: $1" ;;
    esac
done

# ---------------------------- prerequisites ----------------------------
[[ -f "$ENV_FILE" ]] || die "$ENV_FILE not found in $SCRIPT_DIR"
command_exists node || die "node not installed"
command_exists npm  || die "npm not installed"
[[ -d "node_modules" ]] || die "node_modules missing - run 'npm install' first"

log_info "Loading environment from $ENV_FILE"
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

# Required vars sanity check
for var in NEXT_PUBLIC_API_URL NEXT_PUBLIC_AI_API_URL NEXT_PUBLIC_AGENT_API_URL NEXT_PUBLIC_GCS_BUCKET_NAME; do
    [[ -n "${!var:-}" ]] || die "$var is unset (check $ENV_FILE)"
done

# ---------------------------- backend reachability ----------------------------
check_backend() {
    local name="$1" url="$2"
    if curl -fsS --max-time 2 "$url" >/dev/null 2>&1 \
    || curl -fsS --max-time 2 "$url/docs" >/dev/null 2>&1 \
    || curl -fsS --max-time 2 "$url/health" >/dev/null 2>&1; then
        log_ok "$name reachable at $url"
    else
        log_warn "$name not reachable at $url - start it before hitting the UI"
    fi
}

if [[ "$SKIP_CHECKS" != "true" ]]; then
    check_backend "Main API" "$NEXT_PUBLIC_API_URL"
    check_backend "AI API"   "$NEXT_PUBLIC_AI_API_URL"
    check_backend "Agent API" "$NEXT_PUBLIC_AGENT_API_URL"
fi

# ---------------------------- launch ----------------------------
HOST="${HOST_OVERRIDE:-127.0.0.1}"
PORT="${PORT_OVERRIDE:-3000}"

echo ""
log_info "Starting Next.js dev server (local -> local backends)"
echo "  Main API:       $NEXT_PUBLIC_API_URL"
echo "  AI API:         $NEXT_PUBLIC_AI_API_URL"
echo "  Agent API:      $NEXT_PUBLIC_AGENT_API_URL"
echo "  GCS bucket:     gs://$NEXT_PUBLIC_GCS_BUCKET_NAME"
echo "  Bundler:        $BUNDLER"
echo "  Server:         http://$HOST:$PORT"
echo ""

NEXT_ARGS=(npx next dev --hostname "$HOST" --port "$PORT")
[[ "$BUNDLER" == "turbo" ]] && NEXT_ARGS+=(--turbopack)

exec "${NEXT_ARGS[@]}"
