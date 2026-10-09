# IMPLEMENTATION_PLAN.md
## Databricks Data Engineering + Lakebase + App + Agentic AI POC

> **Purpose:** this document is the implementation contract for Claude Code. Build the project end-to-end with high autonomy, using the Databricks CLI where possible, while verifying all platform capabilities against current official Databricks documentation and the actual target workspace.
>
> **Project type:** learning / proof of concept (POC), not production. Do not use real customer data or real end users.
>
> **Last reviewed:** 2026-10-09. Databricks product names, APIs, CLI commands, plan entitlements, and preview/GA status can change. Re-check official docs before implementation and before deployment.

---

# 1. Project objective and success criteria

Build one coherent project that demonstrates the complete data and AI application lifecycle:

1. Ingest a suitable public Kaggle dataset into Databricks.
2. Preserve raw data in **Bronze**.
3. Clean, validate, deduplicate, and model it in **Silver**.
4. Build analytical, business-friendly **Gold** tables and KPIs.
5. Publish the required Gold data to **Lakebase** for low-latency application reads, using supported synced-table capabilities where appropriate.
6. Build one **Databricks App** containing a React frontend and FastAPI backend.
7. Provide an analytical dashboard and operational CRUD screens.
8. Add an AI assistant that routes analytical questions to a configured **Genie Agent** and mutations to narrowly scoped MCP tools backed by the same application services as the REST API.
9. Keep authorization, validation, and business rules in the backend/service layer. The LLM must not be a security boundary.
10. Automate repeatable data and deployment workflows through Databricks CLI and, where appropriate and supported, **Declarative Automation Bundles** (formerly Databricks Asset Bundles).
11. Include tests, documentation, setup scripts, runbooks, and a clear final report of what actually deployed and what remains blocked by permissions or plan limitations.

## Definition of done

- [ ] Dataset selection and license/provenance are documented.
- [ ] Raw source is reproducibly ingested; re-running ingestion does not silently duplicate records.
- [ ] Bronze, Silver, and Gold tables exist in Unity Catalog with documented schemas and data-quality checks.
- [ ] Gold KPIs reconcile with source/cleaned data and have written definitions.
- [ ] Lakebase tables and sync mode are documented; read-only synced tables are not mistaken for writable operational tables.
- [ ] The app reads dashboard and CRUD data through FastAPI. The browser never connects directly to Lakebase.
- [ ] CRUD works with server-side validation, transactions, safe error handling, and tests.
- [ ] Genie can answer supported read/analytics questions using curated Gold data.
- [ ] The supervisor routes reads and writes to separate, explicit capabilities and requests confirmation before destructive operations.
- [ ] MCP tools reuse the same service/business logic as REST endpoints; no duplicated authorization logic.
- [ ] All secrets remain outside Git and frontend bundles.
- [ ] CLI commands, resource IDs, permissions, limitations, test results, and deployment outcome are recorded in the README/runbook.
- [ ] No unsupported Databricks feature is simulated as if it were deployed successfully.

---

# 2. Mandatory autonomous workflow for Claude Code

Work autonomously through the phases below. Do not stop to ask the user routine implementation questions. First inspect the repository and environment, then make reasonable reversible decisions and document them. Ask only when a required user decision, interactive login, license acceptance, destructive action, or missing privilege cannot be safely resolved by inspection.

## 2.1 Inspect before changing anything

1. Inspect the current repository, Git status, existing instructions (`CLAUDE.md`, `AGENTS.md`, README), package managers, tests, and all project files.
2. Do not overwrite existing work without understanding it.
3. Check tools and versions:
   - `git --version`
   - `databricks -v`
   - `databricks -h`
   - `databricks auth profiles`
   - `databricks current-user me`
   - `databricks workspace -h`
   - `databricks apps -h`
   - `databricks bundle -h`
   - relevant `databricks postgres -h`, `databricks jobs -h`, and pipeline commands shown by the installed CLI.
4. Use `databricks auth describe` / `databricks auth profiles` as supported by the installed CLI to inspect the active authentication configuration. Never print or copy tokens.
5. Determine the workspace URL, cloud, user identity, workspace permissions, Unity Catalog availability, SQL warehouse availability, Lakebase/Postgres availability, Databricks Apps support, Genie Agent availability, MCP capabilities, and the current plan's limitations.
6. Use read-only discovery first. Prefer commands such as `--help`, `list`, `get`, `status`, and official documentation checks before creating resources.
7. Record discovered facts in `docs/ENVIRONMENT_AUDIT.md`. Distinguish:
   - confirmed available;
   - available but missing permissions/configuration;
   - not available in this workspace/plan;
   - not yet verified.
8. Verify every CLI command against the installed CLI help and official docs. Do not copy an old command blindly.
9. If authentication is missing, give the user the exact interactive login command and wait for the user to complete login. Never ask them to paste tokens into chat or files.
10. After login, continue autonomously.

## 2.2 Official documentation policy

Before implementation, read the relevant current official docs linked in section 15. Also inspect the relevant official API/CLI reference when implementing a command or resource.

For every platform-specific assumption, document the source URL and verification date. If docs conflict with the workspace's actual behavior, capture the discrepancy and use the supported behavior actually available.

Do not invent a “Databricks Supervisor API” or assume an old preview endpoint remains supported. Databricks documents a Supervisor Agent capability, but its current availability, interface, supported integrations, and plan requirements must be checked in this workspace. If the native Supervisor Agent cannot be used or does not fit the intended app flow, implement a small explicit supervisor/orchestrator inside FastAPI using supported SDKs/APIs. Do not introduce LangGraph merely by default; use it only if it solves a concrete orchestration need and the dependency is compatible with the selected deployment.

