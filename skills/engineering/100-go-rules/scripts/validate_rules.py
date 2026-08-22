#!/usr/bin/env python3
"""Validate the 100-rule corpus with colocated Bad/Better examples."""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
REFS = ROOT / "references"
DOMAIN_FILES = sorted(REFS.glob("[0-9][0-9]-*.md"))
EXAMPLE_FILES = sorted(REFS.glob("examples-[0-9][0-9]-*.md"))
HEADING = re.compile(r"^## #(\d+)\s+—\s+(.+)$", re.MULTILINE)

errors = []
found = []

if len(DOMAIN_FILES) != 11:
    errors.append(f"expected 11 domain files, found {len(DOMAIN_FILES)}")
if EXAMPLE_FILES:
    errors.append(f"examples must be colocated; found separate files: {[p.name for p in EXAMPLE_FILES]}")

for path in DOMAIN_FILES:
    text = path.read_text(encoding="utf-8")
    if text.count("```") % 2:
        errors.append(f"{path.name}: unbalanced code fences")
    headings = list(HEADING.finditer(text))
    for i, match in enumerate(headings):
        n = int(match.group(1))
        found.append((n, match.group(2).strip(), path.name))
        start = match.end()
        end = headings[i + 1].start() if i + 1 < len(headings) else len(text)
        section = text[start:end]
        for marker in ("**Rule:**", "**Why:**", "**Apply:**", "### Examples", "**Bad", "**Better"):
            if marker not in section:
                errors.append(f"{path.name}: rule #{n} missing {marker}")
        if section.count("```") < 4:
            errors.append(f"{path.name}: rule #{n} should contain fenced Bad and Better examples")

ids = [n for n, _, _ in found]
missing = sorted(set(range(1, 101)) - set(ids))
duplicates = sorted({n for n in ids if ids.count(n) > 1})
out_of_range = sorted({n for n in ids if n < 1 or n > 100})
if len(found) != 100:
    errors.append(f"expected 100 numbered headings, found {len(found)}")
if missing:
    errors.append(f"missing rules {missing}")
if duplicates:
    errors.append(f"duplicate rules {duplicates}")
if out_of_range:
    errors.append(f"out-of-range rules {out_of_range}")

if errors:
    print("INVALID")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)

print("OK: 100 unique numbered rules across 11 domain files")
print("OK: every rule colocates Rule/Why/Apply with Bad/Better examples")
print("OK: no separate examples files remain")
for path in DOMAIN_FILES:
    count = len(HEADING.findall(path.read_text(encoding="utf-8")))
    print(f"- {path.name}: {count} self-contained rules")
