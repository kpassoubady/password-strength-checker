# Password Strength Checker

A real-time password strength checker with a Node.js/TypeScript backend and a Bootstrap 5 frontend. No database, no build step — just run the server and open the HTML file.

## Quick Start

```bash
cd server
npm install
npm start          # Server on http://localhost:3000
```

The server serves the frontend directly — open **<http://localhost:3000>** in your browser to use the app.



## Project Structure

```text
password-strength-checker/
├── client/
│   └── index.html          # Bootstrap 5 frontend
├── server/
│   ├── src/
│   │   ├── app.ts                        # Express entry point
│   │   ├── controllers/
│   │   │   └── passwordController.ts
│   │   ├── routes/
│   │   │   └── index.ts
│   │   └── services/
│   │       └── evaluator.ts              # Scoring logic
│   ├── package.json
│   └── tsconfig.json
└── docs/
    ├── media/                             # Demo GIF + screenshots
    ├── plan-passwordStrengthChecker.prompt.md
    └── tech-spec.md
```

## API

`POST /api/check-password`

```json
// Request
{ "password": "MyP@ssw0rd\!" }

// Response
{ "score": 4, "strength": "Very Strong", "color": "success", "suggestions": [] }
```

Score runs 0 (Very Weak) to 4 (Very Strong). `color` maps to Bootstrap contextual classes.

Additional endpoints: `GET /api/status`, `GET /api/health`.

## Tech Stack

- **Backend**: Node.js, TypeScript, Express, cors
- **Frontend**: Bootstrap 5 (CDN), vanilla JavaScript
- **No database** — all analysis is in-memory

## For AI Agents

See [CLAUDE.md](CLAUDE.md) for full project conventions, scoring logic, and editing guidance.