## 2.3 Safe autonomy boundaries

Claude Code is authorized to make routine, reversible code changes, create local files, run local tests, inspect Databricks resources, and deploy only after preflight checks.

Require explicit user confirmation before:
- deleting workspace resources, databases, branches, schemas, tables, apps, jobs, or volumes;
- overwriting or dropping existing data;
- incurring a clearly non-trivial cost or provisioning resources whose pricing is unknown;
- changing workspace-wide permissions, identity configuration, or security policies;
- rotating credentials or changing account-level settings;
- running a destructive migration against a non-empty database.

Use a dry-run/plan step when available. Prefer a dedicated POC namespace and resources with a recognizable project prefix. Never use broad cleanup commands.

## 2.4 Secrets and credentials

- Never place tokens, passwords, client secrets, database connection strings with credentials, or `.env` files in Git.
- Add `.env`, `.env.*` (except a safe `.env.example`), local credential files, downloaded datasets, and generated artifacts to `.gitignore` as appropriate.
- Prefer Databricks unified authentication/OAuth for local CLI use. Avoid personal access tokens unless the official docs and environment require them.
- For the deployed app, use Databricks App resources/identity and supported secret mechanisms rather than reusing a developer's local CLI credentials.
- Verify which identity the app uses to access each resource. Grant only the minimum required privileges.
- Never expose Lakebase credentials, workspace tokens, model credentials, or server environment variables to React.

---

# 3. Dataset selection and ingestion

## 3.1 Dataset selection

The project should use a public Kaggle dataset with a clear transactional/business domain, preferably containing orders/sales, products, customers, dates, quantities, unit prices, categories, regions, or similar dimensions. This enables both meaningful ETL and a useful CRUD application.

Do not assume the exact dataset name or schema before checking the existing project/context. Search the repository and existing notes for the previously selected Kaggle dataset first. If no exact choice is recorded, select one candidate autonomously based on:
- clear source provenance and usable license/terms;
- manageable size for a learning workspace;
- stable identifiers or a documented strategy to create them;
- enough columns to demonstrate data cleaning, joins, aggregates, and KPIs;
- no sensitive personal data;
- availability as CSV or a format that can be imported reproducibly.

Record the dataset's exact title, Kaggle URL, author, license/terms, download date, file names, row count, source columns, and any caveats in `docs/DATASET.md`. Do not falsely claim a license permits redistribution if this has not been verified. Avoid committing a large raw dataset unless its license and repository policy allow it.

If downloading requires a Kaggle account/API credentials, use the existing local Kaggle CLI configuration if present. Never request or print secrets. If no safe authenticated route exists, create a documented manual upload path and continue building the pipeline around the expected file contract.

## 3.2 Ingestion design

Target Unity Catalog layout:

- Catalog: `data_engineering`
- Bronze schema: `bronze`
- Silver schema: `silver`
- Gold schema: `gold`
- Raw file landing path (proposed): `/Volumes/data_engineering/bronze/kaggle_raw/incoming/dataset.csv`

The Unity Catalog volume must be created only if supported and permitted. Verify the correct volume DDL/CLI workflow and the workspace's catalog/schema privileges before executing it. Do not confuse a logical volume name with a relative path. If the actual file is named differently, keep the actual filename and document the mapping.

Build an ingestion job/script that:
1. verifies the source file exists and is readable;
2. records source metadata (file name, ingestion timestamp, source dataset/version);
3. reads the source with explicit or inferred schema followed by schema validation;
4. preserves raw source values as faithfully as possible;
5. adds ingestion metadata such as `ingested_at`, `source_file`, and `batch_id` where appropriate;
6. writes an idempotent Bronze Delta table;
7. reports row count, schema, null counts, and duplicate candidates;
8. fails clearly if the input file is missing, empty, malformed, or unexpectedly changes shape.

Bronze should preserve the raw representation; do not apply business assumptions or silently drop invalid rows. If useful, retain an error/quarantine table or a separate rejected-record output with reason codes.

Recommended table name: `data_engineering.bronze.dataset_raw`. Change only if the dataset design clearly warrants multiple raw tables; document the choice.

## 3.3 Repeatability

- Ingestion must be repeatable.
- Do not append the entire same CSV on every run unless the design includes a reliable batch/file identity and deduplication rule.
- Include a configurable `source_path` and environment/catalog/schema configuration.
- Separate local unit tests from Databricks integration tests.
- Log run ID, batch ID, input path, input row count, output row count, and failures.

---

# 4. Data engineering: Bronze → Silver → Gold

Use Delta tables in Unity Catalog for lakehouse layers. Prefer SQL/PySpark and supported Databricks jobs/pipelines appropriate to the workspace. Do not introduce a complex framework solely for this POC.

## 4.1 Bronze — raw landing

Purpose: preserve source data with minimal transformations.

Expected table:
- `data_engineering.bronze.dataset_raw`

Requirements:
- retain source columns and source values;
- attach ingestion metadata where useful;
- document source schema;
- measure nulls, duplicates, invalid dates/numbers, and schema drift;
- do not quietly “fix” questionable source values;
- preserve enough information to debug downstream transformations.

## 4.2 Silver — clean, normalized, and reusable

