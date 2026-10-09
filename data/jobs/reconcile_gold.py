import argparse
import sys
from collections.abc import Callable
from dataclasses import dataclass
from decimal import Decimal

EXPECTED_BRONZE_ROW_COUNTS = {
    "orders_raw": 99441,
    "order_items_raw": 112650,
    "order_payments_raw": 103886,
    "order_reviews_raw": 99224,
    "customers_raw": 99441,
    "sellers_raw": 3095,
    "products_raw": 32951,
    "category_translations_raw": 71,
}

GOLD_PRIMARY_KEYS = {
    "dim_product": ("product_id",),
    "kpi_daily": ("order_date",),
    "sales_by_category_month": ("order_month", "category_en"),
    "sales_by_state_month": ("order_month", "customer_state"),
    "product_performance": ("product_id",),
    "seller_performance": ("seller_id",),
    "fact_sales": ("order_id", "order_item_id"),
    "fact_orders": ("order_id",),
}

QUARANTINE_TABLES = (
    "orders_quarantine",
    "order_items_quarantine",
    "order_payments_quarantine",
    "order_reviews_quarantine",
    "customers_quarantine",
    "sellers_quarantine",
    "products_quarantine",
)

ScalarQuery = Callable[[str], object]


@dataclass(frozen=True)
class CheckResult:
    name: str
    expected: object
    actual: object

    @property
    def passed(self) -> bool:
        return normalize(self.expected) == normalize(self.actual)


def normalize(value: object) -> object:
    if isinstance(value, Decimal):
        return value.quantize(Decimal("0.01"))
    if isinstance(value, float):
        return Decimal(str(value)).quantize(Decimal("0.01"))
    return value


def check_bronze_row_counts(catalog: str, query_scalar: ScalarQuery) -> list[CheckResult]:
    return [
        CheckResult(
            name=f"bronze.{table} row count",
            expected=expected_count,
            actual=query_scalar(f"SELECT count(*) FROM {catalog}.bronze.{table}"),
        )
        for table, expected_count in EXPECTED_BRONZE_ROW_COUNTS.items()
    ]


def check_gold_primary_keys(catalog: str, query_scalar: ScalarQuery) -> list[CheckResult]:
    results = []
    for table, key_columns in GOLD_PRIMARY_KEYS.items():
        keys = ", ".join(key_columns)
        null_condition = " OR ".join(f"{column} IS NULL" for column in key_columns)
        duplicate_keys = query_scalar(
            f"SELECT count(*) FROM (SELECT {keys} FROM {catalog}.gold.{table} GROUP BY {keys} HAVING count(*) > 1)"
        )
        null_keys = query_scalar(f"SELECT count(*) FROM {catalog}.gold.{table} WHERE {null_condition}")
        results.append(CheckResult(name=f"gold.{table} duplicate keys", expected=0, actual=duplicate_keys))
        results.append(CheckResult(name=f"gold.{table} null keys", expected=0, actual=null_keys))
    return results


def check_gold_totals(catalog: str, query_scalar: ScalarQuery) -> list[CheckResult]:
    valid_items_from_silver = (
        f"FROM {catalog}.silver.order_items AS items "
        f"JOIN {catalog}.silver.orders AS orders ON items.order_id = orders.order_id "
        f"WHERE orders.order_status NOT IN ('canceled', 'unavailable')"
    )
    silver_totals = {
        "gmv": query_scalar(f"SELECT sum(items.price) {valid_items_from_silver}"),
        "items": query_scalar(f"SELECT count(*) {valid_items_from_silver}"),
        "orders": query_scalar(f"SELECT count(DISTINCT items.order_id) {valid_items_from_silver}"),
    }
    gold_totals = (
        ("kpi_daily", "sum(gmv)", "gmv"),
        ("kpi_daily", "sum(orders)", "orders"),
        ("kpi_daily", "sum(items_sold)", "items"),
        ("sales_by_category_month", "sum(gmv)", "gmv"),
        ("sales_by_state_month", "sum(gmv)", "gmv"),
        ("product_performance", "sum(gmv)", "gmv"),
        ("seller_performance", "sum(gmv)", "gmv"),
        ("fact_sales WHERE is_valid_sale", "sum(price)", "gmv"),
    )
    return [
        CheckResult(
            name=f"gold.{table} {aggregate} = silver {metric}",
            expected=silver_totals[metric],
            actual=query_scalar(f"SELECT {aggregate} FROM {catalog}.gold.{table}"),
        )
        for table, aggregate, metric in gold_totals
    ]


def report_quarantine(catalog: str, query_scalar: ScalarQuery) -> dict[str, object]:
    return {table: query_scalar(f"SELECT count(*) FROM {catalog}.silver.{table}") for table in QUARANTINE_TABLES}


def find_failures(results: list[CheckResult]) -> list[CheckResult]:
    return [result for result in results if not result.passed]


def format_result(result: CheckResult) -> str:
    status = "PASS" if result.passed else "FAIL"
    return f"[{status}] {result.name}: expected={result.expected} actual={result.actual}"


def run_checks(catalog: str, query_scalar: ScalarQuery) -> list[CheckResult]:
    return [
        *check_bronze_row_counts(catalog, query_scalar),
        *check_gold_primary_keys(catalog, query_scalar),
        *check_gold_totals(catalog, query_scalar),
    ]


def build_spark_scalar_query() -> ScalarQuery:
    from pyspark.sql import SparkSession

    spark = SparkSession.builder.getOrCreate()
    return lambda statement: spark.sql(statement).collect()[0][0]


def parse_arguments(arguments: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--catalog", required=True)
    return parser.parse_args(arguments)


def main(arguments: list[str]) -> None:
    options = parse_arguments(arguments)
    query_scalar = build_spark_scalar_query()
    results = run_checks(options.catalog, query_scalar)
    for result in results:
        print(format_result(result))
    for table, rejected_rows in report_quarantine(options.catalog, query_scalar).items():
        print(f"[INFO] silver.{table}: {rejected_rows} rejected rows")
    failures = find_failures(results)
    if failures:
        raise SystemExit(f"{len(failures)} reconciliation checks failed")
    print(f"All {len(results)} reconciliation checks passed")


if __name__ == "__main__":
    main(sys.argv[1:])
