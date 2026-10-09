# Architecture

The target design and its rationale are in `IMPLEMENTATION_PLAN.md` (§0 decisions, §6.2 diagram). This document tracks the **as-built** state and is updated at the end of every block.

## As-built status

| Component | State |
|-----------|-------|
| Repository scaffolding | Created (Phase 0) |
| UC catalog, schemas, volume | Created: catalog `data_engineering` (SQL), schemas `bronze`/`silver`/`gold`/`serving` and volume `bronze.landing` (DAB) |
| SDP pipeline (Bronze → Silver → Gold) | Deployed and verified: `olist-medallion` (8 Bronze, 7 Silver + quarantine, 8 Gold) |
| Refresh job | Deployed and verified: `olist-refresh` (ingest_check → run_pipeline → reconcile_gold). Lakebase tasks pending (Phase 4) |
| Lakebase project and synced tables | Not created |
| Genie space | Not created |
| App (`store-app`) | Not created |
| Supervisor agent | Not created |

## Environment-driven choices

| Choice | Value | Source |
|--------|-------|--------|
| Catalog | `data_engineering` (new) | `ENVIRONMENT_AUDIT.md` |
| SQL warehouse | Serverless Starter Warehouse (2X-Small) | `ENVIRONMENT_AUDIT.md` |
| Agent model | `databricks-qwen3-next-80b-a3b-instruct`, fallback `databricks-llama-4-maverick` (D16) | `ENVIRONMENT_AUDIT.md` |
| Model binding | `serving_endpoint` resource (Unity Gateway not enforced) | `ENVIRONMENT_AUDIT.md` |
