#!/usr/bin/env bash
source "$(dirname "${BASH_SOURCE[0]}")/lib/common.sh"

require_var APP_NAME
require_var LAKEBASE_PROJECT_ID
require_var LAKEBASE_BRANCH_ID
require_var LAKEBASE_DATABASE
require_command pnpm

service_principal="$(dbx apps get "$APP_NAME" -o json | python -c 'import json, sys; print(json.load(sys.stdin)["service_principal_client_id"])')"
[[ -n "$service_principal" ]] || fail "Could not resolve the service principal of $APP_NAME"

cd "$REPO_ROOT/platform/lakebase"

run_sql() {
  pnpm -s run-sql \
    --profile "$DATABRICKS_PROFILE" \
    --project "$LAKEBASE_PROJECT_ID" \
    --branch "$LAKEBASE_BRANCH_ID" \
    --database "$LAKEBASE_DATABASE" \
    "$@"
}

info "Applying serving indexes"
run_sql --file sql/serving-indexes.sql

info "Granting read access on serving to $APP_NAME ($service_principal)"
run_sql --file sql/serving-grants.sql --var "app_service_principal=$service_principal"
