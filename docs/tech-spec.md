# Password Strength Checker Tech Spec

## Overview

The Password Strength Checker is a web application designed to evaluate the strength of user-provided passwords in real-time. The application will provide feedback on password strength, including a score, visual indicators, and suggestions for improvement. The backend will be built using Express.js, while the frontend will utilize Bootstrap 5 for a responsive and user-friendly interface.

## Architecture

The application will follow a client-server architecture, with the frontend and backend communicating via RESTful APIs. The backend will handle password strength evaluation, while the frontend will manage user interactions and display results.

## Technical Details

### Backend (Node.js + TypeScript)

- **Framework**: Express.js
- **Language**: TypeScript
- **Endpoints**:
  - `POST /api/check-password`: Receives a password string and returns an analysis object.
- **Evaluation Logic**:
  - Length requirements (minimum 8 characters).
  - Character variety (uppercase, lowercase, numbers, special characters).
  - Entropy scoring (0-4 scale).

### Frontend (Bootstrap 5)

- **UI Components**:
  - Input field for password entry with visibility toggle.
  - Bootstrap Progress Bar for visual strength indication.
  - Alert/List components for specific improvement suggestions.
- **Communication**: Uses the Fetch API to perform real-time requests as the user types (with debouncing).

### Security

- Passwords are processed in memory and never stored in a database or log file.
- CORS configuration to restrict API access to the application frontend.

## Data Models

### Strength Analysis Response

```json
{
  "score": 3,
  "strength": "Strong",
  "suggestions": [
    "Add a special character for better security"
  ],
  "color": "success"
}
```
