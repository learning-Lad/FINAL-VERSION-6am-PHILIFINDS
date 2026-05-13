# PhiliFinds — Integration & Deployment Guide

This codebase is **production-ready**. There is no mock data and no fake login. To go live you only need to:

1. Create a Supabase project and run the included migration.
2. Deploy the included Edge Function and set the Groq API key as a secret.
3. Add 2 environment variables to Vercel and deploy.

OpenStreetMap requires no API key — tiles are served free via Leaflet.

---

## 0. What's already wired

| Concern | Where | Status |
|---|---|---|
| Supabase client | `src/app/lib/supabase.ts` | ✅ Reads `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` |
| Auth (login / signup / session) | `src/app/context/AuthContext.tsx` | ✅ Real `supabase.auth` |
| Trips CRUD + itinerary persistence | `src/app/context/TripContext.tsx` | ✅ Real `trips` table |
| Emergency contacts (read for users, CRUD for admin) | `src/app/context/EmergencyContext.tsx` | ✅ Real `emergency_contacts` table |
| AI itinerary (nimnim) | `supabase/functions/generate-itinerary/index.ts` | ✅ Calls Groq from server |
| Map | `src/app/pages/ScheduleView.tsx` | ✅ Leaflet + OpenStreetMap |
| DB schema + RLS + admin trigger + seed contacts | `supabase/migrations/20260513000000_init.sql` | ✅ Apply once |

---

## 1. Supabase setup

### 1.1 Create the project
1. Go to https://supabase.com → **New project**.
2. Save the **Project URL** and **anon public key** (Settings → API).

### 1.2 Apply the schema
Pick one:

**Option A — CLI**
```bash
supabase link --project-ref YOUR-PROJECT-REF
supabase db push
```

**Option B — SQL Editor**
Open `supabase/migrations/20260513000000_init.sql`, copy the entire contents, paste into Supabase → SQL Editor → Run.

This creates `profiles`, `trips`, `emergency_contacts`; enables RLS; installs the auto-profile trigger; and seeds 6 default Philippine emergency hotlines.

### 1.3 Create the admin user
1. Supabase → **Authentication → Users → Add user → Create new user**.
2. Email: `admin@philifinds.ph` — Password: `Admin123!` (or any password you choose).
3. Tick **Auto Confirm User**.

The trigger in the migration auto-detects this email and sets `is_admin = true` in `profiles`. Anyone signing up with any other email becomes a normal user.

### 1.4 (Optional) Disable email confirmation for faster signup
Authentication → Providers → Email → toggle off **Confirm email**. Otherwise new users must click a confirmation link before logging in.

---

## 2. Groq AI (nimnim itinerary generation)

### 2.1 Get a key
https://console.groq.com → API Keys → **Create API Key** → copy the `gsk_…` value.

### 2.2 Deploy the Edge Function
```bash
supabase functions deploy generate-itinerary
supabase secrets set GROQ_API_KEY=gsk_your_key_here
```

The function source lives in `supabase/functions/generate-itinerary/index.ts`. The frontend invokes it via `supabase.functions.invoke('generate-itinerary', …)` — no extra config needed.

> The Groq key is stored **only as a Supabase secret**, never in `.env` or in the browser bundle.

---

## 3. OpenStreetMap

Nothing to do. The map in `ScheduleView.tsx` uses the public OSM tile server through React-Leaflet. If you ship at scale, swap the `TileLayer` `url` prop for a hosted provider (Mapbox, MapTiler, Stadia) and add their key in `.env`.

---

## 4. Local development

```bash
cp .env.example .env
# fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
pnpm install
pnpm dev
```

---

## 5. Deploy to Vercel

1. Push this repo to GitHub.
2. Vercel → **Add New → Project** → import the repo.
3. Framework preset: **Vite**. Build command + output dir auto-detected.
4. **Environment Variables** → add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. **Deploy**.

`vercel.json` already includes the SPA rewrite so React Router deep links (e.g. `/admin/emergency-contacts`) don't 404.

---

## 6. Smoke test

1. Visit your Vercel URL → **Sign up** with a personal email → land on `/dashboard`.
2. **Plan a Trip** → choose places → **Generate Schedule** → nimnim returns a real itinerary; map renders pins.
3. Log out → log in as `admin@philifinds.ph` → land on `/admin` → add/edit/delete an emergency contact → log back in as the user → see the change immediately on the dashboard.

If step 2 fails with a 500, the `GROQ_API_KEY` secret isn't set on the deployed Edge Function. Re-run `supabase secrets set GROQ_API_KEY=…`.
