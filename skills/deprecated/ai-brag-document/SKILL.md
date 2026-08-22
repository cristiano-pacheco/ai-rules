---
name: ai-brag-document
description: Engineering brag document
disable-model-invocation: true
user-invocable: true
---

# AI Brag Document

Create a concise, evidence-based record of engineering impact that is useful for performance reviews, promotion discussions, calibration, and career reflection.

The document must answer five questions quickly:

1. What changed?
2. Why did it matter?
3. What did the author personally own?
4. What evidence supports the claim?
5. Is the result confirmed, expected, targeted, or still in progress?

## Workflow

Follow these steps in order:

1. Determine the scope and reporting period.
2. Discover relevant work and supporting evidence.
3. Build an internal evidence ledger.
4. Group related work into impact narratives.
5. Write the executive summary.
6. Write the main impact sections.
7. Separate work in progress and unverified outcomes.
8. Add a technical evidence appendix.
9. Run the quality checks.
10. Write the result to `$OBSIDIAN_AI_VAULT/brag-document.md` (default `$HOME/Documents/obsidian/obsidian/brag-document.md`) and verify the persisted file.
11. Ensure `$OBSIDIAN_AI_VAULT/engineering/index.md` links to the brag document.
12. Stage only the generated files and delegate the commit to the `ai-commit` skill (it targets the vault repo, never the code repo).

## Obsidian vault I/O

The Obsidian vault is the mandatory source of truth for the brag document. Read the source notes directly from the filesystem and write the generated document directly back to the same vault.

The vault root resolves from `$OBSIDIAN_AI_VAULT` (defaults to `$HOME/Documents/obsidian/obsidian` if unset) — the same override point used by every `ai-*` skill. Always use these resolved paths:

```bash
VAULT_PATH="${OBSIDIAN_AI_VAULT:-$HOME/Documents/obsidian/obsidian}"
ENGINEERING_PATH="$VAULT_PATH/engineering"
ENGINEERING_INDEX="$ENGINEERING_PATH/index.md"
BRAG_DOCUMENT="$VAULT_PATH/brag-document.md"
```

### Verify the vault

```bash
VAULT_PATH="${OBSIDIAN_AI_VAULT:-$HOME/Documents/obsidian/obsidian}"
ENGINEERING_PATH="$VAULT_PATH/engineering"
ENGINEERING_INDEX="$ENGINEERING_PATH/index.md"
BRAG_DOCUMENT="$VAULT_PATH/brag-document.md"

test -d "$VAULT_PATH" || {
  echo "Obsidian vault not found: $VAULT_PATH" >&2
  exit 1
}

test -d "$ENGINEERING_PATH" || {
  echo "Engineering vault tree not found: $ENGINEERING_PATH" >&2
  exit 1
}
```

Stop when the fixed vault or its `engineering/` tree does not exist. The vault must also be a Git repository:

```bash
git -C "$VAULT_PATH" rev-parse --is-inside-work-tree >/dev/null || {
  echo "Obsidian vault is not a Git repository: $VAULT_PATH" >&2
  exit 1
}
```

Before changing files, inspect the repository state. Unrelated unstaged changes may remain, but the staging area must be empty so the brag-document commit cannot absorb another task:

```bash
git -C "$VAULT_PATH" status --short

if ! git -C "$VAULT_PATH" diff --cached --quiet; then
  echo "The Obsidian vault already has staged changes. Commit or unstage them before running this skill." >&2
  git -C "$VAULT_PATH" diff --cached --name-only >&2
  exit 1
fi
```

### Discover source notes

Collect candidate evidence from the **entire Engineering tree** at `$OBSIDIAN_AI_VAULT/engineering` (default `$HOME/Documents/obsidian/obsidian/engineering`). This is mandatory. Do not limit discovery to repositories already mentioned by the user, the current brag document, recently edited notes, or the first matching workplan.

Search the whole Engineering tree in multiple passes. Complete every pass before deciding which accomplishments belong in the brag document.

