# CLAUDE.md — Agent Instructions

This file provides context and conventions for AI agents (Claude and others) working in this repository.

## Project Overview

A web application that evaluates password strength in real time. The backend is a Node.js/TypeScript Express API; the frontend is a plain HTML page using Bootstrap 5.

## Repository Layout

```text
password-strength-checker/
├── client/
│   └── index.html          # Bootstrap 5 frontend (no build step)
├── server/
│   ├── src/
│   │   ├── app.ts                          # Express entry point (port 3000)
│   │   ├── controllers/
│   │   │   └── passwordController.ts       # Request handlers
│   │   ├── routes/
│   │   │   └── index.ts                    # Route definitions
│   │   └── services/
│   │       └── evaluator.ts                # Core scoring logic
│   ├── package.json
│   └── tsconfig.json
├── docs/
│   ├── plan-passwordStrengthChecker.prompt.md
│   └── tech-spec.md
├── package.json            # Root convenience scripts
├── README.md
├── CLAUDE.md               # ← you are here
└── AGENTS.md
```

## Build and Run

```bash
# Install server dependencies
cd server && npm install

# Start the server (ts-node, no compile step needed)
npm start          # or: npx ts-node src/app.ts

# Open the frontend
open ../client/index.html   # or serve with Live Server (VS Code)
```

The server runs on **<http://localhost:3000>**. The frontend calls `http://localhost:3000/api/check-password`.

## API Endpoints

| Method | Path | Description |
| ------ | ---- | ----------- |
| POST | `/api/check-password` | Evaluate password strength |
| GET | `/api/status` | Liveness check |
| GET | `/api/health` | Health check with uptime |

### POST `/api/check-password`

Request body: `{ "password": "string" }`

Response:

```json
{
  "score": 4,
  "strength": "Very Strong",
  "color": "success",
  "suggestions": []
}
```

Score scale: 0 (Very Weak) → 4 (Very Strong). `color` maps to Bootstrap contextual classes (`danger`, `warning`, `info`, `success`).

## Scoring Logic (`services/evaluator.ts`)

| Score | Criteria |
| ----- | -------- |
| 0 | Length < 8 |
| 1 | Length ≥ 8 |
| 2 | Length ≥ 8 + at least one of: uppercase, digit, special char |
| 3 | Length ≥ 8 + uppercase + lowercase + digit |
| 4 | Length ≥ 12 + uppercase + lowercase + digit + special char |

## Conventions

- **TypeScript strict mode** is enabled. All types must be explicit.
- No database — all evaluation is in-memory.
- No authentication or rate limiting (local dev tool only).
- The frontend uses plain ES5-compatible JavaScript (no build toolchain).
- Do not store or log raw passwords at any point.
- CORS is open (`cors()` with no restrictions) for local development.

## Key Files to Edit

- **Add/change scoring rules** → `server/src/services/evaluator.ts`
- **Add new endpoints** → `server/src/routes/index.ts` + `server/src/controllers/passwordController.ts`
- **Change UI** → `client/index.html`

## Testing

No test suite is configured. Manual testing:

```bash
curl -s -X POST http://localhost:3000/api/check-password \
  -H "Content-Type: application/json" \
  -d '{"password":"Hello123!world"}' | python3 -m json.tool
```
