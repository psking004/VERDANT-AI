# VERDANT AI

Farm dashboard for smallholders around Hosur / Krishnagiri (Tamil Nadu): live weather, weather-driven pest risk, action plans, and an agri-input marketplace with Stripe checkout.
Backend: FastAPI + MongoDB (`backend/`). Frontend: React (CRA + craco, Tailwind, shadcn/ui) in `frontend/`.

## What's real and what's sample data

| Feature | Status |
|---|---|
| **Weather** (`GET /api/weather`) | **Live** from [Open-Meteo](https://open-meteo.com) (free, no API key): current conditions + 7-day forecast. Default location Moranapalli, Hosur (12.73 N, 77.78 E); override with `FARM_LAT` / `FARM_LON` / `FARM_LOCATION_NAME` or `?lat=&lon=`. Cached 15 min. Returns 503 if Open-Meteo is down (no fake fallback). |
| **Weather alert** | Plain thresholds on the forecast: heavy rain (≥20 mm or ≥80% chance in the next 3 days), heat (≥38 °C), or a fully dry week. |
| **Pest & disease risk** (`GET /api/pest-alerts`) | **Rule-based, not machine learning.** For Fall Armyworm (maize), Late Blight (tomato), Rice Blast (rice) and Aphids, it counts how many of the next 7 forecast days fall inside the temperature / humidity / rain window that favours that pest (`backend/pest_risk.py`). 0–1 days = low, 2–3 = moderate, 4+ = high. It's an early warning to go scout the field, not a diagnosis, and uses no field observations. |
| **Marketplace checkout** | Real Stripe Checkout via the official `stripe` Python library. Prices are read from the database, never from the browser. Needs `STRIPE_API_KEY`; webhooks need `STRIPE_WEBHOOK_SECRET`. |
| Action plans, settings, cart | Stored in MongoDB. Action-plan timeline is a fixed template. |
| Soil health, profit predictions | **Static sample data** (hard-coded in `server.py`), not measured or predicted. |

## Run locally / Production

### Prerequisites
- Python 3.11+ (tested on 3.12)
- Node.js 18+ (tested on 22) and npm
- MongoDB running locally (`mongodb://localhost:27017`) or a MongoDB Atlas URL

### Run locally (development)

```bash
# Backend — http://localhost:8001
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                # optional — dev defaults work without it
python server.py                    # or: uvicorn server:app --reload --port 8001

# Frontend — http://localhost:3000 (calls the backend at http://localhost:8001 by default)
cd frontend
npm install                         # .npmrc sets legacy-peer-deps (React 19 + react-day-picker 8)
npm start
```

Weather and pest risk work with no keys. Marketplace checkout needs `STRIPE_API_KEY` (use a `sk_test_...` key and card `4242 4242 4242 4242` for testing).

For local webhooks: `stripe listen --forward-to localhost:8001/api/webhook/stripe` and put the printed `whsec_...` in `STRIPE_WEBHOOK_SECRET`. The payment-success page also confirms payment by reading the session from Stripe, so checkout works without webhooks.

### Tests

```bash
cd backend && pip install pytest && pytest ../tests     # offline: weather parsing, pest rules, Stripe guards
```

### Production — single service (e.g. Render / Railway)

The FastAPI app serves `frontend/build` automatically when it exists, so one Python service can host everything:

- **Build command:** `pip install -r backend/requirements.txt && cd frontend && npm ci && npm run build`
- **Start command:** `cd backend && uvicorn server:app --host 0.0.0.0 --port $PORT`
- Leave `REACT_APP_BACKEND_URL` unset/empty so the app calls `/api` on the same origin.

(The host needs both Python and Node at build time; otherwise build the frontend separately as below.)

### Production — separate frontend + backend

- **Backend** (`backend/`): `pip install -r requirements.txt`, start `uvicorn server:app --host 0.0.0.0 --port $PORT`.
  Set `CORS_ORIGINS=https://<your-frontend-domain>`.
- **Frontend** (`frontend/`): `npm ci && npm run build`, publish `build/`, add an SPA rewrite of all paths to `/index.html`.
  Set `REACT_APP_BACKEND_URL=https://<your-backend-domain>` (no trailing `/api`) at build time.

### Environment variables

| Where | Name | Notes |
|---|---|---|
| backend | `MONGO_URL` | MongoDB connection string (required in production) |
| backend | `DB_NAME` | Database name (default `verdant_ai`) |
| backend | `CORS_ORIGINS` | Comma-separated allowed origins (default `*`) |
| backend | `FARM_LAT`, `FARM_LON`, `FARM_LOCATION_NAME` | Default farm location (default Moranapalli, Hosur: 12.73, 77.78) |
| backend | `STRIPE_API_KEY` | Stripe secret key for checkout |
| backend | `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (`whsec_...`) |
| backend | `PUBLIC_APP_URL` | Optional fixed frontend URL for Stripe redirects |
| backend | `PORT` | Port for `python server.py` (default 8001) |
| backend | `FRONTEND_BUILD_DIR` | Optional override of the build folder to serve |
| frontend | `REACT_APP_BACKEND_URL` | Backend base URL; empty = same origin; dev default `http://localhost:8001` |

See `backend/.env.example` and `frontend/.env.example`. Never commit real `.env` files.

Health check: `GET /health`.

## History

Originally scaffolded with Emergent. Its platform files (`.emergent/`, agent `.gitconfig`, `test_result.md`, agent scratch folders), the private `emergentintegrations` package, the visual-edits dev plugin, and the Emergent badge/analytics script in `public/index.html` have been removed; the app now depends only on public packages.
