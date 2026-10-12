Generate a changelog from git history between two refs.

## Arguments

`$ARGUMENTS` should be a git range (e.g., `v1.0.0..HEAD`, `main..HEAD`, or `last 10 commits`). If empty, default to changes since the last tag.

## Process

1. Determine the range from arguments or find the last tag with `git describe --tags --abbrev=0`
2. Read commit history with `git log --oneline` for the range
3. Group commits by type based on conventional commit prefixes or intent:
   - **Added** — new features
   - **Changed** — modifications to existing features
   - **Fixed** — bug fixes
   - **Removed** — deleted features or code
   - **Other** — anything that doesn't fit above
4. If commits don't use conventional prefixes, infer the category from the message

## Output format

```
# Changelog — [range]

## Added
- Description of feature (commit hash)

## Changed
- Description of change (commit hash)

## Fixed
- Description of fix (commit hash)
```

## Rules
- One line per change, written for humans (not raw commit messages)
- Skip merge commits and bot commits
- Include short commit hash for traceability
- If the range has 50+ commits, summarize by category instead of listing each
