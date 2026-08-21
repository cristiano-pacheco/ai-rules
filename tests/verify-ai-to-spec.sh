#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
SKILL="$ROOT/skills/ai-to-spec/SKILL.md"

test -f "$SKILL"
grep -Fqx 'name: ai-to-spec' "$SKILL"
grep -Fqx 'disable-model-invocation: true' "$SKILL"

# The skill derives the Matt flow while publishing into the AI Tools workplan.
grep -Fq 'Do NOT interview the user' "$SKILL"
grep -Fq 'Explore the repository' "$SKILL"
grep -Fq 'testing seams' "$SKILL"
grep -Fq 'Check with the user' "$SKILL"
grep -Fq '## Problem Statement' "$SKILL"
grep -Fq '## Further Notes' "$SKILL"
grep -Fq 'As an <actor>, I want <feature>, so that <benefit>' "$SKILL"

# The workplan is resolved before writes and remains connected in Obsidian.
grep -Fq 'git rev-parse --show-toplevel' "$SKILL"
grep -Fq 'engineering/<project>/workplans/<feature>/spec.md' "$SKILL"
grep -Fq '[[engineering/<project>/workplans/<feature>/spec|Spec]]' "$SKILL"
grep -Fq 'ai-to-spec: <feature>' "$SKILL"
grep -Fq 'append-if-missing' "$SKILL"
grep -Fq 'never run vault Git commands' "$SKILL"
grep -Fq 'no `origin`, or a push failure' "$SKILL"

# The seam gate is complete before the publishing phase begins.
confirm_line=$(grep -n 'confirmation before writing vault artifacts' "$SKILL" | cut -d: -f1)
publish_line=$(grep -n '^## Publish to the vault$' "$SKILL" | cut -d: -f1)
test "$confirm_line" -lt "$publish_line"

printf '%s\n' 'ai-to-spec fixture: PASS'
