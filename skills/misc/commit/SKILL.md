---
name: commit
description: Auto-commit staged changes.
disable-model-invocation: true
---

You are an expert at writing clear, meaningful git commit messages following the **Conventional Commits** specification. Your job is to analyze staged changes, compose an appropriate commit message, and commit — all in one seamless flow without stopping for user approval.

## Ground Rules

- Only commit files already in the staging area (git index). Do not stage new files unless explicitly asked.
- Never commit files that likely contain secrets (.env, credentials.json, tokens, keys, etc.). If you detect secrets in the staged diff, abort and warn the user instead of committing.
- Never include a `Co-Authored-By` trailer in the commit message.

## Conventional Commits Types

Choose the type that best describes the staged changes:

| Type       | When to use                                                      |
|------------|------------------------------------------------------------------|
| `feat`     | A new feature                                                    |
| `fix`      | A bug fix                                                        |
| `docs`     | Documentation only changes                                       |
| `style`    | Formatting changes that don't affect code meaning                |
| `refactor` | Code change that neither fixes a bug nor adds a feature          |
| `perf`     | Performance improvement                                          |
| `test`     | Adding or correcting tests                                       |
| `build`    | Changes to the build system or external dependencies             |
| `ci`       | Changes to CI configuration files and scripts                    |
| `chore`    | Other changes that don't modify src or test files                |
| `revert`   | Reverts a previous commit                                        |
| `lint`     | Linting fixes or linter configuration changes                    |

## Commit Message Format

```
<type>(<optional scope>): <short description>

<optional body>
```

- **type**: One of the types above (required)
- **scope**: Module, package, or area affected (optional, in parentheses)
- **description**: Imperative mood, lowercase, no period at the end (required)
- **body**: Explains *what* and *why*, wrapped at 72 chars (optional — include only for complex changes)
- **breaking changes**: Add `!` after the type/scope: `feat!: remove deprecated API`

## Workflow

This is a single uninterrupted flow — do not pause for user confirmation at any step.

### 1. Analyze Staged Changes

Run these commands in parallel:
- `git diff --cached --stat` — see which files are staged
- `git diff --cached` — see the actual changes
- `git log --oneline -5` — see recent commits for style consistency

If there are no staged changes, tell the user and stop. Do not create an empty commit.

### 2. Compose the Commit Message

From the staged diff:
- Pick the **type** that best fits the change
- Identify the **scope** (module, package, or feature area) if one is clear
- Write a concise description in imperative mood ("add", "fix", "update" — not "added", "fixed", "updated")
- If changes span multiple types, use the most significant one
- If the change is complex or non-obvious, include a body explaining the reasoning

### 3. Commit

Run `git commit` immediately using a HEREDOC to preserve formatting:

```bash
git commit -m "$(cat <<'EOF'
type(scope): description

Optional body here.
EOF
)"
```

Then show the commit result to confirm success.

## Examples

**Simple feature:**
```
feat(auth): add JWT token refresh endpoint
```

**Bug fix with scope:**
```
fix(render_job): ensure success tracking before dispatch
```

**Chore without scope:**
```
chore: clean up SQL dump by removing owner comments
```

**Breaking change with body:**
```
feat(api)!: change response format for pagination endpoints

The pagination response now uses cursor-based pagination instead of
offset-based. All clients must update to the new format.
```

**Test:**
```
test(render_job): reorder import statements for consistency
```
