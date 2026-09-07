---
name: go-modular-bricks-standards
description: Generate or update a project's CODING_STANDARDS.md from go-modular-bricks contracts for use by a code-review subagent. Use when adopting Bricks standards or refreshing an existing project review contract.
---

# Go modular bricks standards

Produce a project-specific `CODING_STANDARDS.md` that a review subagent can
apply with only that file, the review scope, and repository access. Materialize
the current source contracts as explicit review rules. The generated document
is a versioned project contract; installed skills are generation inputs, not
runtime dependencies of its reader.

## 1. Establish the target and existing authority

Use the project the user identifies, otherwise the current repository. Locate
its root, applicable agent guidance, domain documentation, existing standards,
documented source precedence, and accepted architecture decisions. Use the
root `CODING_STANDARDS.md` unless the user or repository specifies another
canonical path. Read existing content before updating it.

Inspect `go.mod`, module ownership, entry points, composition, and representative
application and persistence flows. Inspect verification guidance, scripts, and
CI configuration for available checks. Record the project identity, actual
paths, existing runtime profiles, and supported capabilities. Existing code
demonstrates usage; it does not authorize an architectural exception.

The request authorizes writing the standards document. Preserve unrelated
project standards and user edits. Keep implementation changes, new ADRs, and
review-orchestrator changes outside this task unless requested. If the target
has no Bricks implementation yet, use the requested architecture and source
defaults, identifying proposed paths and profiles as prospective. Ask for a
target only when the project cannot be determined from the request or context.

Done when the output path, project facts, and existing authorities are recorded.

## 2. Build the source inventory

Read [go-modular-bricks](../go-modular-bricks/SKILL.md). If the sibling is absent,
resolve the installed skill through the skill catalog. Read its dependency and
representation contract and architecture-exception policy in full. Record the
actual source files and their content hashes, or an immutable revision when it
identifies their exact contents. Working-tree changes require content hashes.
Missing source material blocks a claim that the generated standards enforce it.

Read all flow routers and inventory every published reference in the source
skill. Read the normative references in full before classifying their rules.
Follow referenced contracts with a visited-file set so cycles terminate. For
each reference, record whether its rules are core, conditional on a capability,
resolved by a project profile, or outside the target project's scope. Give a
reason for each exclusion. Keep example-only content distinct from requirements.

Standards cover future changes within the project's architecture, not just the
current diff. Include core ownership and data-flow rules even for a new project.
Express optional capabilities as conditional rules when adding that capability
would fall within the adopted architecture. A project without a cache must not
be required to add one merely because cache contracts exist.

Select supported variants using the source skill's precedence rules. Preserve
explicit local standards and accepted ADRs within their scope. Record every
departure from the source baseline. An existing standards file that conflicts
with a dependency or representation invariant requires explicit resolution;
neither silently carry the conflict forward nor silently erase local authority.
Identify the conflicting clauses and the decision required. Continue drafting
unaffected sections. If the conflict remains unresolved, report it and write a
clearly labeled `CODING_STANDARDS.draft.md` beside the canonical file, preserving
the existing standards until the decision is resolved.

Done when every source reference has a disposition and each selected rule has
its source, applicability, and any authorized override recorded.

## 3. Translate contracts into review rules

Derive the rules from the source inventory rather than a copied standards
template. Keep a generation ledger mapping every normative source clause to
an output rule ID, an authorized override, or an explicit exclusion reason.
Map repeated clauses to one rule when their conditions and meaning agree.

Give each rule a stable ID, a precise triggering condition, a mandatory
requirement, observable review evidence, and any exception alongside it.
Preserve existing IDs on updates; create new IDs for new obligations and never
reuse a retired ID for a different meaning. A rule can have several source
clauses, but each obligation must remain independently checkable.

Translate normative requirements into MUST or MUST NOT. Preserve MAY and
conditional wording for optional choices. A prohibition earns its place when
it defines a forbidden dependency or representation; state the permitted path
beside it. Distinguish a requirement from an example. Example identifiers,
libraries, optional logging, or decorator signatures must not become universal
requirements through copying.

Give data flow its own early section. Derive the following from the current
source contracts, retaining all qualifications:

- Success and error paths for REST, business CLI, persistence, and infrastructure
  CLI. State which entry points execute application policy and which own process
  lifecycle. Pair diagrams with normative rules so arrows are not the only spec.
- A dependency matrix naming each source layer, allowed dependencies, forbidden
  dependencies, and the scope of any exception.