Purpose: turn the source into trustworthy, typed, consistent data. Silver is not automatically a normalized OLTP schema. Choose a model that fits the dataset and the analytical use cases; if a relational transactional model is appropriate, document the normalization and keys explicitly.

Tasks:
1. standardize column names to a consistent snake_case convention;
2. cast dates, timestamps, quantities, prices, identifiers, and booleans explicitly;
3. trim strings and standardize categories/codes without destroying source meaning;
4. handle missing values with documented rules; do not replace unknown values with fabricated business values;
5. detect duplicate records and define deterministic deduplication keys;
6. validate business rules (for example, quantity and price ranges) based on the dataset, not assumptions;
7. separate rejected rows and attach rejection reasons where useful;
8. create stable primary/business keys; if source IDs are absent, define a deterministic key and explain its limitations;
9. create a data-quality summary with counts and percentages;
10. document transformations and lineage from each Silver field back to Bronze.

Use the smallest useful set of Silver tables. For an order/sales dataset this might become clean facts and dimensions such as `orders`, `order_items`, `customers`, `products`, or `transactions`, but only create tables justified by the actual columns and grain. Do not create fictitious entities simply to match this example.

Proposed schema: `data_engineering.silver`. Example primary table: `dataset_clean` if a single clean table is appropriate.

## 4.3 Gold — analytical serving model

Purpose: curated, documented tables for dashboards, Genie, and downstream consumption.

Potential tables, to be finalized from the dataset:
- `gold.customer_summary`
- `gold.product_summary`
- `gold.sales_summary` or an equivalent date/category/region aggregate
- optionally a clearly defined fact table at the right grain if required for Genie.

Existing proposed names to preserve if relevant: `data_engineering.gold.customer_summary` and `data_engineering.gold.product_summary`.

For each Gold table:
- document grain, primary/business key, dimensions, metrics, refresh strategy, and upstream lineage;
- use stable names and types;
- calculate metrics from Silver, not from raw CSV fields in the UI;
- define all KPI formulas in `docs/KPIS.md`;
- add reconciliation checks and tests;
- make it suitable for Unity Catalog permissions and Genie instructions.

Potential KPIs (use only those supported by the dataset):
- total sales/revenue;
- order/transaction count;
- units sold;
- average order value;
- revenue by time/category/product/region;
- top products/customers;
- growth over time when dates support it;
- distinct customers;
- refund/discount metrics only if the source supports them.

Write KPI definitions explicitly, including null handling, currency assumptions, time zone assumptions, and whether cancelled/refunded transactions are included.

## 4.4 Orchestration

Create a repeatable workflow in this order:

1. ingest source to Bronze;
2. validate Bronze;
3. transform Bronze to Silver;
4. run Silver data-quality checks;
5. build Gold;
6. reconcile Gold metrics;
7. refresh/synchronize the required Gold tables into Lakebase;
8. record a successful run and output metrics.

Prefer a Databricks Lakeflow Job and Declarative Automation Bundles if the workspace/CLI supports them. A simple SQL/Python task chain is sufficient. Use a pipeline only if it is a good fit and available. Do not create both a Job and a Pipeline for the same work without a reason.

Implement safe failure behavior: downstream tasks must not run after a failed prerequisite; retries should not create duplicates; the last successful Gold dataset should remain queryable where the platform design permits.

---

# 5. Lakebase design and serving data

Lakebase is the operational Postgres layer for low-latency app queries and CRUD. It is not a replacement for the lakehouse's Bronze/Silver/Gold history.

## 5.1 Separate analytics snapshots from writable operational data

Use two distinct categories of tables:

1. **Synced analytical tables:** Gold Unity Catalog tables synced into Lakebase for fast read access. These tables are managed by the sync mechanism and may be read-only in Postgres. Never point CRUD update/delete operations at a read-only synced table.
2. **Writable operational tables:** native Lakebase Postgres tables owned by the app schema and written by the FastAPI service. These hold editable records for the CRUD exercise.

A proposed Postgres schema separation:
- `analytics`: synced Gold serving tables, subject to the actual naming behavior of the sync feature;
- `app`: writable operational tables such as `products`, `transactions`/`orders`, and any supporting lookup tables justified by the dataset.

The sync process may use generated table names/suffixes or schema mapping rules. Inspect the actual resulting names and document them; do not hard-code assumed names until verified.

## 5.2 Gold-to-Lakebase sync

For each required Gold table:
1. verify Lakebase project/branch/database and the supported synced-table feature;
2. confirm source table requirements and primary key columns;
3. choose the appropriate supported sync mode/scheduling policy (snapshot for a simple initial POC; continuous/triggered only if supported and useful);
4. create/configure the sync using the documented UI, CLI, or API that is supported in the installed environment;
5. wait for sync completion and verify status;
6. compare source and destination row counts and selected aggregates;
7. record freshness and sync status;
8. document how to rerun or recover a failed sync.

Do not assume sync automatically writes Lakebase changes back into Gold. If the POC later needs operational changes to flow back into the lakehouse, treat that as a separate change-data-capture/audit design and implement it only if supported and within scope.

## 5.3 Writable schema and migrations

Use SQLAlchemy 2.x with a PostgreSQL driver supported by the Databricks App environment. Use Alembic migrations if compatible with the selected app workflow; otherwise provide versioned, idempotent SQL migrations.

Model only the entities justified by the selected dataset. For every writable table:
- primary key;
- foreign keys where appropriate;
- not-null and check constraints;
- unique constraints for natural keys where valid;
- `created_at` and `updated_at`;
- transaction boundaries;
- indexes for common list/filter/join paths;
- safe pagination and sorting.

