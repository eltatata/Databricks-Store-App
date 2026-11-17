import argparse
import os
import sys
from dataclasses import dataclass

LANDING_ENTITIES = (
    "orders",
    "order_items",
    "order_payments",
    "order_reviews",
    "customers",
    "sellers",
    "products",
    "category_translations",
)


@dataclass(frozen=True)
class EntityFiles:
    entity: str
    csv_files: tuple[str, ...]
    empty_files: tuple[str, ...]

    @property
    def is_ready(self) -> bool:
        return len(self.csv_files) > 0 and len(self.empty_files) == 0


def build_landing_path(catalog: str) -> str:
    return f"/Volumes/{catalog}/bronze/landing/olist"


def inspect_entity(landing_path: str, entity: str) -> EntityFiles:
    entity_path = os.path.join(landing_path, entity)
    if not os.path.isdir(entity_path):
        return EntityFiles(entity=entity, csv_files=(), empty_files=())
    csv_files = tuple(sorted(name for name in os.listdir(entity_path) if name.lower().endswith(".csv")))
    empty_files = tuple(name for name in csv_files if os.path.getsize(os.path.join(entity_path, name)) == 0)
    return EntityFiles(entity=entity, csv_files=csv_files, empty_files=empty_files)


def find_unready_entities(entity_files: list[EntityFiles]) -> list[EntityFiles]:
    return [files for files in entity_files if not files.is_ready]


def describe(files: EntityFiles) -> str:
    if not files.csv_files:
        return f"{files.entity}: no CSV files"
    if files.empty_files:
        return f"{files.entity}: empty files {', '.join(files.empty_files)}"
    return f"{files.entity}: {', '.join(files.csv_files)}"


def parse_arguments(arguments: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--catalog", required=True)
    return parser.parse_args(arguments)


def main(arguments: list[str]) -> None:
    options = parse_arguments(arguments)
    landing_path = build_landing_path(options.catalog)
    entity_files = [inspect_entity(landing_path, entity) for entity in LANDING_ENTITIES]
    for files in entity_files:
        print(describe(files))
    unready_entities = find_unready_entities(entity_files)
    if unready_entities:
        raise SystemExit(f"Landing zone not ready: {'; '.join(describe(files) for files in unready_entities)}")
    print(f"Landing zone ready: {len(entity_files)} entities in {landing_path}")


if __name__ == "__main__":
    main(sys.argv[1:])
