# Implementation status — CampusAssist JS edition

## Project 1: Java-free stack

- Frontend UI: React + Vite; primary flows use local demo data persisted to `localStorage`.
- API: Node.js + TypeScript + Hono, with Vercel-compatible entry point and local dev server.
- AI routes: campus Q&A, request classification, and draft rewriting. Gemini is used only when a server-side key is configured; otherwise the API returns a labelled demo result.
- Knowledge retrieval: sample articles by default; optional Supabase lookup constrained to published knowledge articles.
- Database: starter Supabase PostgreSQL schema and RLS policies supplied; real request CRUD is not yet connected.
- Font readability pass: body copy, main supporting paragraphs, navigation, form labels and AI chat text increased selectively.

## Not finished

- Live database-backed request, category, profile and staff/admin flows.
- Supabase Auth integration, role provisioning and end-to-end authorization tests.
- File uploads, email notifications, production knowledge ingestion, RAG evaluation, rate limiting and abuse controls.
- Browser visual comparison and a successful npm build in an environment with dependencies installed.
- Deployment to Vercel/Supabase.

## Validation boundary

Source syntax and project structure are checked where possible. Dependency installation timed out in the build environment, so do not interpret this package as having passed `npm run build` or `npm run lint` until those commands succeed on a machine that can install npm packages.