#### Pass 1 — Inventory every Engineering note

Create a complete, sorted inventory of Markdown notes and inspect the directory structure:

```bash
find "$ENGINEERING_PATH" -type f -name '*.md' -print | sort

find "$ENGINEERING_PATH" -type d \( \
  -iname 'workplan' -o \
  -iname 'workplans' -o \
  -iname 'projects' -o \
  -iname 'incidents' -o \
  -iname 'postmortems' \
\) -print | sort
```

Do not skip nested service, platform, shared-library, archived, or cross-team folders merely because their repository names are not known in advance.

#### Pass 2 — Find workplans and design artifacts

Search by both path/filename and content. Workplans often contain an `index.md` that links to the PRD, technical specification, alternatives, rollout notes, or implementation status.

```bash
find "$ENGINEERING_PATH" -type f -name '*.md' \( \
  -ipath '*/workplans/*' -o \
  -iname '*workplan*' -o \
  -iname 'prd.md' -o \
  -iname 'tech-spec.md' -o \
  -iname 'tech-spec-*.md' -o \
  -iname '*technical-spec*' -o \
  -iname '*design*' -o \
  -iname '*architecture*' -o \
  -iname '*adr*' -o \
  -iname '*rfc*' \
\) -print | sort

rg -l -i --glob '*.md' \
  '(workplan|work plan|prd|product requirements|tech[- ]spec|technical specification|design doc|architecture|adr|rfc)' \
  "$ENGINEERING_PATH" | sort -u
```

For every relevant workplan directory:

1. Read its `index.md` when present.
2. Read every linked `prd`, `tech-spec`, alternate design, implementation plan, rollout note, and status note.
3. Follow Obsidian links under `engineering/`; do not treat the index as the complete source.
4. Check whether the workplan is implemented, partially implemented, abandoned, superseded, or still only a proposal.

Inspect links before moving on:

```bash
rg -n --glob '*.md' '\[\[engineering/' "$ENGINEERING_PATH"
```

#### Pass 3 — Find PR and pull-request evidence

Search the entire Engineering tree for PR references, pull-request URLs, merge status, open work, reviews, and PR-number lists:

```bash
rg -n -i --glob '*.md' \
  '(pull request|pull requests|\bPRs?\b|merged PR|open PR|github\.com/[^ )]+/pull/[0-9]+|/pull/[0-9]+|PR[[:space:]]*#?[0-9]+)' \
  "$ENGINEERING_PATH"
```

Do not search only for the literal word `PR`. Notes may use `pull request`, GitHub URLs, `#123`, `merged`, `open`, or a table of implementation references. When a workplan names several PRs, collect all of them and associate each PR with the correct initiative and status.

#### Pass 4 — Find delivery, incident, rollout, and production evidence

Search for evidence that distinguishes activity from impact:

```bash
rg -n -i --glob '*.md' \
  '(shipped|delivered|implemented|released|deployed|production|rollout|feature flag|launch|migration|backfill|incident|postmortem|root cause|root-caused|runbook|investigation|regression)' \
  "$ENGINEERING_PATH"

rg -n -i --glob '*.md' \
  '(metric|metrics|grafana|dashboard|prometheus|latency|p95|p99|throughput|rps|rpm|error rate|failures|duplicates|storage|disk|gb|tb|cpu|memory|connections|customers|messages|cost|sla|availability|duration)' \
  "$ENGINEERING_PATH"
```

Read the surrounding note, not only the matching line. Determine whether a number is an observed production result, an estimate, a modeled capacity, or a target.

#### Pass 5 — Find authorship and ownership evidence

When the user's name, email, GitHub username, or aliases are known, search all of them across the Engineering tree:

```bash
AUTHOR_PATTERN='<name|email|github-username|known-alias>'
rg -n -i --glob '*.md' "$AUTHOR_PATTERN" "$ENGINEERING_PATH"
```

