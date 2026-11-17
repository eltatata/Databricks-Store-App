#!/usr/bin/env bash
source "$(dirname "${BASH_SOURCE[0]}")/lib/common.sh"

cd "$REPO_ROOT/data"

info "Validating the store-data bundle"
dbx bundle validate --strict

info "Deploying the store-data bundle"
dbx bundle deploy
