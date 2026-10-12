# Model Selection Strategy

## Rule: Right-Size the Model

When spawning agents, use the cheapest, fastest model that can handle the job.

## Available Models (Cost Order)

1. **Haiku** (`haiku`) - Cheapest, fastest — use for reads, searches, status checks
2. **Sonnet** (`sonnet`) - Mid-tier — default for code writing and reasoning
3. **Opus** (`opus`) - Most expensive — only for critical complex work

## Decision Tree

```
Is the task just reading/searching/checking?
  → YES: Use haiku
  → NO: Continue...

Does it require writing code or deep analysis?
  → NO: Use haiku
  → YES: Continue...

Is it a critical decision or previous attempts failed?
  → NO: Use sonnet (default)
  → YES: Use opus
```

## Haiku Handles ~80% of Agent Tasks

**Use haiku for:**
- All read operations (files, status, logs)
- All search operations (grep, find, list)
- All status checks (git, builds, tests)
- All data extraction (parse JSON, extract values)

**Use sonnet for:**
- Writing code
- Reviewing code
- Debugging issues
- Understanding complex logic

**Use opus for:**
- Architectural decisions
- Security analysis
- Complex debugging
- Recovery after failed attempts
