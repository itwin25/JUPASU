from __future__ import annotations

import argparse
import json
import sys

from .transformer import build_embedding_text_ko, build_pgvector_document, build_wine_narrative_ko


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate pgvector-ready wine text from raw JSON.")
    parser.add_argument("input_json", help="Path to a raw wine JSON file")
    args = parser.parse_args()

    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    with open(args.input_json, "r", encoding="utf-8") as file:
        wine = json.load(file)

    document = build_pgvector_document(wine)
    print("[metadata]")
    print(json.dumps(document.metadata, ensure_ascii=False, indent=2))
    print()
    print("[embedding_text]")
    print(document.embedding_text)
    print()
    print("[narrative_ko]")
    print(build_wine_narrative_ko(wine))
    print()
    print("[embedding_text_ko]")
    print(build_embedding_text_ko(wine))


if __name__ == "__main__":
    main()

