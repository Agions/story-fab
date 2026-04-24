#!/usr/bin/env python3
import json, sys

with open('coverage/coverage-final.json') as f:
    d = json.load(f)

total = 0
covered = 0
for fp, data in d.items():
    s = data.get('s', {})
    for v in s.values():
        total += 1
        if v > 0:
            covered += 1

pct = round(covered / total * 100, 2) if total > 0 else 0
print(pct)
