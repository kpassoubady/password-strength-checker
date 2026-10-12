# Simplified Agent Orchestration Chain

This is a simplified view of how an orchestration chain decomposes and delegates complex features, derived from the core concepts in the Agent Hub Factory Chain.

## The Basic Orchestration Loop

Instead of one massive prompt, complex tasks are broken down so that specialized agents can work concurrently or sequentially as needed.

```mermaid
flowchart TD
    Idea[Rough feature idea] --> R[1. Research Agent<br/>Maps codebase & dependencies]

    R --> Tier{Complexity?}
    Tier -->|trivial| B[2. Builders<br/>Implement features]
    Tier -->|standard| SW[3. Story/Spec Writer<br/>Creates ACs and Plan]
    SW --> B

    B --> TV[4. Test/Validation Agents<br/>Run concurrently for API, UI, Perf]
    TV -.->|FAIL| B
    TV -->|PASS| PR[5. Integration & PR]

    style Idea fill:#f5f5f5,stroke:#666,color:#000
    style R fill:#e1f5ff,stroke:#0366d6,color:#000
    style SW fill:#e1f5ff,stroke:#0366d6,color:#000
    style B fill:#d4edda,stroke:#28a745,color:#000
    style TV fill:#fff3cd,stroke:#d4a017,color:#000
    style PR fill:#e1f5ff,stroke:#0366d6,color:#000
```

## Decomposing Layers

1. **Research (Sequential):** The first agent only maps the codebase and identifies bounded contexts. It does not write code.
2. **Builders (Parallelizable):** Once the schema and boundaries are established, Frontend and Backend builders can work in parallel on their isolated domains.
3. **Validation (Parallelizable):** API testing, UI testing, and Load testing (e.g., using `k6`) can run in parallel without blocking each other, provided they report to a single handoff summary.
