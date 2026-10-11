# Aiven MySQL & Google Gemini Setup Guide

This guide describes how to connect CampusAssist to a production **Aiven MySQL** database and **Google Gemini 2.5 API**, transitioning from local fallback/demo mode to full cloud deployment.

---

## 1. Aiven MySQL Setup

### Step 1.1: Create an Aiven MySQL Service
1. Sign up or log in to the [Aiven Console](https://console.aiven.io/).
2. Click **Create Service**.
3. Select **MySQL** as the service type.
4. Choose your cloud provider (e.g. AWS or Google Cloud) and region closest to your users (e.g., `ap-south-1` Mumbai or `ap-southeast-1` Singapore).
5. Select the **Free** tier or your desired plan.
6. Give your service a name: `campusassist-mysql`.
7. Click **Create Service** and wait 2–3 minutes for the status to show **Running**.

### Step 1.2: Obtain Connection Credentials
From your service **Overview** page:
- **Host**: e.g., `mysql-xxxx-project.aivencloud.com`
- **Port**: e.g., `12345` (or default `3306`)
- **User**: `avnadmin`
- **Password**: *(copy the generated password)*
- **Database**: `defaultdb`
- **SSL**: `true` (Aiven requires TLS/SSL encryption for all connections)

### Step 1.3: Update Backend Configuration
Edit `backend/.env` (or configure your Render environment variables):

```env
MYSQL_HOST=mysql-xxxx-project.aivencloud.com
MYSQL_PORT=12345
MYSQL_USER=avnadmin
MYSQL_PASSWORD=your_aiven_password_here
MYSQL_DATABASE=defaultdb
MYSQL_SSL=true
```

### Step 1.4: Execute Schema Migration
Run the automated migration runner to create tables, indexes, and seed sample categories:

```bash
npm run migrate --workspace=@campusassist/api
```

This applies the MySQL 8+ schema located at [`database/schema.sql`](file:///c:/Users/abhiz/CampusAssist-Node/database/schema.sql), which sets up:
- `users` (with bcrypt hashed passwords and role constraints)
- `request_categories` (academic, campus, technical, administration)
- `service_requests` (student requests with tracking codes)
- `request_activity` (timeline history and notes)
- `knowledge_articles` (institutional guides)
- `knowledge_chunks` (text chunks and embedding vectors stored as JSON)
- `ai_feedback` (student ratings and feedback)

---

## 2. Google Gemini 2.5 API Setup

### Step 2.1: Get a Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google account.
3. Click **Get API key** in the top navigation.
4. Click **Create API key** (select or create a Google Cloud Project).
5. Copy the generated API key.

### Step 2.2: Configure Gemini in Backend
Add your key to `backend/.env` (or Render environment variables):

```env
GEMINI_API_KEY=AIzaSy...your_gemini_key
GEMINI_MODEL=gemini-2.5-flash
```

---

## 3. Verification Checklist

Restart your backend server:
```bash
npm run dev:api
```

Visit the health endpoint (`http://localhost:3000/api/health`):
```json
{
  "status": "ok",
  "service": "campusassist-api",
  "runtime": "nodejs-typescript-hono",
  "ai": "configured",
  "database": "connected",
  "dbDetails": "Connected successfully to MySQL",
  "timestamp": "2026-10-11T..."
}
```

When `ai: "configured"` and `database: "connected"`, the platform operates with 100% live Google Gemini reasoning, vector retrieval, and persistent MySQL storage.
