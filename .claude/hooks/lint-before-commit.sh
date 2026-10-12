#!/usr/bin/env bash
# Hook: PreToolUse — run linter on staged files before Claude commits
# Configure in settings.json under hooks.PreToolUse with matcher: "Bash(git commit*)"
# Exit non-zero to block the commit.

set -euo pipefail

# Get staged files
STAGED=$(git diff --cached --name-only --diff-filter=ACM 2>/dev/null || true)
[[ -z "$STAGED" ]] && exit 0

ERRORS=0

for file in $STAGED; do
  [[ ! -f "$file" ]] && continue

  case "$file" in
    *.js|*.jsx|*.ts|*.tsx)
      if command -v eslint &>/dev/null; then
        eslint --quiet "$file" 2>/dev/null || ERRORS=$((ERRORS + 1))
      fi
      ;;
    *.py)
      if command -v ruff &>/dev/null; then
        ruff check "$file" 2>/dev/null || ERRORS=$((ERRORS + 1))
      elif command -v flake8 &>/dev/null; then
        flake8 "$file" 2>/dev/null || ERRORS=$((ERRORS + 1))
      fi
      ;;
    *.go)
      if command -v golangci-lint &>/dev/null; then
        golangci-lint run "$file" 2>/dev/null || ERRORS=$((ERRORS + 1))
      fi
      ;;
  esac
done

if [[ $ERRORS -gt 0 ]]; then
  echo "Lint errors found in $ERRORS file(s). Fix before committing."
  exit 1
fi

exit 0
