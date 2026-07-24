#!/usr/bin/env bash
set -euo pipefail

launch_dir="$(cd "$(dirname "$0")" && pwd)"
project_dir="$launch_dir"
if [[ "${NODE_ENV:-}" == test && -n "${RUNTIME_PROJECT_SOURCE:-}" && -d "$RUNTIME_PROJECT_SOURCE" ]]; then project_dir="$(cd "$RUNTIME_PROJECT_SOURCE" && pwd)"; fi
if [[ ! -f "$launch_dir/.env" ]]; then
  echo "Missing $launch_dir/.env; copy .env.example and provide real values." >&2
  exit 1
fi

load_env_file() {
  local file="$1" line key value
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%$'\r'}"; case "$line" in ''|'#'*) continue ;; esac; line="${line#export }"
    key="${line%%=*}"; value="${line#*=}"; [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue
    if [[ "$value" == \"*\" && "$value" == *\" ]] || [[ "$value" == \'*\' && "$value" == *\' ]]; then value="${value:1:${#value}-2}"; fi
    if [[ -z "${!key+x}" ]]; then printf -v "$key" '%s' "$value"; export "$key"; fi
  done < "$file"
}
load_env_file "$launch_dir/.env"

backend_port="${BACKEND_PORT:-${PORT:-4053}}"
frontend_port="${FRONTEND_PORT:-4052}"
[[ "$backend_port" != "$frontend_port" ]] || { echo "Backend and frontend ports must differ." >&2; exit 1; }
: "${DATABASE_URL:?DATABASE_URL is required}"
: "${JWT_SECRET:?JWT_SECRET is required}"
: "${OPENROUTER_API_KEY:?OPENROUTER_API_KEY is required}"
: "${OPENROUTER_MODEL:?OPENROUTER_MODEL is required}"
[[ "${OPENROUTER_BASE_URL:-}" == "https://openrouter.ai/api/v1" ]] || { echo "OPENROUTER_BASE_URL must be https://openrouter.ai/api/v1." >&2; exit 1; }
[[ "${ALLOW_SCHEMA_MIGRATION:-}" == true ]] || { echo "ALLOW_SCHEMA_MIGRATION=true is required." >&2; exit 1; }
for dependency_dir in "$project_dir/backend/node_modules"; do
  if [[ ! -d "$dependency_dir" ]]; then
    echo "Missing $dependency_dir; install dependencies explicitly before starting." >&2
    exit 1
  fi
done
if [[ "${NODE_ENV:-}" != test && ! -d "$project_dir/frontend/node_modules" ]]; then echo "Missing frontend dependencies; install them explicitly before starting." >&2; exit 1; fi
for port in "$backend_port" "$frontend_port"; do
  if command -v lsof >/dev/null && lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then echo "Port $port is already in use; no process was changed." >&2; exit 1; fi
done

(cd "$project_dir/backend" && node scripts/prepare-runtime.js)

(cd "$project_dir/backend" && BACKEND_PORT="$backend_port" CORS_ORIGINS="${CORS_ORIGINS:-http://127.0.0.1:$frontend_port}" node server.js) &
backend_pid=$!
frontend_pid=""
if [[ "${NODE_ENV:-}" != test ]]; then
  (cd "$project_dir/frontend" && HOST=127.0.0.1 PORT="$frontend_port" REACT_APP_API_BASE="${REACT_APP_API_BASE:-http://127.0.0.1:$backend_port/api}" BROWSER=none npm start) &
  frontend_pid=$!
fi

cleanup() {
  trap - EXIT INT TERM
  kill "$backend_pid" ${frontend_pid:+"$frontend_pid"} 2>/dev/null || true
  wait "$backend_pid" ${frontend_pid:+"$frontend_pid"} 2>/dev/null || true
}
trap cleanup EXIT INT TERM
if [[ -z "$frontend_pid" ]]; then wait "$backend_pid"; else while kill -0 "$backend_pid" 2>/dev/null && kill -0 "$frontend_pid" 2>/dev/null; do sleep 1; done; fi
