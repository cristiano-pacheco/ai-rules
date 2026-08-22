---
name: 100-go-rules
description: Apply a compact, Go-version-aware rulebook derived from the 100 numbered mistakes cataloged by 100go.co when writing, reviewing, debugging, refactoring, testing, benchmarking, or optimizing Go code. Includes compact bad/better code examples colocated with each of the 100 rules. Use for Go code reviews, API/package design, slices/maps/strings, errors, concurrency, standard-library usage, tests/benchmarks, memory/performance, Docker/Kubernetes runtime behavior, or explicit 100 Go Mistakes rule numbers. Baseline is Go 1.26; adapt to the module's declared Go language version when known.
---

# 100 Go Rules

Use this skill as a compact rule engine, not as a book to read end-to-end.

## Selection and operating baseline

- Select this global reference for material Go-language or quality decisions.
  It complements a specialist skill when needed; specialists do not invoke it
  mechanically.
- Locate the target module's `go.mod` before applying version-dependent
  guidance. Use its `go` directive for language semantics when present.
- When no target module or `go` directive is available, use Go 1.26 as the
  fallback baseline. Do not describe that fallback as a discovered project
  version.
- Treat user-specified version constraints as authoritative.
- Read `references/version-notes-go1.26.md` when a finding touches version-sensitive behavior or the project targets a version other than 1.26.
- Prefer current Go semantics, compiler/runtime evidence, and standard-library behavior over historical advice.

## Progressive disclosure

Load the smallest domain file that covers the task. Each numbered rule is self-contained and keeps its explanation and `Bad`/`Better` examples together, so never search for a second examples file.

| Rules | Domain | Reference |
|---|---|---|
| 1-16 | Code/project | `references/01-code-project.md` |
| 17-29 | Data types | `references/02-data-types.md` |
| 30-35 | Control structures | `references/03-control-structures.md` |
| 36-41 | Strings | `references/04-strings.md` |
| 42-47 | Functions/methods | `references/05-functions-methods.md` |
| 48-54 | Errors | `references/06-errors.md` |
| 55-60 | Concurrency foundations | `references/07-concurrency-foundations.md` |
| 61-74 | Concurrency practice | `references/08-concurrency-practice.md` |
| 75-81 | Standard library | `references/09-standard-library.md` |
| 82-90 | Testing | `references/10-testing.md` |
| 91-100 | Optimization/runtime | `references/11-optimization-runtime.md` |

Follow these loading rules:

1. For a normal task, load one domain file; load at most three when the code genuinely spans domains.
2. For a specific rule number, load only its domain file and focus on that rule's section.
3. For a code review, use the colocated examples only as diagnostic/remediation aids; do not mechanically copy them into the response.
4. For a full audit against all 100 rules, evaluate domain files sequentially rather than preloading all eleven.
5. Read `references/version-notes-go1.26.md` only for version-sensitive findings or compatibility analysis.

## Execution and completion

1. Determine the effective Go version and select only the applicable domain
   reference(s).
2. Apply the relevant rules to the concrete code or design decision; validate
   claims against local code and use focused tests, benchmarks, compiler, or
   runtime evidence when available.
3. Report the effective version (and whether it was discovered or a fallback),
   loaded domain(s), material guidance, and validation evidence. State when no
   validation command was available.

## Applying rules

- Treat each rule as a diagnostic heuristic, not an unconditional law.
- Prioritize correctness and resource safety, then API clarity/maintainability, then performance.
- Validate a suspected issue against actual code context before reporting it.
- Do not report a rule merely because its keyword appears.
- Do not recommend speculative abstractions or micro-optimizations without evidence.
- For performance findings, use or request benchmarks/profiles when the claim depends on workload behavior.
- When rules conflict, preserve correctness and choose the simplest API for demonstrated requirements.
- Treat each **Bad**/**Better** pair as an illustration, not a mechanical rewrite template. Adapt names, ownership, errors, concurrency, and lifecycle to the actual code.

## Code review output

For each material finding, provide:

- severity: `bug`, `risk`, `maintainability`, or `performance`
- location or code fragment
- rule number and short title
- concise explanation tied to the concrete code
- smallest practical fix
- a compact before/after snippet when it materially clarifies the fix
- version note only when behavior differs across Go versions

Avoid dumping unrelated rules. If no relevant violation is found, say so.

## Code generation and refactoring

Apply relevant rules silently while producing code. Mention rule numbers only when they explain a non-obvious design choice, tradeoff, or compatibility constraint.

## Source and adaptation policy

The numbered taxonomy and titles originate from Teiva Harsanyi's **100 Go Mistakes and How to Avoid Them** / 100go.co. Rule explanations and code snippets in this skill are compact adaptations written for this skill, updated for Go 1.26, and are not intended as verbatim copies of the site's prose or examples. Preserve this attribution if redistributing or substantially extending the corpus.
