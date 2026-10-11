# CampusAssist database

The planned database is Supabase PostgreSQL. `schema.sql` creates profiles, categories, service requests, request activity, knowledge articles, and AI feedback. It enables Row Level Security, defines starter policies, and seeds sample categories and published generic guides.

## Setup

1. Create a Supabase project.
2. Open **SQL Editor** and execute `schema.sql`.
3. Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to the backend's server environment only if you want the backend to retrieve published guides from the table.
4. Never add the service-role key to frontend environment variables or commit it to Git.

The current UI request-management flows still use `localStorage`. The schema is prepared for a later authenticated database integration; it is not yet the source of truth for student requests. Review the policies with real test accounts before production use.
