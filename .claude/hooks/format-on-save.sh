#!/usr/bin/env bash
# Hook: PostToolUse — auto-format files after Claude edits them
# Detects file type and runs the appropriate formatter.
# Configure in settings.json under hooks.PostToolUse with matcher: "Edit|Write"

set -euo pipefail

FILE_PATH="$1"

[[ ! -f "$FILE_PATH" ]] && exit 0

case "$FILE_PATH" in
  *.js|*.jsx|*.ts|*.tsx|*.json|*.css|*.scss|*.html|*.md|*.yaml|*.yml)
    command -v prettier &>/dev/null && prettier --write "$FILE_PATH" 2>/dev/null
    ;;
  *.py)
    command -v black &>/dev/null && black --quiet "$FILE_PATH" 2>/dev/null
    ;;
  *.go)
    command -v gofmt &>/dev/null && gofmt -w "$FILE_PATH" 2>/dev/null
    ;;
  *.rs)
    command -v rustfmt &>/dev/null && rustfmt "$FILE_PATH" 2>/dev/null
    ;;
  *.java)
    command -v google-java-format &>/dev/null && google-java-format --replace "$FILE_PATH" 2>/dev/null
    ;;
esac

exit 0
