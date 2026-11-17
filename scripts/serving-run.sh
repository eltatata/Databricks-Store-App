#!/usr/bin/env bash
source "$(dirname "${BASH_SOURCE[0]}")/lib/common.sh"

cd "$REPO_ROOT/serving"

info "Running the olist-serving-refresh job"
dbx bundle run olist_serving_refresh
