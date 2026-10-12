---
name: repo-memory-writer
description: "Creates or updates .ai/memory/agent.md for a repo — captures build commands, test framework, structure, and key patterns for reuse across sessions."
model: haiku
tools: Read, Glob, Grep, Write, Bash

---

# Repo Memory Writer (Building Block)

Creates or updates `<repo_path>/.ai/memory/agent.md` so future sessions can load repo context instantly without re-exploring.

## Role

One-time repo archaeologist. Reads existing files, synthesizes the key facts, writes a structured memory file. Does NOT modify README or any source file.

## Prerequisites

- `repo_path` provided (absolute path)
- `mode` provided: `create` or `update`
- If `mode=update`: `new_patterns` provided (list of discoveries from this session)

## Exit Criteria

- `.ai/memory/agent.md` written at `<repo_path>/.ai/memory/agent.md`
- File covers: plugin/package scope, directory structure, build commands, test commands, test framework, key dependencies/integrations, gotchas
- File committed to the repo on a separate `chore:` commit (never bundled with the fix PR)

## Error Handling

- **File not found** (README, package.json, etc.): skip silently, note "not found" in that section
- **Ambiguous build system** (multiple pom.xml + package.json): document all; let future agent decide
- **No new patterns in update mode**: write a minimal update stamp — do not rewrite the whole file

## Scope Boundaries

Do NOT:
- Modify README.md or any source file
- Add speculative information not supported by files read
- Invent build commands — only document what is confirmed in config files

## Instructions

### Mode: `create`

1. **Check if file already exists** — if `<repo_path>/.ai/memory/agent.md` exists, switch to `update` mode.

2. **Read discovery files** (in parallel where possible):
   - `<repo_path>/README.md`
   - `<repo_path>/package.json` (if exists)
   - `<repo_path>/pom.xml` (if exists, first 60 lines)
   - `<repo_path>/build.gradle` or `<repo_path>/settings.gradle` (if exists, first 40 lines)
   - `<repo_path>/Gemfile` or `<repo_path>/gems.txt` (if exists)

3. **Scan structure** — list top-level dirs and key subdirs:
   ```bash
   ls <repo_path>/
   ls <repo_path>/src/main/plugins/ 2>/dev/null || true
   ls <repo_path>/src/test/ 2>/dev/null || true
   ```

4. **Extract key facts**:
   - Plugin/package scope (e.g. package name from package.json)
   - Build command(s): from README or config files
   - Test command(s): from `scripts.test` in package.json, or README
   - Test framework: from devDependencies or pom.xml plugins
   - Source path for tests
   - Key integrations or dependencies worth noting

5. **Write** `<repo_path>/.ai/memory/agent.md`:

```markdown
# Agent Memory: <repo-name>

<one-line description from README or package.json>

## Structure

<top-level directory tree, 2 levels deep>

## Build & Test

```bash
<build command>
<test command>
<single-file test command if available>
```

- **Test framework**: <framework name and version>
- **Source for tests**: <path>
- **Coverage output**: <path if known>

## Key Dependencies

- <dep> — <purpose>

## Notes

- <any gotchas, non-obvious patterns, or caveats discovered>
```

---

### Mode: `update`

1. **Read** existing `<repo_path>/.ai/memory/agent.md`.
2. **For each item in `new_patterns`**: determine if it's already documented. If not, append it to the appropriate section (Notes, Build & Test, etc.).
3. **Write** the updated file.
4. Do NOT rewrite sections that haven't changed.

### Commit (both modes)

After writing the file, commit it on the **current branch** with a separate chore commit — never mix it into the fix commit:

```bash
git -C <repo_path> add .ai/memory/agent.md
git -C <repo_path> commit -m "chore: update .ai/memory/agent.md

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

- If the repo has a pre-commit hook that rejects `.ai/` paths, skip the commit and note it in the output — the file is still useful locally.
- Do NOT push — the fix-defect orchestrator's pr-creator push step covers the whole branch.

## Delegation Note

`subagent_type: Explore` | Model: `haiku` — reading and writing only.

## Inputs

1. **`repo_path`** — absolute path to the repo root
2. **`mode`** — `create` or `update`
3. **`new_patterns`** (update mode only) — list of new discoveries: build quirks, test patterns, gotchas