Use authorship references together with workplan ownership, PR references, incident notes, and implementation details. Do not infer sole ownership from a document appearing in a person's folder or from one PR reference alone.

#### Pass 6 — Read and traverse every candidate

Build a deduplicated candidate-file list from all passes. Read every relevant candidate using its exact absolute path:

```bash
cat "$ENGINEERING_PATH/<engineering-relative-note-path>.md"
```

For each candidate, also read directly linked Engineering notes that provide implementation, status, metrics, or PR evidence. Continue until the initiative's chain is understood:

`workplan/index → PRD → tech spec/design → PR references → rollout/incident/metrics evidence`

Do not stop after finding enough highlights for an executive summary. The collection phase must cover the whole `engineering/` tree so smaller cross-repository, shared-platform, reliability, incident-response, and organizational-leverage contributions are not silently missed.

After the full scan, filter candidates by the requested reporting period and author. Whole-tree discovery happens first; period and ownership filtering happen second.

### Read source notes

Read the existing brag document first when it exists:

```bash
if [ -f "$BRAG_DOCUMENT" ]; then
  cat "$BRAG_DOCUMENT"
fi
```

Read each relevant source note directly using its absolute path inside the fixed vault:

```bash
cat "$VAULT_PATH/<vault-relative-note-path>.md"
```

The content used to create or update the brag document must originate from notes inside `$VAULT_PATH`. External repositories, GitHub, dashboards, or other tools may be used only to verify a reference already present in the vault. They must not introduce accomplishments that are absent from the vault.

A missing `brag-document.md` means create it from scratch. It must not block source discovery.

### Write and verify

Render the complete document to a temporary file inside the vault, then atomically replace the brag document and read it back:

```bash
mkdir -p "$(dirname "$BRAG_DOCUMENT")"
TMP_BRAG="$(mktemp "$VAULT_PATH/.brag-document.XXXXXX")"

cat > "$TMP_BRAG" <<'BRAG_EOF'
# Brag Document

[complete generated document]
BRAG_EOF

mv "$TMP_BRAG" "$BRAG_DOCUMENT"
cat "$BRAG_DOCUMENT"
```

Never append a fully regenerated review. Read the existing document, merge valid entries, remove duplicates, overwrite the complete file, and verify the persisted result with `cat`.

### Update the Engineering index

The Engineering index must expose the brag document as part of the vault navigation. This path was already resolved at the top of this run:

```bash
ENGINEERING_INDEX="$VAULT_PATH/engineering/index.md"
```

Read `engineering/index.md` after writing the brag document. Check for an existing Obsidian wiki-link or Markdown link to the root `brag-document.md`, including aliases such as `[[brag-document|Brag Document]]`.

```bash
if [ -f "$ENGINEERING_INDEX" ]; then
  cat "$ENGINEERING_INDEX"
fi

rg -n -i \
  '(\[\[(?:/)?brag-document(?:\|[^]]+)?\]\]|\]\((?:\.\./)?brag-document\.md\))' \
  "$ENGINEERING_INDEX" 2>/dev/null || true
```

If the index already contains a valid reference, preserve it and do not add another one. If the file exists but lacks the reference, edit it using its current organization and list style. Prefer adding the link to an existing navigation, documents, career, or engineering-resources section. Use this canonical Obsidian link unless the index already follows another valid local-link convention:

```markdown
- [[brag-document|Brag Document]]
```

If `engineering/index.md` does not exist, create it with the minimum useful structure:

```markdown
# Engineering

## Documents

- [[brag-document|Brag Document]]
```

After editing, verify that exactly one usable reference is present:

```bash
cat "$ENGINEERING_INDEX"
rg -n -i \
  '(\[\[(?:/)?brag-document(?:\|[^]]+)?\]\]|\]\((?:\.\./)?brag-document\.md\))' \
  "$ENGINEERING_INDEX"
```

Do not rewrite or reorder unrelated index content. Only create or add the missing brag-document reference.

