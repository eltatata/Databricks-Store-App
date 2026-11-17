#!/usr/bin/env bash
set -euo pipefail
export MSYS_NO_PATHCONV=1

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && { pwd -W 2>/dev/null || pwd; })"
ENV_FILE="$REPO_ROOT/.env"

fail() {
  echo "ERROR: $*" >&2
  exit 1
}

info() {
  echo "==> $*"
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "Required command '$1' is not installed"
}

require_var() {
  local variable_name="$1"
  [[ -n "${!variable_name:-}" ]] || fail "Required variable $variable_name is not set in $ENV_FILE"
}

load_env() {
  [[ -f "$ENV_FILE" ]] || fail "Missing $ENV_FILE. Copy .env.example to .env and fill in the values."
  set -a
  source "$ENV_FILE"
  set +a
}

dbx() {
  databricks "$@" --profile "$DATABRICKS_PROFILE"
}

confirm() {
  local prompt="$1"
  local answer
  read -r -p "$prompt [y/N] " answer
  [[ "$answer" == "y" || "$answer" == "Y" ]] || fail "Aborted by user"
}

load_env
require_command databricks
require_var DATABRICKS_PROFILE
