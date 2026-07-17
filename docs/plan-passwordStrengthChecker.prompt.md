# Plan: Password Strength Checker

Implementation of a web-based password strength checker with a Node.js/TypeScript backend and a Bootstrap frontend.

## Phases

### Phase 1: Project Scaffolding
- Create `./password` directory.
- Initialize Node.js project (`npm init`).
- Configure TypeScript (`tsconfig.json`).
- Install dependencies: `express`, `cors` (prod) and `@types/node`, `@types/express`, `typescript`, `ts-node` (dev).

### Phase 2: Backend Development (Node.js + TypeScript)
- Create `password/src/server.ts`.
- Implement a `POST /api/check-password` endpoint.
- Add logic to evaluate password strength:
    - Length check.
    - Complexity check (Regex: upper/lower, digits, symbols).
    - Entropy calculation or use `zxcvbn-ts`.
- Return a JSON response with a score (0-4), feedback messages, and a recommended color.

- Add status check endpoint `GET /api/status` to verify server health.
- Add health check endpoint `GET /api/health` to verify server health.

### Phase 3: Frontend Development (Bootstrap)
- Create `password/public/index.html`.
- Include Bootstrap 5 (latest) via CDN for rapid development.
- Build a UI with:
    - A password input field.
    - A dynamic strength meter (Bootstrap Progress Bar).
    - A list for real-time feedback messages.
- Add client-side JavaScript to:
    - Listen for `input` events.
    - Call the backend API using `fetch`.
    - Update the progress bar and feedback list based on the response.
- Make the UI responsive and visually appealing.
- The password input field should have a toggle to show/hide the password for better UX.
- The feedback messages should be color-coded based on the strength score (e.g., red for weak, yellow for medium, green for strong).
- The progress bar should animate smoothly when the strength score changes.
- Only the label and password field should be in the center of the page, with the feedback messages and progress bar below it.

### Phase 4: Integration & Verification
- Verify the connection between frontend and backend.
- Test with various password complexities (weak, medium, strong, very strong).

## Relevant files
- `./password/package.json` — Dependency management.
- `./password/tsconfig.json` — TS compiler settings.
- `./password/src/server.ts` — Main API logic.
- `./password/public/index.html` — User interface.

## Verification
1. Run backend: `npx ts-node src/server.ts`.
2. Open `index.html` and type passwords.
3. Observe real-time updates of the strength bar.

## Decisions
- **Framework**: Express.js for the backend due to its simplicity. (Yes)
- **Styling**: Bootstrap 5 (latest) as requested. (Yes)
- **Database**: Explicitly excluded; all analysis is performed in memory.