Seed a small, clearly labeled demo dataset only when needed for CRUD development. Do not confuse seed/demo records with the Kaggle source.

## 5.4 App connection

Use the current recommended Databricks Apps → Lakebase connection/identity pattern from official documentation. Prefer supported app resources and OAuth/managed credentials rather than a static password in configuration.

- Build a connection factory and SQLAlchemy session lifecycle.
- Use a connection pool appropriate for app limits.
- Keep credentials server-side.
- Provide clear readiness/health checks without exposing secrets.
- Verify whether the deployed app identity needs explicit database grants.
- Test connectivity from the deployed app, not only from a local machine.

---

# 6. Application architecture

One Databricks App, with React frontend and FastAPI backend, if this combination is supported in the target workspace. Databricks Apps supports Python and Node.js combinations in supported deployment configurations; verify the current app packaging requirements and app resource limits.

## 6.1 High-level architecture

```text
Kaggle source
   |
   v
Unity Catalog Volume / raw file
   |
   v
Bronze Delta -> Silver Delta -> Gold Delta
                                  |
                                  | supported Gold sync
                                  v
                            Lakebase Postgres
                         /                       \
             read-only synced data          writable app tables
                       |                           |
                       +-------------+-------------+
                                     |
                               FastAPI backend
                      Routes -> Controllers -> Services
                               -> Repositories
                                     |
                    +----------------+----------------+
                    |                                 |
               React UI                         AI Supervisor
                    |                                 |
           HTTP requests only              +----------+-----------+
                                           |                      |
                                     Genie Agent             MCP tools
                                    (analytics/read)      (controlled actions)
                                                                  |
                                                          shared Services
                                                                  |
                                                               Lakebase
```

Important: React only calls FastAPI over HTTP. The browser must never connect directly to Lakebase, invoke privileged Databricks APIs, or hold credentials.

## 6.2 Suggested repository structure

Adapt to the existing repository rather than overwriting it. Prefer one repository for the whole learning project so data engineering, app, infra/config, and documentation evolve together.

```text
.
├── CLAUDE.md
├── IMPLEMENTATION_PLAN.md
├── README.md
├── .gitignore
├── .env.example
├── databricks.yml                 # Bundle config, if supported/selected
├── resources/                     # Bundle resource definitions
├── data_engineering/
│   ├── ingestion/
│   ├── bronze/
│   ├── silver/
│   ├── gold/
│   ├── quality/
│   └── tests/
├── app/
│   ├── app.yaml                   # Only if required by current Apps config
│   ├── backend/
│   │   ├── main.py
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   └── dependencies.py
│   │   ├── controllers/
│   │   ├── schemas/               # Pydantic request/response models
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── db/
│   │   ├── auth/
│   │   ├── agent/
│   │   ├── mcp/
│   │   ├── config.py
│   │   └── tests/
│   └── frontend/
│       ├── package.json
│       ├── src/
│       │   ├── app/
│       │   ├── components/
│       │   ├── features/
│       │   │   ├── dashboard/
│       │   │   ├── products/
│       │   │   ├── transactions/
│       │   │   └── assistant/
│       │   ├── api/
│       │   ├── hooks/
│       │   ├── types/
│       │   └── styles/
│       └── tests/
├── migrations/
├── scripts/
├── docs/
│   ├── ENVIRONMENT_AUDIT.md
│   ├── DATASET.md
│   ├── DATA_MODEL.md
│   ├── KPIS.md
│   ├── SECURITY.md
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT.md
│   └── TROUBLESHOOTING.md
└── tests/
```

Do not put the entire app in the data engineering directory. Keep data pipelines separate from web application code, while maintaining a single repository.

## 6.3 Backend layering

Use explicit separation:
- **Routes:** HTTP contract, status codes, dependencies.
- **Controllers:** translate HTTP inputs into service calls; keep thin.
- **Schemas:** Pydantic validation and typed responses.
- **Services:** business rules, authorization decisions, transactions, audit events.
- **Repositories:** SQLAlchemy/Postgres queries; no authorization policy hidden here.
- **DB:** engine/session lifecycle, migrations, health checks.
- **Agent/MCP:** adapters that call the same services; do not implement a second path to the database.

Keep SQL parameterized. Never construct SQL from raw LLM/user strings. Avoid exposing database errors or stack traces to clients.

## 6.4 API conventions

Implement documented endpoints, adapted to the selected entities:

- `GET /api/health`
- `GET /api/dashboard/summary`
- `GET /api/dashboard/sales-trend`
- `GET /api/dashboard/top-products`
- `GET /api/dashboard/category-breakdown`
- `GET /api/products` / `POST /api/products`
- `GET /api/products/{id}` / `PATCH /api/products/{id}` / `DELETE /api/products/{id}`
- corresponding transaction/order endpoints if the chosen model supports them;
- `POST /api/assistant/chat`
- optional `GET /api/assistant/capabilities` for UI feature flags.

Use pagination, sorting allowlists, filter validation, consistent error responses, and OpenAPI docs. Only expose routes the domain model actually supports. Deletion should be soft delete or constrained hard delete depending on foreign-key dependencies and the documented POC behavior.

---

# 7. Frontend and dashboard

## 7.1 Product goals

Build an operational + analytical + agentic app with a clear visual identity, not a generic CRUD scaffold.