- Ownership of transport, operation, shared application, persistence, and
  provider representations. Make mapping boundaries and public versus internal
  use explicit, including nested fields, aliases, and embedding where governed.
- Repository parameter and return contracts for reads and writes, including
  values, pointers, projections, metadata, and the transaction exception.
- Cross-module access through public APIs and module composition ownership.

Then materialize every other selected contract, including naming, file layout,
validation, errors and locales, mapping, transactions, runtime wiring, test
seams, and conditional infrastructure rules. Select direct or decorated
injection from the project's documented profile or the source's fallback.
If different modules have authorized profiles, state their exact scopes.

Use project paths when verified. Label path patterns and illustrative type
names as examples. Include only verification commands found in the project,
with their applicable scope. Distinguish documented requirements, locally
available commands, and checks actually configured in CI. When a needed check
has no command, state the evidence required and the tooling gap; inventing a
`make` target does not close it.

Done when every selected normative clause maps to an enforceable output rule
without stronger wording, lost conditions, or unsupported project assertions.

## 4. Write the subagent's document

Organize `CODING_STANDARDS.md` in this order:

1. Project scope, authority, and runtime profiles. State that these are review
   requirements, how applicable ADRs modify them, and which decisions remain
   unresolved if the document is a draft.
2. Data flows, dependency matrix, and representation rules from step 3.
3. Remaining layer and capability rules grouped by applicability, keeping each
   rule's conditions, exceptions, and evidence together.
4. Review protocol and verification requirements.
5. Source provenance and a compact coverage inventory, including exclusions
   and authorized deviations from the source baseline.

The review protocol must direct the subagent to:

- Read the document in full and use the comparison supplied by the review
  orchestrator. Inspect changed code and affected unchanged boundaries.
- Account for every applicable rule as conforming, violated, excepted, or
  unverified. Mark conditional rules not applicable with a concrete reason.
- Report breaches introduced or worsened by the reviewed change. Separate
  unrelated pre-existing debt; touching a file does not authorize requiring
  an entire module rewrite.
- Support each finding with a rule ID, exact code location, contradictory
  evidence, impact, and correction. Check local exceptions and counterevidence
  before confirming it. Structural breaches count without an invented runtime
  failure; generic smell heuristics cannot override explicit architecture rules.
- Distinguish source inspection from checks actually run. Passing tests do
  not prove dependency direction, representation ownership, or registration.
- Report missing context, unreadable standards, and unresolved authority as
  coverage gaps. No findings with incomplete coverage is not a compliance pass.

Write every enforceable obligation into this file. A source citation supports
provenance; it must not stand in for the rule or its qualifications. Repository
ADRs may supply decision history, but include their operative exceptions here
with scope and repository-relative citations. The subagent must not need the
parent conversation, another skill, a home-directory path, or network access
to learn the standard it is enforcing.

Use source-relative identifiers and hashes or revisions in provenance, not
machine-specific installation paths. State that changes to the originating
skill require explicit regeneration and review of this snapshot. On update,
reconcile additions, removals, and changed rules with the existing document;
retain intentional local rules and remove stale generated requirements when
the source no longer establishes them. Report substantive changes.

Done when the file contains the full review contract, portable provenance,
coverage inventory, and no unresolved placeholders presented as requirements.

## 5. Audit and deliver

Compare the generated file back to the source ledger in both directions.
Every selected clause must be represented; every output obligation must have
a source or explicit project authority. Check diagrams and tables against
the prose, verify repository links and commands, and inspect the final diff.

Audit these distinctions against the selected profiles and exceptions:

- Internal use of an owned persistence model versus exposing it publicly.
- A repository's public signature versus pointers used inside a GORM adapter.
- Business commands versus server and migration lifecycle commands.
- Supported direct injection versus decorated-profile examples.
- An authorized exception versus a nearby pre-existing violation.
- A conditional capability rule versus an obligation to add infrastructure.

Perform an isolation check using only the generated file and target repository:
can a reviewer determine each rule's applicability, required behavior, evidence,
and exceptions without reading the originating skill? Inline missing content
and repeat the affected checks. This is a document audit, not empirical proof
of subagent accuracy. Spawn a separate evaluation agent only when authorized.

Finish when the source ledger and isolation check pass, or a concrete blocker
is reported. Deliver the output path, adopted profiles, substantive changes,
and validation performed. State any unresolved conflict or unavailable source
that leaves the document a draft.
