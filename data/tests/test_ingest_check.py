from pathlib import Path

import pytest
from ingest_check import LANDING_ENTITIES, EntityFiles, find_unready_entities, inspect_entity, main


def create_landing_zone(root: Path, entities: tuple[str, ...]) -> Path:
    landing_path = root / "Volumes" / "catalog" / "bronze" / "landing" / "olist"
    for entity in entities:
        entity_path = landing_path / entity
        entity_path.mkdir(parents=True)
        (entity_path / f"{entity}.csv").write_text("id\n1\n", encoding="utf-8")
    return landing_path


def test_inspect_entity_finds_csv_files(tmp_path: Path) -> None:
    landing_path = create_landing_zone(tmp_path, ("orders",))

    files = inspect_entity(str(landing_path), "orders")

    assert files.csv_files == ("orders.csv",)
    assert files.is_ready


def test_inspect_entity_reports_missing_folder(tmp_path: Path) -> None:
    files = inspect_entity(str(tmp_path), "orders")

    assert files.csv_files == ()
    assert not files.is_ready


def test_inspect_entity_flags_empty_files(tmp_path: Path) -> None:
    landing_path = create_landing_zone(tmp_path, ("orders",))
    (landing_path / "orders" / "orders.csv").write_text("", encoding="utf-8")

    files = inspect_entity(str(landing_path), "orders")

    assert files.empty_files == ("orders.csv",)
    assert not files.is_ready


def test_find_unready_entities_returns_only_failures() -> None:
    ready = EntityFiles(entity="orders", csv_files=("orders.csv",), empty_files=())
    missing = EntityFiles(entity="sellers", csv_files=(), empty_files=())

    assert find_unready_entities([ready, missing]) == [missing]


def test_main_fails_when_an_entity_is_missing(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    landing_path = create_landing_zone(tmp_path, LANDING_ENTITIES[:-1])
    monkeypatch.setattr("ingest_check.build_landing_path", lambda catalog: str(landing_path))

    with pytest.raises(SystemExit, match="category_translations"):
        main(["--catalog", "catalog"])


def test_main_passes_when_all_entities_are_present(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    landing_path = create_landing_zone(tmp_path, LANDING_ENTITIES)
    monkeypatch.setattr("ingest_check.build_landing_path", lambda catalog: str(landing_path))

    main(["--catalog", "catalog"])
