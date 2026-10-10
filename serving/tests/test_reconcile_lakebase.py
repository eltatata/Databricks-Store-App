from decimal import Decimal

from reconcile_lakebase import GMV_TABLES, SYNCED_TABLES, CheckResult, build_checks, find_failures


def query_returning(answers: dict[str, object]):
    def query_scalar(statement: str) -> object:
        for fragment, answer in answers.items():
            if fragment in statement:
                return answer
        raise AssertionError(f"Unexpected statement: {statement}")

    return query_scalar


def gold_answers() -> dict[str, object]:
    return {
        **{f"sum(gmv) FROM catalog.gold.{table}": Decimal("100.00") for table in GMV_TABLES},
        **{f"count(*) FROM catalog.gold.{table}": 10 for table in SYNCED_TABLES},
    }


def lakebase_answers() -> dict[str, object]:
    return {
        **{f"sum(gmv) FROM serving.{table}": Decimal("100.00") for table in GMV_TABLES},
        **{f"count(*) FROM serving.{table}": 10 for table in SYNCED_TABLES},
    }


def test_checks_pass_when_lakebase_matches_gold() -> None:
    results = build_checks("catalog", query_returning(gold_answers()), query_returning(lakebase_answers()))

    assert len(results) == len(SYNCED_TABLES) + len(GMV_TABLES)
    assert find_failures(results) == []


def test_checks_fail_when_a_synced_table_is_stale() -> None:
    stale = {**lakebase_answers(), "count(*) FROM serving.kpi_daily": 9}

    results = build_checks("catalog", query_returning(gold_answers()), query_returning(stale))

    assert [failure.name for failure in find_failures(results)] == ["serving.kpi_daily rows = gold.kpi_daily rows"]


def test_check_result_compares_postgres_numeric_strings_with_decimals() -> None:
    assert CheckResult("gmv", Decimal("13494400.74"), "13494400.74").passed


def test_check_result_compares_counts_across_int_types() -> None:
    assert CheckResult("rows", 614, Decimal("614")).passed
