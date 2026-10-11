# CampusAssist API — Node.js + TypeScript + Hono

This is the Java-free API for Project 1. It is designed for Vercel's Node.js/Hono runtime and can also run locally on port 3000.

## Implemented routes

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/health` | Service, Gemini, and database configuration status |
| `POST` | `/api/ai/chat` | Campus Q&A with Gemini when configured; otherwise sample guidance |
| `POST` | `/api/ai/classify-request` | Suggest a request category, priority, and missing details |
| `POST` | `/api/ai/improve-request` | Improve the wording of a draft request |
| `GET` | `/api/knowledge/search?q=...` | Search published public guides in Supabase or the sample guide list |

## Local development

From the repository root:

```powershell
Copy-Item backend/.env.example backend/.env
npm install
npm run dev:api
```

The health URL is `http://localhost:3000/api/health`.

## Environment variables

- `GEMINI_API_KEY`: optional secret from Google AI Studio. Never put it in a `VITE_*` variable.
- `GEMINI_MODEL`: model identifier; defaults to `gemini-3.8-flash` and can be changed to a model enabled for your account.
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`: optional server-only credentials. The service reads only published rows from `knowledge_articles`; do not use the service-role key in the frontend.
- `FRONTEND_ORIGINS`: comma-separated frontend origins allowed by CORS.

If no Gemini key is present, the AI endpoints explicitly return `mode: "demo"`. They do not silently claim Gemini was called. The frontend's `VITE_AI_MODE=api` selects the API and does not silently fall back when the API is unreachable.

## Security boundary

This version does not yet expose service-request CRUD against Supabase. Request creation, categories, role switching, and status changes in the UI remain browser-local demo data. Authentication and server-side authorization must be completed before exposing private request records or staff/admin mutations.
