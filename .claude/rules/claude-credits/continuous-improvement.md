# Continuous Improvement

## Rule: Optimize by Default

**After every task, ask: could this be faster, cheaper, or automated?**

### Priority Order
1. **Cost** — Use cheaper models (haiku over sonnet over opus)
2. **Speed** — Parallel execution, fewer steps, less context
3. **Efficiency** — Automate repetitive tasks, reuse patterns
4. **Quality** — Maintain output quality while achieving above

## After Every Task
- Could this use a cheaper model? → Switch to haiku
- Could this be automated? → Create a rule or agent
- Could this rule be shorter? → Trim verbose instructions

## After Creating Any Rule or Agent
- Verify model selection: haiku for reads, sonnet for reasoning, opus for critical
- Check instructions are concise — verbose prompts cost tokens every request
- Target: 40-70 lines for agent-trigger rules, 40-60 for instruction rules
