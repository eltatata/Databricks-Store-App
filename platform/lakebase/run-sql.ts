import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import pg from "pg";

interface RunSqlOptions {
  profile: string;
  project: string;
  branch: string;
  database: string;
  sqlFile: string;
  variables: Record<string, string>;
}

interface LakebaseEndpoint {
  name: string;
  status?: { endpoint_type?: string; hosts?: { host?: string } };
}

interface ConnectionTarget {
  host: string;
  user: string;
  password: string;
  database: string;
}

const READ_WRITE_ENDPOINT_TYPE = "ENDPOINT_TYPE_READ_WRITE";
const VARIABLE_PATTERN = /\$\{(\w+)\}/g;

function runDatabricksCli<T>(args: string[], profile: string): T {
  const output = execFileSync("databricks", [...args, "--profile", profile, "-o", "json"], { encoding: "utf8" });
  return JSON.parse(output) as T;
}

function parseVariables(assignments: string[]): Record<string, string> {
  return Object.fromEntries(
    assignments.map((assignment) => {
      const separatorIndex = assignment.indexOf("=");
      if (separatorIndex <= 0) {
        throw new Error(`Invalid --var "${assignment}". Expected key=value`);
      }
      return [assignment.slice(0, separatorIndex), assignment.slice(separatorIndex + 1)];
    }),
  );
}

function parseOptions(argv: string[]): RunSqlOptions {
  const { values } = parseArgs({
    args: argv,
    options: {
      profile: { type: "string" },
      project: { type: "string" },
      branch: { type: "string", default: "production" },
      database: { type: "string", default: "databricks_postgres" },
      file: { type: "string" },
      var: { type: "string", multiple: true, default: [] },
    },
  });
  if (!values.profile || !values.project || !values.file) {
    throw new Error("Usage: run-sql --profile <profile> --project <id> --file <sql> [--branch <id>] [--database <name>] [--var key=value]");
  }
  return {
    profile: values.profile,
    project: values.project,
    branch: values.branch ?? "production",
    database: values.database ?? "databricks_postgres",
    sqlFile: values.file,
    variables: parseVariables(values.var ?? []),
  };
}

function renderSql(template: string, variables: Record<string, string>): string {
  return template.replace(VARIABLE_PATTERN, (_placeholder, variableName: string) => {
    const value = variables[variableName];
    if (value === undefined) {
      throw new Error(`Missing --var ${variableName}=<value> for the SQL file`);
    }
    return value;
  });
}

function findReadWriteEndpoint(options: RunSqlOptions): LakebaseEndpoint {
  const branchPath = `projects/${options.project}/branches/${options.branch}`;
  const endpoints = runDatabricksCli<LakebaseEndpoint[]>(["postgres", "list-endpoints", branchPath], options.profile);
  const endpoint = endpoints.find((candidate) => candidate.status?.endpoint_type === READ_WRITE_ENDPOINT_TYPE) ?? endpoints[0];
  if (!endpoint?.status?.hosts?.host) {
    throw new Error(`No read-write endpoint with a host found in ${branchPath}`);
  }
  return endpoint;
}

function resolveConnectionTarget(options: RunSqlOptions): ConnectionTarget {
  const endpoint = findReadWriteEndpoint(options);
  const credential = runDatabricksCli<{ token: string }>(["postgres", "generate-database-credential", endpoint.name], options.profile);
  const currentUser = runDatabricksCli<{ userName: string }>(["current-user", "me"], options.profile);
  return {
    host: endpoint.status?.hosts?.host ?? "",
    user: currentUser.userName,
    password: credential.token,
    database: options.database,
  };
}

async function executeSql(target: ConnectionTarget, sql: string): Promise<void> {
  const client = new pg.Client({ ...target, port: 5432, ssl: { rejectUnauthorized: true } });
  await client.connect();
  try {
    const results = [await client.query(sql)].flat();
    results.filter((result) => result.rows.length > 0).forEach((result) => console.table(result.rows));
  } finally {
    await client.end();
  }
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  const sql = renderSql(readFileSync(options.sqlFile, "utf8"), options.variables);
  const target = resolveConnectionTarget(options);
  console.log(`==> Running ${options.sqlFile} on ${target.host}/${target.database} as ${target.user}`);
  await executeSql(target, sql);
  console.log(`==> Done`);
}

main().catch((error: unknown) => {
  console.error(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
