# CampusAssist — AI-Powered Student Support & Academic Platform

**CampusAssist** is a modern, full-stack, AI-powered campus support platform designed for university students, staff, and administrators. It combines responsive student portals, real-time ticket tracking, multilingual assistance, and AI copilots powered by Google Gemini and vector-grounded institutional knowledge.

---

## 🚀 Key Features

### 1. 🤖 Campus AI Assistant (Grounded RAG)
- Institutional knowledge retrieval powered by **3072-dimensional vector embeddings** (`gemini-embedding-001`) stored in MySQL.
- Cosine similarity matching retrieves approved university policy snippets.
- Real-time generative responses via Google Gemini (`gemini-3.1-flash-lite` / `gemini-3.5-flash`) citing official department sources.
- Safe refusal mechanism: Out-of-scope queries (0 chunks matching) safely decline speculation without hallucinations.

### 2. ⚡ Smart Request Classification
- Instant triage of student support tickets into verified categories: `academic`, `campus`, `technical`, `administration`.
- Automatic priority assessment (`Low`, `Medium`, `High`) with contextual reasoning and missing detail prompts.
- Non-authoritative suggestion banner with **"Apply suggestion"** and **"Dismiss"** controls for student review.

### 3. ✍️ AI Request Writing Assistant
- Transforms colloquial or incomplete student drafts into clear, professional, actionable support tickets.
- Side-by-side **AI Draft Comparison** interface with before/after diff cards and bulleted improvement summaries.
- Explicit **"Accept suggestion"** and **"Keep original"** controls preserve student agency.

### 4. 🛡️ Staff Copilot
- Executive ticket summarization analyzing request descriptions and chronological timeline history.
- Automatic extraction of key facts, missing information, and recommended staff operational actions.
- Context-aware, empathetic draft replies that populate directly into the staff response form via a **"Use draft reply"** button.
- Server-side role authorization (`requireRole('staff', 'admin')`).

### 5. 🌐 Telugu + English Multilingual Support
- Full Indic script support using Unicode property escapes (`[\p{L}\p{M}\p{N}]+`), preserving Telugu syllables and combining vowel markers (`\p{M}`) without text corruption.
- Interactive language selector (`English`, `తెలుగు`, `Mixed`) with bilingual and Telugu prompts.
- Script-grounded Telugu responses for campus administrative guidance.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite 8, React Router 7, Lucide React, Recharts, Vanilla CSS (Hitit-inspired design system) |
| **Backend API** | Node.js 22+, TypeScript 5.8, Hono v4.12, Zod schema validation |
| **Database** | Managed Aiven MySQL 8+ with TLS encryption, `mysql2/promise` connection pooling |
| **AI & Embeddings** | Google Gemini Developer API (`@google/genai`), multi-model failover, `gemini-embedding-001` (3072-dim) |
| **Authentication** | Server-side JWT (`jsonwebtoken`) + `bcryptjs` password hashing, role-based authorization |
| **Testing** | Vitest 5.0 automated testing suite (20/20 unit and integration tests passing) |
| **Deployment Targets** | **Render** (Node.js API web service via `render.yaml`), **Vercel** (React SPA via `vercel.json`) |

---

## 📁 Project Structure

```text
CampusAssist-Node/
├── frontend/                      # React + Vite client application
│   ├── src/
│   │   ├── components/            # Header, Footer, Portal shell, Navigation
│   │   ├── pages/                 # LandingPage, DashboardPage, RequestsPage,
│   │   │                          # RequestDetailPage, RequestFormPage, AssistantPage,
│   │   │                          # AuthPages, UtilityPages (Staff, Admin, Profile)
│   │   ├── services/              # API clients (apiClient, authService, aiService)
│   │   ├── styles.css             # Design tokens, typography, and responsive styles
│   │   └── App.jsx                # SPA routing and role management
│   ├── vite.config.js             # Vite configuration with API proxy
│   └── package.json
├── backend/                       # Node.js + TypeScript Hono API
│   ├── src/
│   │   ├── db/                    # MySQL pool, query executor, migration runner
│   │   ├── middleware/            # JWT verification & role authorization guards
│   │   ├── routes/                # Route handlers (auth, requests, categories, ai, knowledge)
│   │   ├── services/              # AI service (failover & prompts), knowledge chunking & vectors
│   │   └── server.ts              # Production server entrypoint & graceful shutdown
│   ├── test/                      # Vitest test suites (ai.test.ts, auth.test.ts, api.test.ts)
│   ├── index.ts                   # Hono app declaration & middleware pipeline
│   ├── tsconfig.json              # TypeScript compilation configuration (emits to dist/)
│   └── package.json
├── database/
│   └── schema.sql                 # Complete MySQL 8+ schema with relational constraints & indexes
├── docs/                          # Architecture guides, audit logs, and repair reports
├── render.yaml                    # Render Blueprint infrastructure-as-code configuration
├── vercel.json                    # Vercel SPA routing and build configuration
└── package.json                   # Root npm workspace commands
```