### Stage and commit the vault changes

Perform all Git commands against the vault root resolved from `$OBSIDIAN_AI_VAULT` (default `$HOME/Documents/obsidian/obsidian`). Stage only the files owned by this workflow. Never use `git add .`, `git add -A`, or stage unrelated vault changes.

```bash
cd "$VAULT_PATH"

git add -- brag-document.md engineering/index.md

git diff --cached --check
git diff --cached --name-only
git diff --cached --stat
git diff --cached -- brag-document.md engineering/index.md
```

The staged file list must contain only:

- `brag-document.md`;
- `engineering/index.md` when it was created or changed.

If any other path is staged, unstage it and stop rather than committing unrelated work. If neither expected file has a staged diff, do not create an empty commit; report that the vault was already up to date.

When the staged diff is correct, delegate the commit to the `ai-commit` skill (see `ai-commit/SKILL.md`) with the message `docs(engineering): update brag document`. `ai-commit` resolves the vault root from `$OBSIDIAN_AI_VAULT`, commits, and pushes.

<critical>This skill does not push. If `ai-commit` pushes automatically (its default when an `origin` remote exists), that is acceptable; the historical "do not push" rule is superseded by the suite-wide `ai-commit` delegation. The key constraint — never commit into the code repo — is enforced by `ai-commit`'s vault-vs-cwd guard.</critical>

After committing, verify:

```bash
git -C "$VAULT_PATH" status --short
git -C "$VAULT_PATH" log -1 --oneline
```

## 1. Determine scope

Use the period supplied by the user. When no period is supplied, infer the narrowest defensible period from the available evidence and state it with exact dates or months.

Do not label a period `H1` if it includes July or later. Use a date range such as `2026-02 to 2026-07` when the evidence crosses half-year boundaries.

Identify:

- the person whose impact is being documented;
- known author names and email addresses;
- repositories and teams in scope;
- whether the document is being created from scratch or updated;
- the intended audience when known.

When updating an existing brag document, preserve strong verified entries, remove duplicates, correct stale claims, and improve structure rather than blindly appending another section.

## 2. Discover work and evidence

Run the complete six-pass Engineering-vault discovery protocol above. The content source is the full `$OBSIDIAN_AI_VAULT/engineering` tree (default `$HOME/Documents/obsidian/obsidian/engineering`), not a predefined list of services or repositories.

The scan must collect and correlate:

- all workplan directories and their `index.md` files;
- PRDs, technical specifications, architecture notes, ADRs, RFCs, and alternative designs;
- merged and open PRs, pull-request URLs, PR-number lists, and implementation-status notes;
- incident reports, runbooks, postmortems, root-cause analyses, and investigation notes;
- rollout records, feature flags, release notes, migrations, and backfills;
- dashboards, production metrics, load tests, database measurements, and cost or capacity evidence;
- documentation, shared-library changes, reviews, standards, and cross-team work;
- Obsidian-linked notes needed to understand each initiative end to end.

Do not assume that the current brag document, known repository names, or recently modified files represent the full scope. Search all of Engineering first, then filter by period, authorship, relevance, and evidence quality.

Prefer direct evidence over inferred impact. Match workplans and design documents to implementation artifacts and rollout evidence whenever possible.

Do not treat these as completed accomplishments by themselves:

- an unimplemented PRD;
- an empty workplan;
- a draft design with no implementation;
- an open PR without clear implementation status;
- a target metric without production measurement.

## 3. Build an internal evidence ledger

Before writing, create an internal ledger with one row per candidate contribution:

| Field | Meaning |
| --- | --- |
| Contribution | What changed |
| Ownership | Led, designed, implemented, investigated, coordinated, or contributed |
| Problem | The user, business, reliability, cost, or operational problem |
| Result | What measurably or structurally improved |
| Status | Confirmed, shipped-unmeasured, target, in-progress, or design-only |
| Evidence | PRs, commits, docs, metrics, dashboards, incidents, or rollout flags |
| Scope | Repository, service, team, or fleet-wide reach |
| Confidence | High, medium, or low |