- React with TypeScript.
- Use a maintainable build tool compatible with the current Databricks Apps packaging requirements.
- Use a consistent component library and design tokens. Choose the library after checking current project dependencies; do not add several competing UI libraries.
- Responsive layout for desktop and smaller screens.
- Loading, empty, error, and retry states.
- Accessible labels, keyboard focus, clear table actions, and useful feedback.
- Use predefined React chart/table components. **The AI assistant must not generate arbitrary frontend code or arbitrary charts.** It can recommend a supported chart type or component and return typed parameters that the frontend validates against an allowlist.

## 7.2 Dashboard

Dashboard data must come from FastAPI endpoints querying the appropriate Gold-synced tables in Lakebase. Include:
- KPI cards based on documented formulas;
- time-series chart if the dataset has a meaningful date field;
- top products/categories/customers where the data supports them;
- searchable, filterable data table;
- date/category/region filters where meaningful;
- refresh/last-updated indicator;
- useful empty/error states.

Do not calculate business KPIs independently in multiple React components. Keep the source of truth in Gold/SQL services and reuse the same KPI definitions for Genie.

## 7.3 CRUD UI

Provide:
- list/table with pagination and search;
- create/edit form with client-side convenience validation and server-side authoritative validation;
- details view where useful;
- delete confirmation and clear success/failure messages;
- conflict/not-found handling;
- refresh after successful mutations;
- no direct DB calls from the frontend.

CRUD targets should be writable `app` tables, not read-only synced Gold tables.

## 7.4 Assistant UI

Provide a chat panel or dedicated assistant page with:
- conversation history for the current session;
- clear pending/error states;
- tool/action activity summaries safe to show to the user;
- clear separation between read/analytics answers and proposed mutations;
- confirmation step for destructive or consequential writes;
- typed rendering of tabular summaries and supported chart specifications;
- no arbitrary HTML/JSX/SQL rendering from model output;
- an understandable explanation when a request is outside the available capabilities.

---

# 8. Agentic AI architecture

## 8.1 First verify native Databricks capabilities

Official Databricks documentation describes Genie Agents, MCP integrations, and a Supervisor Agent capability. Before implementing a custom supervisor:
1. inspect the current workspace's agent/AI interfaces and available resources;
2. verify whether a native Supervisor Agent is generally available to this workspace/plan;
3. verify whether it can orchestrate the selected Genie Agent and custom MCP server/tools in the desired Databricks App flow;
4. verify the current SDK/API, authentication method, limitations, and supported deployment path;
5. write findings in `docs/ENVIRONMENT_AUDIT.md`.

Do not assume a prior/obsolete supervisor API is valid. Do not create a native Supervisor Agent and a custom supervisor doing the same job unless there is a documented reason.

## 8.2 Preferred logical design

The intended behavior is a supervisor/orchestrator that chooses between:
- **Analytics/read path:** Genie Agent answers questions against curated Gold data.
- **Operational action path:** MCP tools invoke narrowly scoped FastAPI service methods for permitted CRUD actions.
- **Clarification/confirmation path:** ask the user to clarify an ambiguous target or confirm a consequential mutation.
- **Unsupported request path:** explain that the capability is not implemented.

Implementation choice:
- If a native Databricks Supervisor Agent supports this exact orchestration path and is available, prefer it where it genuinely reduces custom code.
- Otherwise, implement a small explicit supervisor inside FastAPI using a supported Databricks SDK/API or compatible agent framework. Keep the routing policy visible and testable.
- LangGraph is optional, not a requirement. Introduce it only if explicit state, branching, retries, or human approval workflows justify it. A simple deterministic router plus tool calling may be enough for this POC.
- Use a model/endpoint available in the workspace and plan. Do not hard-code a provider until availability and auth are verified.

## 8.3 Routing policy

Implement a documented policy:
1. Classify the user intent into `ANALYTICS_READ`, `CRUD_READ`, `CRUD_CREATE`, `CRUD_UPDATE`, `CRUD_DELETE`, `CLARIFICATION`, or `UNSUPPORTED`.
2. For analytical questions, call Genie with the configured Genie Agent resource/API and return a grounded answer with useful tabular results when available.
3. For CRUD reads, use read tools/services; Genie should not be the mutation interface.
4. For create/update/delete, identify the entity and required fields, validate the user's intent, and call a named tool only after authorization. Require confirmation before delete and other configured high-impact operations.
5. Return a structured response containing `intent`, `message`, optional `data`, optional `visualization_spec`, and optional `confirmation_required`. Validate it with a Pydantic schema.
6. If confidence is low or the request combines incompatible actions, ask a clarifying question rather than guessing.
7. Never let the model decide whether a user has permission. The service layer makes that decision on every request.
8. Never accept model-supplied SQL, arbitrary Python, shell commands, or dynamically generated React code as an executable action.

## 8.4 Genie configuration

Configure a Genie Agent/space around the Gold analytical model:
- add only required Gold tables;
- provide table/column descriptions and synonyms;
- define business terms and KPI formulas;
- add representative sample questions and expected answer behavior;
- document supported question scope and known limitations;
- validate generated answers against known SQL/results.

Example questions, adapted to the actual dataset:
- “What was total revenue by month?”
- “Which products contributed the most revenue?”
- “How did sales change across categories?”
- “What is the average order value for the selected period?”
- “Which region had the highest sales?”

Genie should use the curated analytical model and governance rules. Do not give it write permissions to app tables merely to enable natural-language CRUD.

## 8.5 MCP server and tools

