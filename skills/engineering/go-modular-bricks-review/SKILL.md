---
name: go-modular-bricks-review
description: Review Go Bricks diffs for compliance with go-modular-bricks contracts, including local standards and ADR exceptions. Use for Bricks architecture reviews or the Bricks standards portion of a broader code review.
---

# Go modular bricks review

Review changes against the current `go-modular-bricks` contracts. Produce
evidenced findings and an explicit coverage result. Keep the checkout unchanged;
implement fixes only when the user requests them. This review requires no issue
or spec and adds no generic code-smell baseline.

## 1. Fix the review scope

Honor the user's comparison and file scope. Resolve Git references to commit
SHAs before reviewing. Distinguish these comparisons:

| Request | Comparison |
| --- | --- |
| Branch or PR against a target | Merge-base of target and head to head |
| Exact commit, tag, or two endpoints | The requested endpoints, without substituting a merge-base |
| Staged changes | HEAD to index |
| Uncommitted changes, or no comparison supplied | HEAD to working tree, including staged, unstaged, and non-ignored untracked files |

For a commit alone, compare its parent to that commit. For a root commit, use
the empty tree; for a merge commit without a specified parent, ask which parent
defines the review. If an explicit reference cannot be resolved, request that
reference instead of substituting another scope. In a repository without HEAD,
review index and working-tree content as additions. For a supplied patch, state
which base and surrounding source are available.

Record the resolved endpoints, comparison semantics, file filters, and local
change inclusion. Enumerate additions, modifications, renames, deletions, and
untracked files in scope. Read both sides of changed hunks and the final owning
declarations. Inspect committed source at the selected revision, even when the
checkout differs. Record local diff and untracked contents sufficiently to
detect edits during review. An empty scope yields "no changes to review".

Done when every in-scope artifact is inventoried and its before/after source
is available or recorded as a coverage gap.

## 2. Resolve the authoritative contracts

Read [go-modular-bricks](../go-modular-bricks/SKILL.md) and follow its source
precedence and contract-selection instructions. When installed separately,
resolve the installed `go-modular-bricks` skill through the available skill
catalog. Record the actual source path. If it cannot be read, report the review
as incomplete; remembered rules cannot establish compliance.

Read repository guidance, applicable `CODING_STANDARDS.md`, and the mandatory
dependency and representation contract selected by the source skill. Record
local variants and the evidence selecting each runtime profile. Load its
architecture-exception reference for a suspected departure, and inspect the
applicable accepted ADR in full. Apply an exception only within its stated
scope. An unresolved conflict between authoritative requirements is a coverage
gap that names both sources and the decision needed.

Select the source skill's flow routers by affected behavior, including reused
boundaries. Follow their applicable pointers recursively and read the selected
contracts in full, including qualifications and examples. Resolve every pointer
relative to its containing file. A filename search or final checklist alone is
insufficient. Treat implementation recipes as requirements to inspect, not
authorization to edit code, generate artifacts, or create ADRs.

Keep architecture rules in the source skill. This skill defines the review
procedure and must not become a second copy of those rules.

Done when every affected behavior has selected contracts, all applicable
pointers have been followed, and each local override has a cited authority.

## 3. Trace and account for every applicable rule

Maintain a review ledger with one entry per applicable rule and affected
boundary. Each entry records the rule's source path and section, its triggering
condition, inspected code locations, and one result:

| Result | Evidence required |
| --- | --- |
| Conforms | Inspected declarations or behavior satisfy the rule |
| Violates | Rule and code establish a change-attributable breach |
| Exception | Applicable authoritative override and code within its scope |
| Not applicable | Concrete reason the rule's condition is absent |
| Unverified | Missing evidence, inaccessible source, or unresolved conflict |

For each selected contract, account for every normative requirement in its
prose, tables, and completion checks. Reconcile repeated statements as one
rule. Preserve conditional wording. Use examples to interpret a requirement;
example names and optional dependencies do not create additional obligations.
Record why conditional references in a selected router are not applicable.

For a behavior change, trace the entry point through public operation contracts,
ports, adapters, runtime registration, and output or error translation. For an
internal component edit, inspect its owner, callers, and affected boundaries.
Follow actual symbol definitions, imports, aliases, embedded fields, helpers,
and constructor bindings rather than inferring responsibility from filenames.
Check the tests and companion artifacts required by the selected contracts,
including unchanged files that the new behavior depends on.

Use searches to locate candidates, then read enough surrounding code to prove
each conclusion. A missing declaration or registration requires inspecting all
applicable registration paths, generated sources, and build constraints. When
evidence is unavailable, use Unverified rather than claiming absence.

Compare each candidate with the base. Include breaches introduced or worsened
by the change, including a new caller that makes an unchanged boundary violate
its contract. Anchor these findings to the change that creates the breach.
Keep unchanged pre-existing debt separate from findings about this diff.

Done when every artifact has a coverage disposition, every applicable rule has
an evidence-backed ledger result, and discovered boundaries have been routed
back through step 2.

## 4. Challenge findings and verify

Before retaining a finding, establish all of the following:

- The exact source requirement applies to this boundary and project profile.
- The code contradicts it, with a concrete declaration or execution path.
- The selected change introduces or worsens the contradiction.
- Local standards, accepted ADRs, and surrounding code do not resolve it.
- The proposed correction follows the selected contract and addresses the cause.

For every candidate, seek counterevidence in the relevant caller, mapper,
adapter, composition, or test. Discard disproved candidates. Keep unresolved
candidates as Unverified coverage items, outside confirmed findings. A proven
structural or naming violation still counts even when no runtime failure is
demonstrated; describe its contract impact without inventing a failure scenario.

Follow the project's verification instructions selected by `go-modular-bricks`.
Use existing checks appropriate to the changed behavior and reviewed revision.
Record commands, results, and missing prerequisites. Separate inspected test
coverage from tests actually executed. Passing checks support only what they
exercise; they do not discharge ownership, representation, or wiring rules.
Report failures without changing the checkout to fix them. Attribute a failure
to the diff only when the output or a baseline comparison supports that claim.

Recheck the scope before reporting. If refs or local contents changed, identify
the revision actually reviewed and review affected changes again or mark them
Unverified. Consolidate findings sharing one cause and correction while keeping
all affected locations. Retain independent violations without an arbitrary cap.

Done when every retained finding passes the evidence checks and validation
results correspond to the reported scope.

## 5. Report the result

Use the user's language and any requested review format. Include:

1. Scope and verdict: violations found, no violations found in the reviewed
   scope, or no changes to review. Mark coverage complete or incomplete
   separately; confirmed findings can coexist with incomplete coverage.
2. Findings ordered by demonstrated impact. Each finding contains a concise
   title, exact code path and line, source contract path and section, the
   applicable requirement, contradictory evidence, impact, and a concrete
   correction. Use new-side lines for additions or modifications; identify
   base-side lines and the base revision for deletions.
3. A compact coverage table by affected flow or component, with contracts read,
   ledger results, applicable exceptions, and concrete gaps. Summarize the
   ledger without hiding unverified rules or unreviewed files.
4. Verification executed and its results, followed by remaining prerequisites
   or source conflicts. Label any relevant pre-existing debt separately.

Derive severity from demonstrated impact. Distinguish a runtime failure, an
architectural boundary breach, and a structural convention violation. Use the
host review's severity scale when provided. Confidence is the evidence gate,
not a substitute for severity.

Claim complete coverage only when the inventory and selected rules are fully
accounted for with no Unverified entries. A lack of findings with incomplete
coverage is not a compliance verdict. Keep inline comments and the summary
consistent, and cite only source files and code locations actually inspected.