Exclude low-confidence items that cannot be stated honestly. Keep useful items with missing outcome evidence, but label them accurately.

## 4. Classify every claim

Use one of these statuses consistently:

### Confirmed result

Use when production data, an incident report, a completed rollout, or another direct observation proves the outcome.

Preferred language:

- `reduced`;
- `eliminated`;
- `reclaimed`;
- `cut from X to Y`;
- `production metrics showed`;
- `after rollout`.

### Shipped, outcome not yet measured

Use when implementation is merged or deployed but the business or production outcome has not been measured.

Preferred language:

- `shipped`;
- `introduced`;
- `isolated`;
- `removed the direct contention path`;
- `production validation is pending`.

### Target

Use when a PRD, design, or rollout plan defines a desired outcome that has not been verified.

Format:

`(target — evidence needed)`

Never rewrite a target as a confirmed result.

### In progress

Use for open PRs, incomplete migrations, or implementations awaiting validation. Put these in a dedicated `Work in Progress` section.

### Design or investigation only

Include only when the work materially influenced a decision, remediation, or roadmap. Explain what decision or implementation it enabled.

## 5. Express ownership precisely

Make the author's role explicit. Choose the strongest verb supported by evidence:

- **Led** — drove the work, decision, or remediation across contributors.
- **Designed and implemented** — owned both solution design and delivery.
- **Root-caused and fixed** — performed the investigation and implemented the correction.
- **Proposed and drove adoption** — originated the approach and moved it into use.
- **Coordinated** — managed rollout or cross-team execution.
- **Implemented** — delivered the technical change.
- **Contributed to** — participated but did not own the whole initiative.

Do not infer leadership solely from commit count or PR authorship. Do not claim team work as individual work.

When ownership cannot be established, use neutral language and flag the gap in the evidence appendix.

## 6. Group work into impact narratives

Organize the main document by impact, not only by repository. Combine changes from multiple repositories when they are part of the same outcome.

For example, an incident investigation, a shared-library fix, new pool metrics, worker isolation, and downstream configuration may form one reliability narrative rather than five unrelated bullets.

Use this default structure, adapting only when the evidence strongly supports another structure:

```markdown
# Brag Document — [Period]

_Impact log for [person]. Confirmed outcomes are separated from targets and work in progress._

## Executive Summary

## Product and Customer Impact

## Reliability and Scalability

## Platform and Organizational Leverage

## Technical Judgment and Leadership

## Work in Progress

## Evidence Appendix
### [repository or project]
```

Omit empty sections. A repository-based structure is acceptable only in the evidence appendix or when the work cannot form coherent cross-repository narratives.

## 7. Write the executive summary first

Write five to seven bullets containing only the strongest, most differentiated outcomes.

Each bullet should be understandable by an engineering manager who does not know the implementation details. Prioritize:

- customer or business outcomes;
- incident prevention and service reliability;
- measurable scale, latency, cost, storage, or throughput improvements;
- cross-team or fleet-wide leverage;
- high-judgment technical decisions;
- removal of recurring operational toil.

Do not list minor utilities, syntax helpers, or routine maintenance in the executive summary unless they had exceptional organizational reach.

Example:

```markdown
- Prevented recurrence of a production failure mode that caused 308k failed job insertions and approximately 22k duplicate deliveries by redesigning connection budgeting, workload isolation, and pool observability.
```

## 8. Write impact-first bullets

Use this default pattern:

```markdown
- **[Ownership verb + contribution]** → [problem or previous limitation] → [result or structural improvement] → [evidence and status]
```

A strong bullet contains:

1. explicit ownership;
2. the important change;
3. the user, business, reliability, or organizational result;
4. quantified evidence when available;
5. references to supporting artifacts;
6. an honest status label.

Keep the main clause readable. Move excessive implementation detail to the evidence appendix.

### Strong example

