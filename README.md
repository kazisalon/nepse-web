## NEPSELab (MVP)

Virtual stock trading web app focused on NEPSE market data (live data + simulator).

### Architecture

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS
  - UI routes live in [`app/`](file:///c:/Users/User/Desktop/2025/nepse-web/app)
- **API:** Python serverless function (Vercel-compatible)
  - Route: `/api/nepse`
  - Implementation: [`api/nepse.py`](file:///c:/Users/User/Desktop/2025/nepse-web/api/nepse.py)
  - Python dependencies: [`requirements.txt`](file:///c:/Users/User/Desktop/2025/nepse-web/requirements.txt)
- **No traditional backend server** (no Express/FastAPI/Django/Flask). This repo is designed for serverless deployment; the Python function works out-of-the-box on Vercel and can be adapted to other platforms that support Python functions.

### Why Python exists here

NEPSE market data is fetched using the Python package `nepse-scraper`, which is well suited for interacting with NEPSE endpoints and handling quirks like SSL/TLS chain issues. The frontend calls a single serverless route (`/api/nepse`) to keep the UI simple and Vercel-friendly.

### Caching strategy (performance)

This MVP uses two layers of caching:

1. **Next.js fetch caching**
   - Server components fetch NEPSE data with:
     - `next: { revalidate: 60 }`
   - This prevents a Python function call on every page request.
2. **Function + CDN caching**
   - The Python function:
     - keeps a short-lived in-memory cache (`TTL_SECONDS = 60`)
     - sends `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`
   - On serverless platforms with edge caching, `s-maxage` allows the edge cache to absorb traffic.

### Routes

- `/` Home dashboard
- `/stocks` Stock list
- `/stocks/[symbol]` SEO-friendly stock detail page
- `/portfolio` Mock portfolio (stored locally)
- `/trade` Virtual buy/sell simulator
- `/api/nepse` Python serverless function (JSON)

## Local development

### 1) Install frontend dependencies

```bash
npm install
```

### 2) Run UI + Python function together (recommended)

```bash
npm run dev
```

Open http://localhost:3000

This runs:

- Next.js dev server at `http://localhost:3000`
- Local Python dev server at `http://127.0.0.1:8001`

During development, the Next.js dev server proxies `/api/nepse` to the local Python server via a rewrite in [`next.config.ts`](file:///c:/Users/User/Desktop/2025/nepse-web/next.config.ts).

### 3) Run UI only (no Python function)

```bash
npm run dev:ui
```

When `/api/nepse` is not available locally, the UI falls back to mock data in [`lib/mockData.ts`](file:///c:/Users/User/Desktop/2025/nepse-web/lib/mockData.ts).

## Deploy to Vercel

1. Push this repo to GitHub/GitLab/Bitbucket.
2. Import the project in the Vercel dashboard.
3. Deploy with defaults:
   - Framework: Next.js
   - The Python function is configured in [`vercel.json`](file:///c:/Users/User/Desktop/2025/nepse-web/vercel.json)
4. After deploy, confirm:
   - `https://your-domain.com/` loads the UI
   - `https://your-domain.com/api/nepse` returns JSON

## Connect a custom domain

1. In Vercel dashboard → your project → **Settings → Domains**
2. Add your domain (e.g. `example.com`)
3. Point your DNS to Vercel as instructed (A record / CNAME depending on your setup)
4. Verify routes:
   - `https://example.com/` (frontend)
   - `https://example.com/api/nepse` (Python function)

## Deploy on other platforms

This repo is optimized for Vercel’s Python Functions + Next.js, but you can deploy elsewhere if your platform supports:

- Next.js App Router hosting
- A Python function runtime (or a lightweight Python HTTP handler) mounted at `/api/nepse`
- A way to set response caching headers (`Cache-Control`)

If your platform doesn’t support Python functions directly, run `api/nepse.py` as a small Python HTTP service (like the local dev server) behind a reverse proxy and keep the same `/api/nepse` route.