Host a custom MCP server as part of the Databricks App only if supported by the current documented pattern and if it fits the selected architecture. Confirm the required transport/protocol and lifecycle for the current MCP SDK before coding.

Expose a small allowlist of tools, for example:
- `list_products`
- `get_product`
- `create_product`
- `update_product`
- `delete_product`
- `list_transactions` / `get_transaction` if the data model supports these;
- optionally `get_dashboard_summary` for structured read access.

Each tool must:
- have a clear description and strict typed input/output schema;
- validate all inputs;
- call the same application service used by the REST API;
- enforce authorization and domain rules in that service;
- use parameterized SQL and transaction boundaries;
- return a structured success/error result without leaking stack traces or secrets;
- record a minimal audit event for mutations;
- never provide unrestricted SQL or a generic “execute database query” tool.

Do not expose both MCP and REST as independent implementations of the same business logic. MCP is an adapter over the service layer.

## 8.6 Authentication, identity, and authorization

Do not trust a client-provided `user_id`, team name, role, or permission claim. Verify the identity propagation mechanism supported by Databricks Apps and its current authentication documentation.

For the POC:
- define a minimal permission model and document it;
- derive the caller identity from a trusted, validated platform mechanism;
- validate access to each entity/action in the service layer;
- scope queries to the authorized team/owner when that concept exists in the dataset/model;
- deny by default if identity or permission information is missing or invalid;
- ensure the MCP call path receives trusted identity context or uses a documented delegated identity mechanism;
- never treat an LLM-generated statement as evidence of authorization.

If multi-user/team identity cannot be tested in the chosen free/learning workspace, implement and test the authorization interface with a clearly labeled local development identity, and document that end-to-end identity propagation is **not verified**. Do not claim production-grade authorization based only on mocked tests.

## 8.7 Conversation state and observability

For the POC, begin with request-scoped/session-scoped state and a stable conversation ID. Store conversation state only if needed. If persistent state is required, verify the current recommended pattern (Lakebase may be suitable) and avoid storing secrets or unnecessary personal information.

Log:
- request/correlation ID;
- selected route/intent;
- tool name and duration;
- success/failure category;
- confirmation outcome;
- latency and relevant safe metadata.

Do not log access tokens, credentials, full sensitive payloads, or hidden chain-of-thought. Record user-visible explanations and tool outcomes, not private reasoning traces.

---

# 9. Security and reliability requirements

Even though this is a POC, apply safe engineering defaults.

- Pydantic validation on all API/tool inputs.
- Authorization in services, not just frontend controls.
- SQLAlchemy parameterized queries.
- CORS restricted to the actual app origin/configuration; do not use unrestricted CORS as a shortcut.
- Rate/size limits where practical for chat and write endpoints.
- Safe error messages; detailed diagnostics only in protected logs.
- Secret scanning and `.gitignore`.
- Explicit tool allowlist; no arbitrary shell/SQL tools exposed to the model.
- Confirmation for deletes and other consequential writes.
- Transactions for multi-step mutations.
- Idempotency strategy for operations where retries could duplicate records.
- Database constraints as a second line of defense.
- Health/readiness endpoints that do not reveal internal secrets.
- Dependency versions pinned or bounded deliberately; document why.
- Test unauthorized access, invalid IDs, invalid input, duplicate records, missing database, and tool failure.

---

# 10. Testing strategy

## 10.1 Data tests

- input file existence and schema contract;
- raw row counts and schema;
- Silver types, null rules, deduplication, rejected-row counts;
- primary/business key uniqueness;
- valid date and numeric ranges;
- Gold KPI calculations against hand-checkable fixtures;
- Gold-to-Lakebase row counts and aggregate reconciliation;
- repeat ingestion produces the expected state without duplicate inflation.

Use small synthetic fixtures for unit tests. Do not rely on a live Databricks workspace for every test.

## 10.2 Backend tests

- service-level business rules;
- repository tests with a test database or suitable fixtures;
- API tests for success, validation failure, not found, conflict, and server failure;
- CRUD transaction behavior;
- authorization allow/deny tests;
- SQL injection-resistant handling of filters/sorts;
- MCP tools call the same services and return the documented schemas;
- destructive tool calls require the confirmation flow;
- agent router selects the correct path for representative prompts;
- malformed model output is rejected safely.

Mock Genie/model endpoints for deterministic unit tests. Maintain a small set of opt-in integration tests for the actual workspace.

## 10.3 Frontend tests

- dashboard loading/empty/error states;
- filter and pagination behavior;
- CRUD form validation and confirmation;
- assistant response rendering only through known typed components;
- no raw HTML or executable code from model responses;
- basic accessibility and responsive behavior.

## 10.4 End-to-end acceptance

Run a documented sequence:
1. ingest the chosen dataset;
2. run Bronze/Silver/Gold processing;
3. validate KPI totals;
4. sync Gold into Lakebase and verify;
5. open the deployed app and load the dashboard;
6. create, read, update, and delete a demo operational record;
7. ask Genie a supported analytical question;
8. ask the assistant to create/update a record through an MCP tool;
9. confirm a delete and verify it is performed only after confirmation;
10. attempt an unauthorized operation and verify it is denied;
11. rerun ingestion and verify no unintended duplicate growth.

---

# 11. Databricks CLI, bundles, and deployment

## 11.1 CLI-first operation

Use the Databricks CLI for workspace inspection, resource discovery, repeatable deployments, job execution, and app deployment wherever supported. Always check the installed version and command help first.

