#!/usr/bin/env python3
"""
Compute overall coverage percentage from coverage-final.json
Output: a single number (e.g. "42.3") or "0" on error
"""
import json
import sys

try:
    with open("coverage/coverage-final.json") as f:
        data = json.load(f)

    total = 0
    covered = 0
    for m in data.values():
        if isinstance(m, dict) and "covered" in m:
            total += m["covered"] + m["missed"]
            covered += m["covered"]

    if total == 0:
        print("0")
    else:
        print(f"{(covered / total) * 100:.1f}")
except Exception:
    print("0")
    sys.exit(1)
