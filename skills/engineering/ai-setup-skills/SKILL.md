---
name: ai-setup-skills
description: "Configure this repo for the engineering skills: set up its issue tracker and triage label vocabulary. Run once before first use of the other engineering skills."
disable-model-invocation: true
---

# Set up engineering skills

Configure the repository instructions used by the engineering skills. This is a prompt-driven setup. Inspect the repository, recommend a tracker, show the exact generated text, wait for approval, then apply it.

Setup owns these repository outputs:

- `docs/agents/issue-tracker.md`
- `docs/agents/triage-labels.md` when this process includes triage labels
- one root-level `## Agent skills` section in `AGENTS.md` or `CLAUDE.md`

It does not own domain documentation. Leave `CONTEXT.md`, `CONTEXT-MAP.md`, ADRs, `docs/agents/domain.md`, and every instruction outside the `## Agent skills` section unchanged.

## Process

### 1. Inspect without writing

Resolve the repository root with `git rev-parse --show-toplevel`, then resolve that directory to its canonical physical path. Inspect:

- `git remote -v` and `.git/config`;
- root `AGENTS.md` and `CLAUDE.md`;
- the existing root `## Agent skills` section, if any;
- `docs/agents/issue-tracker.md` and `docs/agents/triage-labels.md`;
- `.scratch/`;
- whether the `triage` skill is installed.

Do not inspect or infer a domain-document layout. Finish this step with the canonical repository path, the current tracker if one is configured, the instruction file to update, and whether triage setup applies.

### 2. Choose the tracker

Summarize what exists and what setup would replace. Ask one section at a time, with the recommended answer first. An existing configured tracker is the rerun recommendation. Otherwise recommend GitHub for a GitHub remote and GitLab for a GitLab remote. Offer:

- **GitHub**: GitHub Issues through `gh`;
- **GitLab**: GitLab Issues through `glab`;
- **Local markdown**: files under `.scratch/<feature>/`;
- **Obsidian**: files under `$OBSIDIAN_AI_VAULT/engineering/<project>/workplans/<feature>/`;
- **Workplan**: the local tracker through `wp --json` and its Workplan skills;
- **Other**: a workflow the user describes in one paragraph.

For GitHub and GitLab, keep the template's request-surface flag off without asking about it.

Workplan always uses the five canonical label slugs: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. Do not ask for overrides.

For every other tracker, skip label setup when `triage` is not installed. When it is installed, ask exactly:

> Do you want to keep the default triage labels? (recommended: **yes**)

On yes, use the five canonical strings. On no, collect the user's existing tracker labels for those roles.

If both root instruction files exist, use `CLAUDE.md`. If only one exists, use it. If neither exists, ask which one to create.

### 3. Draft and confirm

Show the exact proposed contents of:

- the complete `## Agent skills` section;
- `docs/agents/issue-tracker.md`;
- `docs/agents/triage-labels.md` when label setup applies.

The section has this shape, with only the applicable subsections:

```markdown
## Agent skills

### Issue tracker

[one-line tracker summary]. See `docs/agents/issue-tracker.md`.

### Triage labels

[one-line label summary]. See `docs/agents/triage-labels.md`.
```

For Workplan, name `ai-workplan` in the tracker summary. Let the user edit the draft. Make no tracker or repository mutation before the user approves the exact text.

### 4. Configure the selected tracker

For Workplan, read and execute [setup-workplan.md](./setup-workplan.md). Its completion criterion is a verified canonical project and all five visible canonical label slugs. It must complete before step 5 changes any repository file.

For every other choice, preserve the existing adapter behavior. This setup does not create remote labels or mutate the selected tracker.

### 5. Write only owned instructions

Recreate `docs/agents/issue-tracker.md` from the selected adapter template. Recreate `docs/agents/triage-labels.md` when label setup applies. Use these seeds:

- [issue-tracker-github.md](./issue-tracker-github.md)
- [issue-tracker-gitlab.md](./issue-tracker-gitlab.md)
- [issue-tracker-local.md](./issue-tracker-local.md)
- [issue-tracker-obsidian.md](./issue-tracker-obsidian.md)
- [issue-tracker-workplan.md](./issue-tracker-workplan.md)
- [triage-labels.md](./triage-labels.md)

Replace template placeholders with the confirmed values. For Other, write the confirmed workflow instead of using a seed.

In the chosen root instruction file, replace the single `## Agent skills` section from that heading through the line before the next `##` heading, or through end of file. Append it when absent. Preserve every byte outside that section. If more than one root `## Agent skills` heading exists, stop and ask which duplicate the user wants repaired before writing.

Do not delete or rewrite a prior `docs/agents/domain.md`. A rerun or tracker switch recreates the owned tracker and applicable triage files, replaces the owned section once, and leaves all other content alone. The same confirmed choice and tracker state must produce the same files.

### 6. Finish

Report the configured tracker, canonical project path for Workplan, files written, and any tracker resources created. Tell the user that rerunning setup changes or repairs the owned configuration without touching unrelated instructions or domain files.