The CLI is not a magic bypass for permissions: if an operation fails with permission or entitlement errors, record the exact safe error and required privilege. Do not try to bypass access controls.

Prefer OAuth unified authentication. A typical interactive workspace login is:

```bash
databricks auth login --host <workspace-url>
```

Use placeholders in docs and never commit actual workspace URLs if considered sensitive by the repository's policy, tokens, or credentials. Confirm authentication with supported commands such as:

```bash
databricks auth profiles
databricks current-user me
databricks -v
```

## 11.2 Declarative Automation Bundles

Evaluate Bundles for the data job/pipeline and supported app/resources. Current official naming is **Declarative Automation Bundles** (formerly Databricks Asset Bundles). They allow resource configuration and workflows to be versioned with code.

If supported, create a `databricks.yml` and resource YAML definitions. Keep environment-specific IDs and non-secret configuration in target variables. Do not assume every resource (especially newer app/agent/Lakebase features) is bundle-manageable; verify resource support in the current bundle schema and docs. Use the CLI/API/UI for unsupported resources and document the reason.

Expected lifecycle, adapted to installed CLI:
```bash
databricks bundle validate
databricks bundle deploy
databricks bundle run <job-resource-key>
```

Check command help and current docs before executing; exact commands/options may differ by CLI version and project setup.

## 11.3 App deployment

Use the currently supported Databricks Apps deployment path. If deploying from a workspace folder, the documented pattern commonly involves syncing source to a workspace path and deploying from that path. Verify exact current commands and app naming.

Do not deploy until:
- unit tests pass;
- app configuration and dependency files are valid;
- secrets are excluded;
- backend starts locally;
- required app resources and permissions are configured;
- data/DB connectivity is validated or explicitly documented as blocked.

After deployment, check app status/logs and perform the end-to-end smoke test. Record the app URL and resource identifiers in a local/private deployment record, not in source if policy says not to commit them.

## 11.4 Cost and cleanup

This is a learning POC. Prefer minimal compute, small datasets, manual/on-demand job execution, and snapshot sync where appropriate. Do not schedule recurring jobs by default unless the user asks for them. Before provisioning anything that may incur non-trivial charges, inspect the current workspace pricing/entitlements and ask for confirmation if cost is uncertain. Never delete existing workspace resources as a cleanup shortcut.

---

# 12. Implementation phases and exit gates

Claude Code should implement one phase at a time, commit coherent changes when Git is configured, and verify the phase before proceeding.

## Phase 0 — Discovery and feasibility
- inspect repo and current user instructions;
- audit CLI/auth/workspace/plan and official docs;
- inspect existing dataset decision;
- verify app + Lakebase + Genie + MCP/Supervisor capabilities;
- produce `docs/ENVIRONMENT_AUDIT.md`, `docs/ARCHITECTURE.md`, and `docs/IMPLEMENTATION_DECISIONS.md`.

**Exit gate:** architecture does not depend on unverified or unavailable services. Any unavailable capability has a documented fallback.

## Phase 1 — Dataset and ingestion
- select/confirm dataset and record provenance;
- define source contract and volume location;
- implement idempotent ingestion;
- create Bronze table and quality report;
- add tests and runbook.

**Exit gate:** repeat ingestion is safe and raw data is traceable.

## Phase 2 — Silver transformation
- inspect real columns and determine grain/keys;
- implement type cleaning, standardization, deduplication, rejected rows, and quality rules;
- document source-to-Silver mapping;
- add unit/integration tests.

**Exit gate:** Silver data-quality checks pass or known failures are explicitly quantified and explained.

## Phase 3 — Gold analytics and KPI definitions
- design Gold tables from actual use cases;
- implement aggregates and metrics;
- document KPIs and lineage;
- reconcile metrics against Silver.

**Exit gate:** every displayed KPI has a formula and a test.

## Phase 4 — Lakebase setup and sync
- inspect/create POC project/branch/database only with permission;
- create writable app schema and migrations;
- sync Gold tables using a supported method;
- validate names, access, freshness, and reconciliation.

**Exit gate:** read-only analytics and writable CRUD tables are distinct and verified.

## Phase 5 — FastAPI foundation and CRUD
- create DB connection/session handling;
- implement routes/controllers/schemas/services/repositories;
- implement CRUD with constraints and authorization interface;
- add API tests and OpenAPI docs.

**Exit gate:** CRUD passes tests against writable tables and cannot mutate synced read-only analytics tables.

## Phase 6 — React dashboard and CRUD interface
- establish design system and app layout;
- implement KPI cards, charts, filters, tables, and last-updated display;
- implement CRUD forms and confirmation UX;
- add frontend tests.

**Exit gate:** UI consumes FastAPI only and all visualizations use predefined components.

## Phase 7 — Genie and AI assistant
- configure Genie over curated Gold;
- verify Supervisor Agent capability/availability;
- implement native supervisor integration or a custom explicit orchestrator;
- implement MCP tools backed by the same services;
- add routing, confirmation, identity, authorization, typed output, and error handling;
- add agent/MCP tests.

**Exit gate:** analytical reads and mutations are separate; unauthorized writes are rejected by the service layer; model output cannot execute arbitrary code or SQL.

## Phase 8 — Databricks deployment and automation
- configure app resources, secrets, permissions, and build/start commands;
- configure Bundles for supported resources;
- deploy using CLI;
- run end-to-end acceptance tests;
- document unresolved limitations and recovery steps.

**Exit gate:** deployment status and test outcomes are factual and reproducible.

