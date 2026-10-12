Review code changes and provide actionable feedback. Adapt your review depth to the scope of changes.

## What to review

If `$ARGUMENTS` is a PR number or URL, review that PR. Otherwise, review the current uncommitted or staged changes in the working directory.

## Review process

1. Gather the diff (staged + unstaged, or PR diff)
2. Identify the intent — is this a bug fix, feature, refactor, or config change?
3. Review for:
   - **Correctness** — Logic errors, off-by-one, null/undefined handling, race conditions
   - **Security** — Injection, auth gaps, secrets in code, OWASP top 10
   - **Performance** — N+1 queries, unnecessary allocations, missing indexes
   - **Maintainability** — Naming, duplication, complexity, dead code
   - **Tests** — Are changes covered? Are edge cases tested?

## Output format

### Summary
One sentence: what the change does and whether it's ready to merge.

### Issues (if any)
List each issue with:
- **File:line** — what's wrong and why
- **Severity** — critical / warning / nit
- **Suggestion** — concrete fix, not vague advice

### What looks good
Briefly note well-done aspects (keeps review balanced).

## Guidelines
- Don't nitpick style if a formatter handles it
- Flag real problems, skip cosmetic preferences
- If the change is clean, say so — don't invent issues
- For large diffs (50+ files), focus on the riskiest files first
