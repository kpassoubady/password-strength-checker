# Response & Context Efficiency

## Rule: Minimize Token Usage Per Turn

Every message re-sends the full conversation. Verbose responses and unnecessary tool calls compound costs across the entire session.

## Terse Responses

- Don't restate what the user can see in diffs, tool output, or terminal results
- Don't summarize what you just did — the user can read the changes
- Skip preamble ("Great question!", "Let me help you with that")
- One-line answers for one-line questions

## Targeted File Reads

- Use `offset`/`limit` when you know which section you need
- Don't load a full file to check one function
- Read the smallest slice that gives you the answer

## Direct Tools Over Agents

- A single Grep/Glob call is far cheaper than spawning an agent to do the same search
- Only use agents when the task genuinely needs multi-step exploration
- If you know the file path, use Read directly — don't search for it

## Avoid Redundant Tool Calls

- Don't re-read a file you just read in this conversation
- Don't search for something you already found
- Batch independent tool calls in parallel instead of sequential
- One precise search beats three speculative ones