```markdown
- **Root-caused and remediated recurring job-engine saturation** → identified approximately 175 concurrent handlers competing for a 25-connection pool and drove worker isolation, connection-budget enforcement, and pool instrumentation → removed the known contention path behind a 17-hour processing block; production regression validation remains ongoing → incident report, PRs #189, #193, #314, and #315.
```

### Weak example

```markdown
- Added workers, metrics, configs, queues, handlers, dashboards, and several PRs.
```

The weak version lists activity but does not establish ownership, problem, result, or evidence.

## 9. Keep technical detail proportional

In the main sections, include only implementation details needed to understand why the result was difficult or important.

Move details such as these to the appendix unless they are central to the impact:

- long lists of endpoints or modes;
- class and function names;
- every supported option;
- migration mechanics;
- low-level algorithm steps;
- all related PR numbers.

Prefer one clear outcome over a dense inventory of features.

## 10. Quantify without fabricating

Use exact measurements when supported. Preserve useful scale indicators such as:

- affected customers or messages;
- throughput or concurrency;
- storage reclaimed;
- latency percentiles;
- duration of incidents;
- error and duplicate counts;
- rollout percentages;
- connection-pool ratios;
- number of services or teams affected.

Never invent a metric to strengthen a bullet.

When using an estimate:

- retain approximation markers such as `~` or `approximately`;
- state the source or assumption;
- do not convert an estimate into an exact number;
- distinguish modeled capacity from observed traffic.

## 11. Avoid unsupported guarantees

Do not write absolute claims such as:

- `can no longer fail`;
- `without data loss`;
- `eliminates all contention`;
- `guarantees zero impact`;
- `recovers all lost registrations`;
- `fleet-wide`.

Use them only when the evidence proves the full scope.

Otherwise use precise structural language:

- `removes the direct database dependency from the intake path`;
- `isolates worker and connection budgets by traffic category`;
- `designed for durable buffering and crash recovery`;
- `expected to reduce origin reads`;
- `applies to services using jobx/v2`;
- `production evidence is still needed`.

## 12. Show organizational leverage

Look beyond code volume. Capture evidence of senior-level leverage when supported:

- a shared-library change adopted across services;
- reusable platform primitives;
- incident runbooks and operational safeguards;
- documentation that enabled other engineers;
- removal of manual work for operations or product teams;
- cross-team alignment and rollout coordination;
- architectural decisions that simplified future delivery;
- mentoring, reviews, or standards that changed team practice.

Do not invent mentoring or leadership activity when no source supports it.

## 13. Separate work in progress

Do not mix open, unvalidated, or incomplete work with shipped outcomes.

For each in-progress item, state:

- current implementation status;
- what remains before completion;
- intended impact, explicitly labeled as intended or targeted;
- current evidence such as an open PR or completed design.

Example:

```markdown
- **Designed and implemented the initial device-token ingestion pipeline** — implementation complete in PR #200; load testing and staging validation remain. Intended impact: absorb bursty registration traffic while pacing database writes.
```

## 14. Add an evidence appendix

Organize the appendix by repository or initiative. Keep it useful for a technical reviewer without making the executive narrative unreadable.

For each contribution, include only relevant evidence:

- pull requests and commit references;
- supporting documents;
- production measurements;
- rollout status;
- unresolved evidence gaps.

Use a compact table when it improves scanability:

```markdown
| Contribution | Ownership | Status | Evidence | Missing validation |
| --- | --- | --- | --- | --- |
| Worker-tier isolation | Designed and implemented | Shipped-unmeasured | PRs #136, #183 | Validate transactional latency during next large campaign |
```

## 15. Surface missing evidence

Do not hide gaps. At the end of the appendix, optionally add:

```markdown
### Evidence to Collect

- Compare transactional queue latency before and after worker-tier isolation.
- Measure template creation lead time before and after the management API.
- Confirm adoption count across consuming teams.
```

Include only high-value evidence that would materially strengthen promotion or performance-review claims.