---

## ⚡ Quick Start (Local Development)

### Prerequisites
- **Node.js**: `v22.0.0` or later
- **npm**: `v10.0.0` or later
- An active **Aiven MySQL** service URI and a **Google Gemini API Key** (from [Google AI Studio](https://aistudio.google.com/))

### 1. Installation & Environment Setup
Clone the repository and install dependencies:
```powershell
npm install
```

Create environment configuration files:
```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env.local
```

Configure your `backend/.env` with your cloud credentials:
```env
PORT=3000
FRONTEND_ORIGINS=http://localhost:5173,https://campusassist.vercel.app

JWT_SECRET=your_secure_random_jwt_secret_32_characters_long
JWT_EXPIRES_IN=7d

MYSQL_HOST=your-aiven-mysql-host.aivencloud.com
MYSQL_PORT=your_5_digit_port
MYSQL_USER=avnadmin
MYSQL_PASSWORD=your_aiven_password
MYSQL_DATABASE=defaultdb
MYSQL_SSL=true

GEMINI_API_KEY=your_google_gemini_api_key
GEMINI_MODEL=gemini-3.1-flash-lite
```

### 2. Run Database Migration
Execute schema migration to create all 7 tables and seed baseline campus categories:
```powershell
npm run migrate --workspace=@campusassist/api
```

### 3. Launch Development Servers
Start the backend API server (runs on `http://localhost:3000`):
```powershell
npm run dev:api
```

In a second terminal, start the frontend client (runs on `http://localhost:5173`):
```powershell
npm run dev
```

Visit `http://localhost:5173` to explore the application.

---

## 📡 API Endpoints Reference

### System & Health
- `GET /api/health` — System health, runtime details, database connectivity, and Gemini AI status.

### Authentication & Users
- `POST /api/auth/register` — Register student or staff account (bcrypt hashing, issues JWT).
- `POST /api/auth/login` — Authenticate user and issue JWT token.
- `GET /api/auth/me` — Retrieve authenticated user profile (requires `Bearer <token>`).

### Service Requests
- `GET /api/requests` — List tickets (filtered by ownership for students; all for staff).
- `POST /api/requests` — Submit a new service request with auto-generated ticket code (`CA-XXXX`).
- `GET /api/requests/:id` — Retrieve ticket details and activity timeline (enforces ownership isolation).
- `PATCH /api/requests/:id/status` — Update ticket status (`Open`, `In progress`, `Resolved`, `Closed`) (staff only).
- `POST /api/requests/:id/activity` — Post an official comment or update note to the request timeline.

### Categories
- `GET /api/categories` — List active campus service categories.
- `POST /api/categories` — Create a new service category (staff/admin only).

### AI Services
- `POST /api/ai/chat` — Campus AI Assistant Q&A with vector-grounded snippets and language selection.
- `POST /api/ai/classify-request` — Live category and priority classification with reasoning.
- `POST /api/ai/improve-request` — Professional rewriting assistant with structured schema.
- `POST /api/ai/copilot/summarize` — Staff Copilot request history summarizer and draft reply generator (staff only).

---

## 🧪 Testing & Verification

Run the full automated Vitest test suite:
```powershell
npm test --workspace=@campusassist/api
```
All **20 / 20 tests pass** across:
- Unicode Indic syllabic tokenization & Telugu regex preservation
- Vector cosine similarity calculations
- Text chunking algorithms
- JWT token signing, verification, and tampering rejection
- Password hashing & verification
- Hono API route behavior, input validation, and role authorization guards

Verify production builds:
```powershell
npm run build
```
- Frontend builds optimized SPA distribution to `frontend/dist/`.
- Backend compiles runnable JavaScript to `backend/dist/src/server.js`.

---

## 🌐 Production Deployment

### Backend (Render Web Service)
1. Link your GitHub repository to [Render](https://dashboard.render.com).
2. Create a new **Blueprint**; Render reads `render.yaml` automatically.
3. Configure environment variables in the Render dashboard:
   - `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`, `MYSQL_SSL`
   - `GEMINI_API_KEY`
   - `JWT_SECRET` (auto-generated by Render)
4. Build command: `npm install && npm run build --workspace=@campusassist/api`
5. Start command: `node backend/dist/src/server.js`

### Frontend (Vercel SPA)
1. Import the repository into [Vercel](https://vercel.com).
2. Set root directory to `./` (Vercel uses `vercel.json`).
3. Add environment variable:
   - `VITE_API_BASE_URL` = `https://<YOUR_RENDER_BACKEND_URL>/api`
4. Deploy!
