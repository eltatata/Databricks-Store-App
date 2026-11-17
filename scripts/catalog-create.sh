#!/usr/bin/env bash
source "$(dirname "${BASH_SOURCE[0]}")/lib/common.sh"

require_var CATALOG
require_var WAREHOUSE_ID

statement="$(sed "s/\${catalog}/$CATALOG/g" "$REPO_ROOT/platform/workspace/catalog.sql")"
payload="$(STATEMENT="$statement" WAREHOUSE_ID="$WAREHOUSE_ID" python -c 'import json, os; print(json.dumps({"statement": os.environ["STATEMENT"], "warehouse_id": os.environ["WAREHOUSE_ID"], "wait_timeout": "50s"}))')"

info "Creating catalog $CATALOG if it does not exist"
response="$(dbx api post /api/2.0/sql/statements --json "$payload")"
state="$(echo "$response" | python -c 'import json, sys; print(json.load(sys.stdin)["status"]["state"])')"

[[ "$state" == "SUCCEEDED" ]] || fail "Catalog creation finished with state $state: $response"
info "Catalog $CATALOG is ready"
