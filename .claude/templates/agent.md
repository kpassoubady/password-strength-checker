---
name: my-agent
description: "One-sentence description shown in the Claude Code agent picker."
model: sonnet
tools: Read, Edit, Write, Grep, Glob, Bash
maxTurns: 25
---

# My Agent (Building Block / Orchestrator)

One-sentence summary of what this agent does and who invokes it.

## Role

Describe the agent's single responsibility in two to four sentences. Be specific about what it reads, writes, or decides. Mention which orchestrators or building blocks it is designed to work with.

## Prerequisites

- What the calling agent or user must supply before invoking this agent
- E.g. target file paths, repo path, build system context, prior output from another building block
- E.g. a clean working tree with no uncommitted conflicts
- `output_path` (optional): folder path where this agent should write its output file (e.g. `claude-agents-output/<task>/`)
- Remove items that do not apply

## Exit Criteria

- Specific, observable condition that means this agent is done
- E.g. all modified files saved, build compiles without errors
- E.g. structured summary returned (list fields)
- If `output_path` was provided: output file written to `<output_path>/<agent-name>.md`
- Remove items that do not apply

## Error Handling

- **Build fails after edit**: Analyze compiler output, fix, re-run. If the new failure is unrelated to this agent's changes, revert and report to the orchestrator.
- **Tests fail**: Distinguish pre-existing failures (report as-is, stop) from failures introduced by this agent's changes (fix and re-run).
- **External dependency unavailable**: Document the gap and return a partial result with a clear `Issues:` section.

## Scope Boundaries

Do NOT:
- Make changes beyond the task description
- Modify files not listed in the target file list
- Create branches, commit, or push
- Skip quality gates or verification steps

## Timeout Guidance

- Per-file edits: ~1 min
- Build: ~2 min (kill at 3 min with no output)
- Tests: ~3 min (kill at 30 s with no output)
- Total budget: ~10 min

## Delegation Note

`subagent_type: general-purpose` | Model: `sonnet` standard, `opus` for complex multi-file changes.

## Instructions

### 1. Load Rules

Read `.claude/rules/file-type-review-mapping.md` and the applicable rule files for the target file types. If context was provided by the orchestrator inline, use it directly.

### 2. [Main Step Name]

Describe what the agent does in this step. Be specific about tool calls, file reads, conditions, and decisions.

### 3. [Next Step Name]

Describe the next step. Number each step clearly so the agent can follow them sequentially.

### 4. Verify

Run the build and test suite. Fix any failures introduced by this agent's changes and re-run.

### 5. Report

Return a structured summary inline:

```
## [Agent Name] Summary
Changes: [files modified/created]
Build: [Pass/Fail]
Tests: [Pass/Fail, coverage delta if applicable]
Issues: [bugs, concerns, or gaps found]
```

If `output_path` was provided, also write this summary to `<output_path>/<agent-name>.md`:

```bash
mkdir -p "<output_path>"
# write summary markdown to <output_path>/<agent-name>.md
```