## Phase 9 — Final documentation and handoff
- update README with architecture, prerequisites, setup, commands, data flow, app use, and troubleshooting;
- complete `docs/DEPLOYMENT.md`, `docs/SECURITY.md`, `docs/KPIS.md`, `docs/DATA_MODEL.md`;
- report created resources and identifiers, without secrets;
- provide an honest checklist of completed, partial, and blocked work.

---

# 13. Project-specific constraints and decisions

Treat the following as the current intent unless the repository contains a newer explicit decision:

- This is a **learning POC**, not production.
- Use Databricks-native services wherever feasible, and verify availability in the actual plan/workspace.
- Use one repository for data engineering and the app.
- Use a Kaggle dataset with a transactional/business domain; verify the previously chosen dataset before selecting a replacement.
- Proposed catalog: `data_engineering`.
- Proposed schemas: `bronze`, `silver`, `gold`.
- Proposed raw volume location: `/Volumes/data_engineering/bronze/kaggle_raw/incoming/dataset.csv`, subject to correct UC volume creation and permissions.
- Proposed Gold examples: `customer_summary`, `product_summary`, with actual tables decided by the dataset.
- React talks to FastAPI over HTTP; React never connects directly to Lakebase.
- FastAPI layers: routes → controllers → services → repositories.
- CRUD writes only to writable Lakebase operational tables.
- Gold synced tables serve low-latency analytical reads and are not assumed writable.
- MCP tools call the same service layer as REST routes.
- Genie is the analytical/read path.
- Supervisor chooses the appropriate capability; first check native Supervisor Agent availability and fit, then implement a custom orchestrator only if needed.
- The assistant selects among predefined React components and typed visualization specifications; it does not generate application code at runtime.
- Authorization and business rules are enforced server-side, independent of model behavior.
- Give Claude Code high autonomy for inspection, implementation, tests, and routine CLI use, with explicit approval gates for destructive/costly/security-sensitive actions.

If a newer user decision conflicts with this list, prefer the newer decision and update this section.

---

# 14. Required final report from Claude Code

At the end, provide a concise but complete report with:

1. **Implemented:** features, files, and tests.
2. **Databricks resources:** created/updated resources, names/IDs, and where applicable status.
3. **Data:** selected dataset URL/license, row counts for Bronze/Silver/Gold, rejected rows, KPI reconciliation, sync status.
4. **App:** deployment status, route health, and URL if deployed.
5. **AI:** Genie status, supervisor implementation choice and rationale, MCP tools exposed, supported use cases.
6. **Security:** identity mechanism, permission enforcement, secrets handling, known limitations.
7. **Commands:** reproducible CLI/local commands to ingest, transform, test, deploy, and run.
8. **Tests:** exact test commands and pass/fail counts.
9. **Blocked items:** missing permissions, plan limitations, unavailable APIs/features, or steps needing user action.
10. **Costs/cleanup:** resources that may incur costs and how to stop/pause them safely; never delete resources without approval.

Never report a feature as complete merely because its code exists. Distinguish “implemented locally,” “tested locally,” “deployed,” and “verified end-to-end in Databricks.”

---

# 15. Official documentation to verify during implementation

Use the documentation for the correct cloud and workspace version; the URLs below are official Databricks documentation entry points discovered during plan preparation.

## CLI and deployment
- Databricks CLI overview: https://docs.databricks.com/aws/en/dev-tools/cli/
- CLI authentication: https://docs.databricks.com/gcp/en/dev-tools/cli/authentication
- Deploy a Databricks App: https://docs.databricks.com/aws/en/dev-tools/databricks-apps/deploy
- Develop Databricks Apps: https://docs.databricks.com/aws/en/dev-tools/databricks-apps/app-development

## Bundles / jobs / pipelines
- Declarative Automation Bundles: https://docs.databricks.com/aws/en/dev-tools/bundles/
- Bundle configuration: https://docs.databricks.com/aws/en/dev-tools/bundles/settings
- Bundle resources: https://docs.databricks.com/aws/en/dev-tools/bundles/resources
- Bundle examples: https://docs.databricks.com/aws/en/dev-tools/bundles/examples

## Lakebase
- Lakebase Postgres: https://docs.databricks.com/aws/en/oltp/
- Lakebase projects: https://docs.databricks.com/aws/en/oltp/projects/
- Serve lakehouse data / synced tables quickstart: https://docs.databricks.com/aws/en/oltp/projects/quickstart-synced-tables
- Lakebase CLI: https://docs.databricks.com/aws/en/oltp/projects/cli
- Lakehouse integrations: https://docs.databricks.com/aws/en/oltp/projects/lakehouse-integrations

## Genie, agents, MCP
- Genie overview: https://docs.databricks.com/aws/en/genie/
- Add a Genie Agent resource to an app: https://docs.databricks.com/aws/en/dev-tools/databricks-apps/genie
- Use agents on Databricks: https://docs.databricks.com/aws/en/generative-ai/agent-framework/build-genai-apps
- Build agents: https://docs.databricks.com/aws/en/generative-ai/agent-framework/build-agents
- MCPs and agent tools: https://docs.databricks.com/aws/en/agents/agent-framework/agent-tool
- MCPs in the workspace: https://docs.databricks.com/aws/en/agents/mcp-tools

**Important:** These links are a starting point, not proof that every feature is enabled in this workspace. Verify current URLs, cloud-specific instructions, GA/preview status, plan entitlement, SDK signatures, CLI syntax, and required permissions before relying on them.
