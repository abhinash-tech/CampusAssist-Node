# Deployment guide — Project 1 (without Java)

The simplest deployment uses **two Vercel projects from the same Git repository**.

## 1. Frontend project

- Import the repository into Vercel.
- Set Root Directory to `frontend`.
- Framework: Vite (auto-detected).
- Build command: `npm run build`.
- Output directory: `dist`.
- Add environment variables:
  - `VITE_AI_MODE=api`
  - `VITE_API_BASE_URL=https://YOUR-BACKEND-PROJECT.vercel.app/api`
- Redeploy after adding/changing environment variables.

## 2. Backend project

- Import the same repository as a second Vercel project.
- Set Root Directory to `backend`.
- Hono is detected from the root `index.ts` entry point.
- Set environment variables:
  - `GEMINI_API_KEY` (optional, server-only)
  - `GEMINI_MODEL=gemini-3.8-flash` (or another available model)
  - `FRONTEND_ORIGINS=https://YOUR-FRONTEND.vercel.app`
  - `SUPABASE_URL` (optional)
  - `SUPABASE_SERVICE_ROLE_KEY` (optional, server-only)
- Deploy and check `/api/health` on the backend URL.

## 3. Local development

Terminal 1 (API):

```powershell
Copy-Item backend/.env.example backend/.env
npm install
npm run dev:api
```

Terminal 2 (frontend):

```powershell
Copy-Item frontend/.env.example frontend/.env.local
npm run dev
```

Vite proxies `/api` to `http://localhost:3000` while developing locally. To use Gemini locally, put the key in `backend/.env` and set `VITE_AI_MODE=api` in `frontend/.env.local`.

## Free-tier notes

Platform quotas, idle behavior, model availability, database pause policies and pricing can change. Confirm current terms on the providers' pricing pages before relying on free hosting for a presentation. Keep request data in demo mode until real authentication, RLS, and authorization have been tested.
