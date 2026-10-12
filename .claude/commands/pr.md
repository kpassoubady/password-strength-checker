Create a pull request for the current branch with a well-structured description.

## Arguments

`$ARGUMENTS` may contain: target branch, PR title hint, or "draft" for draft PR.

## Process

1. Run `git log` and `git diff` against the base branch to understand all changes
2. Check if the branch is pushed; push with `-u` if needed
3. Analyze ALL commits on this branch (not just the latest)
4. Create the PR using `gh pr create`

## PR format

Title: Short, imperative mood, under 70 characters (e.g., "Add retry logic to payment webhook handler")

Body:
```
## Summary
- Concise bullet points of what changed and why

## Changes
- Key technical changes grouped logically
- Note any breaking changes, migrations, or env var additions

## Test plan
- [ ] How to verify this works
- [ ] Edge cases to check
```

## Rules
- Default base branch: `main` (or `master` if no `main` exists)
- If `$ARGUMENTS` contains "draft", create as draft PR
- Never force-push or amend commits during PR creation
- If there are uncommitted changes, warn the user — don't auto-commit
