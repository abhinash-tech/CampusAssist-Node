# Project 1 architecture: JavaScript/TypeScript edition

## Stack

- React + Vite: existing CampusAssist interface
- Node.js 22+ + TypeScript + Hono: lightweight API that deploys as Vercel Functions
- Supabase PostgreSQL: planned relational database and published knowledge base
- Google Gen AI JavaScript SDK: server-side Gemini integration
- Zod: API payload validation
- Browser localStorage: currently used for demo request and admin flows

## Live vs demo capabilities

Live API endpoints are included for health status, campus Q&A, request classification, writing assistance, and public knowledge search. Gemini endpoints use Gemini only when `GEMINI_API_KEY` is present; otherwise they return explicitly labelled demo results. Published knowledge retrieval uses Supabase only when its server credentials are configured.

The existing dashboard and student/staff/admin CRUD interactions are still demo-only and persist in the current browser. The public form must not be represented as a live submission to college staff.

## Data flow

`React UI -> Hono API -> (Gemini API and optional Supabase published-knowledge query)`

Do not add a frontend Gemini key. Do not expose service-role database credentials. Complete authentication and authorization before implementing real request CRUD.
