# Rule and Agent Optimization

## Rule: Keep Rules and Agents Concise

After creating or significantly modifying rules or agents, proactively suggest trimming them for token efficiency.

## When to Suggest

- New rule or agent file created
- Existing file significantly expanded (50+ lines added)
- File exceeds targets below

## Optimization Targets

| Content Type | Target | Optimize If Exceeds |
|--------------|--------|---------------------|
| Agent-trigger rules | 40-70 lines | 70 lines |
| General instruction | 40-60 lines | 60 lines |
| System config | 50-120 lines | 120 lines |

## What to Keep vs Remove

**Keep:**
- Core principles and decision logic
- 1-2 essential examples
- Quick reference tables

**Remove:**
- Examples beyond first 2
- Verbose explanations of things that are self-evident
- Redundant sections that repeat the same point
- Extended "Benefits" or "Do NOT" lists

## For Large Content (150+ lines)

Split into a lightweight rule file (40-70 lines) linking to a full doc:
- Move detailed reference content to a separate doc file
- Keep the rule file as a concise trigger with a link

## When NOT to Suggest

- File is already at or below target
- User just optimized it
- File is temporary or experimental
