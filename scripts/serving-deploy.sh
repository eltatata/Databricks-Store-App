#!/usr/bin/env bash
source "$(dirname "${BASH_SOURCE[0]}")/lib/common.sh"

cd "$REPO_ROOT/serving"

info "Validating the store-serving bundle"
dbx bundle validate --strict

info "Deploying the store-serving bundle"
dbx bundle deploy
