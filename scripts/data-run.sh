#!/usr/bin/env bash
source "$(dirname "${BASH_SOURCE[0]}")/lib/common.sh"

cd "$REPO_ROOT/data"

info "Running the olist-refresh job"
dbx bundle run olist_refresh
