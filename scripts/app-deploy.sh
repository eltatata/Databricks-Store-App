#!/usr/bin/env bash
source "$(dirname "${BASH_SOURCE[0]}")/lib/common.sh"

require_var APP_NAME

if [[ "${1:-}" != "--yes" ]]; then
  confirm "Deploy the $APP_NAME app to the $DATABRICKS_PROFILE workspace?"
fi

cd "$REPO_ROOT/app"

info "Deploying and starting $APP_NAME"
dbx apps deploy

info "App status"
dbx apps get "$APP_NAME" -o json | python -c 'import json, sys; app = json.load(sys.stdin); print(app.get("app_status", {}).get("state"), app.get("url"))'
