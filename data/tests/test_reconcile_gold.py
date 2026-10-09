from decimal import Decimal

from reconcile_gold import (
    EXPECTED_BRONZE_ROW_COUNTS,
    CheckResult,
    check_bronze_row_counts,
    check_gold_primary_keys,
    check_gold_totals,
    find_failures,
)


def query_returning(answers: dict[str, object], default: object = 0):
    def query_scalar(statement: str) -> object:
        for fragment, answer in answers.items():
            if fragment in statement:
                return answer
        return default

    return query_scalar


def test_check_result_passes_on_equal_decimals_with_different_scale() -> None:
    assert CheckResult("gmv", Decimal("10.5"), Decimal("10.50")).passed


def test_check_result_passes_on_float_and_decimal_with_same_cents() -> None:
    assert CheckResult("gmv", Decimal("10.50"), 10.5).passed


def test_check_result_fails_on_different_values() -> None:
    assert not CheckResult("orders", 10, 11).passed


def test_bronze_row_counts_pass_when_counts_match() -> None:
    answers = {f"bronze.{table}": count for table, count in EXPECTED_BRONZE_ROW_COUNTS.items()}

    results = check_bronze_row_counts("catalog", query_returning(answers))

    assert find_failures(results) == []


def test_bronze_row_counts_fail_on_duplicated_ingestion() -> None:
    answers = {f"bronze.{table}": count * 2 for table, count in EXPECTED_BRONZE_ROW_COUNTS.items()}

    results = check_bronze_row_counts("catalog", query_returning(answers))

    assert len(find_failures(results)) == len(EXPECTED_BRONZE_ROW_COUNTS)


def test_gold_primary_keys_fail_on_duplicates() -> None:
    results = check_gold_primary_keys("catalog", query_returning({"gold.kpi_daily GROUP BY": 3}))

    failures = find_failures(results)

    assert [failure.name for failure in failures] == ["gold.kpi_daily duplicate keys"]


def test_gold_totals_fail_when_a_table_drifts_from_silver() -> None:
    answers = {
        "SELECT sum(items.price)": Decimal("100.00"),
        "SELECT count(*) FROM catalog.silver": 4,
        "SELECT count(DISTINCT items.order_id)": 2,
        "sum(orders) FROM catalog.gold.kpi_daily": 2,
        "sum(items_sold) FROM catalog.gold.kpi_daily": 4,
        "gold.kpi_daily": Decimal("100.00"),
        "gold.sales_by_category_month": Decimal("100.00"),
        "gold.sales_by_state_month": Decimal("100.00"),
        "gold.product_performance": Decimal("99.99"),
        "gold.seller_performance": Decimal("100.00"),
        "gold.fact_sales": Decimal("100.00"),
    }

    results = check_gold_totals("catalog", query_returning(answers))

    failure_names = [failure.name for failure in find_failures(results)]
    assert failure_names == ["gold.product_performance sum(gmv) = silver gmv"]