## 16. Writing style

Write in clear professional English unless the user requests another language.

Use these rules:

- lead with impact, not implementation chronology;
- prefer concrete verbs over generic words such as `helped` or `worked on`;
- keep most bullets to one or two sentences;
- avoid inflated corporate language;
- avoid repeating the same metric in several bullets;
- explain uncommon internal terms briefly;
- preserve important technical names in code formatting;
- use exact dates when relative period labels could be misleading;
- keep the tone confident but auditable.

## 17. Quality checks

Before saving the file, verify every item below.

### Truthfulness

- [ ] Every material claim has supporting evidence.
- [ ] Targets are not presented as production results.
- [ ] Estimates remain visibly approximate.
- [ ] Open work is separated from completed work.
- [ ] Team outcomes are not falsely attributed to one person.
- [ ] Absolute guarantees are removed unless proven.

### Narrative

- [ ] The executive summary communicates the top outcomes in under one minute.
- [ ] Main sections are grouped by impact rather than repository where possible.
- [ ] Related cross-repository work is presented as one coherent story.
- [ ] Ownership is explicit and defensible.
- [ ] Business, customer, reliability, or organizational value is visible.

### Readability

- [ ] Dense implementation inventories are moved to the appendix.
- [ ] The main document is understandable without opening every PR.
- [ ] Repository names and PR lists do not dominate the narrative.
- [ ] Period labels match the actual dates.
- [ ] Duplicate or low-value entries are removed.

### Evidence

- [ ] Confirmed outcomes identify measurements or observations.
- [ ] Shipped-but-unmeasured work says validation is pending.
- [ ] In-progress items state what remains.
- [ ] High-value evidence gaps are listed for future collection.

### Vault persistence

- [ ] The full `engineering/` tree was searched before filtering candidates.
- [ ] `brag-document.md` was written and read back successfully.
- [ ] `engineering/index.md` contains one valid reference to the brag document.
- [ ] Only the expected files are staged.
- [ ] The staged diff was reviewed and the commit was delegated to `ai-commit`, or no file changes existed.

## Output requirements

- Use `$OBSIDIAN_AI_VAULT` (default `$HOME/Documents/obsidian/obsidian`) as the Obsidian vault path — the same override point every `ai-*` skill uses.
- Use `$OBSIDIAN_AI_VAULT/brag-document.md` (default `$HOME/Documents/obsidian/obsidian/brag-document.md`) as the output file.
- Read the existing brag document with `cat` before updating it, unless it does not exist.
- Search the complete `$OBSIDIAN_AI_VAULT/engineering` tree in multiple passes for workplans, PRDs, tech specs, PRs, pull requests, incidents, rollouts, metrics, and linked evidence before filtering by period or author.
- Discover and read source content directly from Markdown files inside the vault using `find`, `rg`, and `cat`.
- Do not use the Obsidian CLI or repository-root output. The vault path comes from `$OBSIDIAN_AI_VAULT` (or its default), not from a per-skill override.
- Write the complete result through a temporary file inside the vault, atomically replace `brag-document.md` with `mv`, and verify it with `cat`.
- Read `$OBSIDIAN_AI_VAULT/engineering/index.md` and ensure it contains exactly one valid link to the root brag document; preserve an existing link or add `[[brag-document|Brag Document]]` without rewriting unrelated index content.
- Treat `$OBSIDIAN_AI_VAULT` as the Git repository. Require an empty staging area before editing, stage only `brag-document.md` and the changed `engineering/index.md`, review the staged diff, and delegate the commit to the `ai-commit` skill with the message `docs(engineering): update brag document`.
- Do not use `git add .`, include unrelated changes, or create an empty commit.
- Return a short summary of the most important changes made to the document and the created commit hash, or state that no commit was needed.
- Mention material evidence gaps without weakening confirmed achievements.
- Do not produce a résumé, promotion recommendation, or performance rating unless explicitly requested.
