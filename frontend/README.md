# AI Portfolio Frontend

React + Vite + TypeScript frontend for the existing FastAPI `/chat` endpoint.

## Requirements
- Node.js 20 or newer (Node.js 18.18+ may also work with this Vite version)
- The FastAPI backend running at `http://127.0.0.1:8000`

## Run on Windows PowerShell

From this folder:

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Open `http://localhost:5173`.

## Backend connection
The frontend sends `POST /chat` with:
```json
{
  "message": "What projects has the candidate built?",
  "session_id": null
}
```

It expects a response shaped like:
```json
{
  "session_id": "conversation-uuid",
  "message": "What projects has the candidate built?",
  "reply": "..."
}
```

If your backend runs on a different address, change `VITE_API_BASE_URL` in `.env` and restart Vite.

## CORS
If the browser reports a CORS error, configure CORS in FastAPI to allow `http://localhost:5173` and `http://127.0.0.1:5173`.


## Fixing a 405 / CORS error

If the browser console shows a failed `OPTIONS` request or a CORS error, add this to `backend/main.py`:

```python
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

If `app = FastAPI()` already exists, do not add it a second time; add only the `app.add_middleware(...)` block below the existing app declaration.

Restart the backend after editing. Also verify that the frontend calls `POST http://127.0.0.1:8000/chat` (not `/` or `/docs`). A 405 can also mean the request reached a valid path using the wrong HTTP method.
