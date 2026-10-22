# VERDANT AI

Farm dashboard (weather, soil health, profit predictions, pest alerts, action plans, marketplace with Stripe checkout).
Backend: FastAPI + MongoDB (`backend/server.py`). Frontend: React (CRA + craco, Tailwind, shadcn/ui) in `frontend/`.

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
pip install -r requirements.txt     # requirements.txt includes Emergent's extra index for `emergentintegrations`
cp .env.example .env                # optional — dev defaults work without it
python server.py                    # or: uvicorn server:app --reload --port 8001

# Frontend — http://localhost:3000 (calls the backend at http://localhost:8001 by default)
cd frontend
npm install                         # .npmrc sets legacy-peer-deps (React 19 + react-day-picker 8)
npm start
```

Without `OPENWEATHER_API_KEY` the weather card shows sample data; marketplace checkout needs `STRIPE_API_KEY`.

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
| backend | `OPENWEATHER_API_KEY` | Live weather (optional) |
| backend | `STRIPE_API_KEY` | Stripe secret key for checkout |
| backend | `PORT` | Port for `python server.py` (default 8001) |
| backend | `FRONTEND_BUILD_DIR` | Optional override of the build folder to serve |
| frontend | `REACT_APP_BACKEND_URL` | Backend base URL; empty = same origin; dev default `http://localhost:8001` |

See `backend/.env.example` and `frontend/.env.example`. Never commit real `.env` files.

Health check: `GET /health`.
