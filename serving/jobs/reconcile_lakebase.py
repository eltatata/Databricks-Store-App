import argparse
import sys
from collections.abc import Callable
from dataclasses import dataclass
from decimal import Decimal

SYNCED_TABLES = (
    "kpi_daily",
    "dim_product",
    "sales_by_category_month",
    "sales_by_state_month",
    "product_performance",
    "seller_performance",
    "customer_activity_daily",
)

GMV_TABLES = (
    "kpi_daily",
    "sales_by_category_month",
    "sales_by_state_month",
    "product_performance",
    "seller_performance",
)

READ_WRITE_ENDPOINT_TYPE = "ENDPOINT_TYPE_READ_WRITE"

ScalarQuery = Callable[[str], object]


@dataclass(frozen=True)
class CheckResult:
    name: str
    expected: object
    actual: object

    @property
    def passed(self) -> bool:
        return normalize(self.expected) == normalize(self.actual)


@dataclass(frozen=True)
class LakebaseTarget:
    host: str
    user: str
    password: str
    database: str


def normalize(value: object) -> object:
    if isinstance(value, Decimal | float):
        return Decimal(str(value)).quantize(Decimal("0.01"))
    if isinstance(value, str) and value.replace(".", "", 1).isdigit():
        return Decimal(value).quantize(Decimal("0.01"))
    if isinstance(value, int):
        return Decimal(value).quantize(Decimal("0.01"))
    return value


def build_checks(catalog: str, query_gold: ScalarQuery, query_lakebase: ScalarQuery) -> list[CheckResult]:
    row_checks = [
        CheckResult(
            name=f"serving.{table} rows = gold.{table} rows",
            expected=query_gold(f"SELECT count(*) FROM {catalog}.gold.{table}"),
            actual=query_lakebase(f"SELECT count(*) FROM serving.{table}"),
        )
        for table in SYNCED_TABLES
    ]
    gmv_checks = [
        CheckResult(
            name=f"serving.{table} gmv = gold.{table} gmv",
            expected=query_gold(f"SELECT sum(gmv) FROM {catalog}.gold.{table}"),
            actual=query_lakebase(f"SELECT sum(gmv) FROM serving.{table}"),
        )
        for table in GMV_TABLES
    ]
    return [*row_checks, *gmv_checks]


def find_failures(results: list[CheckResult]) -> list[CheckResult]:
    return [result for result in results if not result.passed]


def format_result(result: CheckResult) -> str:
    status = "PASS" if result.passed else "FAIL"
    return f"[{status}] {result.name}: expected={result.expected} actual={result.actual}"


def resolve_lakebase_target(project: str, branch: str, database: str) -> LakebaseTarget:
    from databricks.sdk import WorkspaceClient

    workspace = WorkspaceClient()
    endpoints = list(workspace.postgres.list_endpoints(parent=f"projects/{project}/branches/{branch}"))
    read_write_endpoints = [endpoint for endpoint in endpoints if READ_WRITE_ENDPOINT_TYPE in str(endpoint.status.endpoint_type)]
    endpoint = (read_write_endpoints or endpoints)[0]
    credential = workspace.postgres.generate_database_credential(endpoint=endpoint.name)
    return LakebaseTarget(
        host=endpoint.status.hosts.host,
        user=workspace.current_user.me().user_name,
        password=credential.token,
        database=database,
    )


def build_lakebase_scalar_query(target: LakebaseTarget) -> ScalarQuery:
    import ssl

    import pg8000.native

    connection = pg8000.native.Connection(
        user=target.user,
        password=target.password,
        host=target.host,
        database=target.database,
        ssl_context=ssl.create_default_context(),
    )
    return lambda statement: connection.run(statement)[0][0]


def build_spark_scalar_query() -> ScalarQuery:
    from pyspark.sql import SparkSession

    spark = SparkSession.builder.getOrCreate()
    return lambda statement: spark.sql(statement).collect()[0][0]


def parse_arguments(arguments: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--catalog", required=True)
    parser.add_argument("--project", required=True)
    parser.add_argument("--branch", required=True)
    parser.add_argument("--database", required=True)
    return parser.parse_args(arguments)


def main(arguments: list[str]) -> None:
    options = parse_arguments(arguments)
    target = resolve_lakebase_target(options.project, options.branch, options.database)
    results = build_checks(options.catalog, build_spark_scalar_query(), build_lakebase_scalar_query(target))
    for result in results:
        print(format_result(result))
    failures = find_failures(results)
    if failures:
        raise SystemExit(f"{len(failures)} Lakebase reconciliation checks failed")
    print(f"All {len(results)} Lakebase reconciliation checks passed")


if __name__ == "__main__":
    main(sys.argv[1:])
