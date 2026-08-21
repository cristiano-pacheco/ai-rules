#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
SOURCE="$ROOT/tests/fixtures/ai-workplan-manager"
WORK=$(mktemp -d "/tmp/ai-workplan-manager.XXXXXX")
trap 'rm -rf "$WORK"' EXIT
cp -R "$SOURCE/." "$WORK"

PLAN="$WORK/engineering/fixture-project/workplans/example-feature"
TASKS="$PLAN/tasks.md"

task_state() {
  number=$1
  awk -v number="$number" '
    $0 ~ "^[*] \\[[ xX]\\] " number "\\.0 " { print substr($0, 3, 3); exit }
  ' "$TASKS"
}

normalize_number() {
  value=$(printf '%s' "$1" | sed 's/^0*//')
  test -n "$value" || return 1
  case "$value" in *[!0-9]*) return 1 ;; esac
  printf '%02d\n' "$value"
}

resolve_task() {
  requested=$(test "$#" -gt 0 && printf '%s' "$1" || true)
  if test -z "$requested"; then
    requested=$(awk '/^[*] \[ \] [0-9]+\.0 / { sub(/^[*] \[ \] /, ""); sub(/\.0 .*/, ""); print; exit }' "$TASKS")
  fi
  number=$(normalize_number "$requested") || return 1
  raw=$(printf '%s' "$number" | sed 's/^0*//')
  state=$(task_state "$raw")
  test "$state" = '[ ]' || return 1
  test -f "$PLAN/$number-task.md"
  printf '%s\n' "$number"
}

mock_ai_commit() {
  target=$1
  message=$2
  printf 'target: %s\ncommit message: %s\n' "$target" "$message" >"$WORK/ai-commit.log"
}

complete_task() {
  number=$(resolve_task "$1") || return 1
  raw=$(printf '%s' "$number" | sed 's/^0*//')
  awk -v number="$raw" '
    $0 ~ "^[*] \\[ \\] " number "\\.0 " { sub(/\[ \]/, "[x]") }
    { print }
  ' "$TASKS" >"$WORK/tasks.after"
  mv "$WORK/tasks.after" "$TASKS"
  mock_ai_commit vault "ai-workplan-manager: example-feature $number"
}

# No requested number selects the first unchecked task. Explicit 02 resolves too.
test "$(resolve_task)" = 02
test "$(resolve_task 02)" = 02

# Invalid, missing, and already-completed requested tasks are read-only.
before=$(cksum "$TASKS")
! resolve_task bad
! resolve_task 04
! resolve_task 01
test "$before" = "$(cksum "$TASKS")"

cp "$TASKS" "$WORK/tasks.before"
complete_task 02

diff -u "$WORK/tasks.before" "$TASKS" >"$WORK/tasks.diff" || true
test "$(grep -c '^-\* \[ \] 2\.0 Selected pending task$' "$WORK/tasks.diff")" -eq 1
test "$(grep -c '^+\* \[x\] 2\.0 Selected pending task$' "$WORK/tasks.diff")" -eq 1
test "$(grep -Ec '^[+-][*] ' "$WORK/tasks.diff")" -eq 2
test "$(task_state 2)" = '[x]'
test "$(task_state 3)" = '[ ]'
test "$(cat "$WORK/ai-commit.log")" = 'target: vault
commit message: ai-workplan-manager: example-feature 02'

printf '%s\n' 'ai-workplan-manager fixture: PASS'
