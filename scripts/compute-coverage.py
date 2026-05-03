#!/usr/bin/env python3
"""Parse Vitest coverage-final.json and print total line coverage percentage."""
import json
import sys

try:
    with open("coverage/coverage-final.json") as f:
        data = json.load(f)
except (FileNotFoundError, json.JSONDecodeError):
    print("0")
    sys.exit(0)

total_lines = 0
covered_lines = 0

for file_path, file_data in data.items():
    if "s" in file_data and "statementMap" in file_data:
        statements = file_data["s"]
        total_lines += len(statements)
        covered_lines += sum(1 for v in statements.values() if v > 0)

if total_lines == 0:
    print("0")
else:
    pct = (covered_lines / total_lines) * 100
    print(f"{pct:.2f}")
