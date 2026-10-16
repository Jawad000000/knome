# knome — Interactive AI Portfolio Assistant

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React_18-20232A?style=flat&logo=react&logoColor=61DAFB)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Groq](https://img.shields.io/badge/Groq_API-F55036?style=flat&logo=groq&logoColor=white)](https://groq.com)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev)

> An interactive portfolio assistant that lets recruiters, hiring managers, and engineers explore my projects, technical skills, and background through conversation with real-time response streaming.

---

## Why I Built This

When applying for backend and AI engineering roles, traditional resumes often don't provide enough space to explain architecture decisions, trade-offs, and lessons learned on specific projects.

I built **knome** as a conversational portfolio assistant. Instead of skimming a static PDF, a recruiter or interviewer can ask direct questions like:
- *"Walk me through the architecture of your distributed task queue project."*
- *"Which databases and async libraries have you worked with?"*
- *"How did you handle authentication and token revocation in your URL shortener?"*

The assistant answers in first-person, grounded in my verified project data and resume JSON to minimize hallucinations and keep answers factual. It streams responses token-by-token and remembers previous questions in the session for follow-up inquiries.

---

## Screenshots

### 1. Welcome Screen & Suggested Inquiries
![knome Welcome Interface](docs/screenshots/knome.png)
*Clean, minimal landing screen with quick-start questions and an animated neural canvas.*

### 2. Live Conversation with Markdown & Code
![knome Live Chat Session](docs/screenshots/knome-chat.png)
*Streaming technical responses with bold highlights, inline code badges, and conversation session persistence.*

### 3. Responsive Mobile View
![knome Mobile Drawer](docs/screenshots/knome-mobile.png)
*Collapsible drawer navigation designed for quick mobile browsing.*

---

## What It Does

- **Interactive Portfolio Q&A**: Answers questions about my projects, technical stack, internship experience, and education based on structured profile data.
- **Real-Time Streaming with SSE**: Uses Server-Sent Events (SSE) to stream text from the LLM as it generates, reducing perceived waiting time.
- **Context-Aware Follow-Ups**: Saves conversation history to PostgreSQL so recruiters can ask natural follow-up questions (e.g., *"Which database did you use for that?"*).
- **Formatted Technical Output**: Formats AI responses using Markdown—clean bullet points, bold key terms, inline code, and dark terminal code blocks with one-click copy.
- **Grounded Responses**: A system prompt instructs the model to rely strictly on my profile JSON and admit when information isn't recorded, rather than making things up.
- **Clean, Minimal UI**: Built with a focused, distraction-free interface featuring subtle animations, keyboard shortcuts (`⌘K` / `Ctrl+K`), and a smart auto-scroll that doesn't interrupt reading.

---

## Tech Stack

| Component | Technologies Used | Why I Chose Them |
| :--- | :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite | Fast development, strong type safety, and efficient component re-renders. |
| **Styling** | Custom CSS | Complete control over layout, clean typography, responsive design, and animations without heavy CSS frameworks. |
| **Markdown** | `react-markdown`, `remark-gfm` | Safely formats technical answers and code snippets without arbitrary HTML risks. |
| **Backend API** | FastAPI, Python 3.11+ | Native async support, fast execution, automatic OpenAPI docs, and easy streaming endpoints. |
| **LLM Inference** | Groq API (`qwen/qwen3.8-27b`) | Fast inference speeds that make streaming feel instant and responsive. |
| **Database & ORM**| PostgreSQL, SQLModel, SQLAlchemy 2.0 (async) | Relational persistence for conversations and messages with Pydantic validation. |
| **Database Driver**| `asyncpg` | Asynchronous PostgreSQL driver for non-blocking database queries. |
| **Deployment** | Vercel (Frontend), Render (Backend), Supabase (Database) | Production setup with continuous deployment from GitHub. |

---

## Architecture Flow

```mermaid
flowchart TD
    subgraph Frontend ["React + TypeScript Frontend"]
        User["Recruiter / User"] --> Composer["Chat Composer"]
        Composer -->|POST /chat/stream| StreamClient["SSE Stream Reader (fetch)"]
        StreamClient -->|Incremental Chunks| MessageList["Markdown Renderer & Chat Stream"]
    end

    subgraph Backend ["FastAPI Backend"]
        Endpoint["/chat/stream Endpoint"]
        DBManager["Async Session (asyncpg)"]
        PromptBuilder["Prompt Builder (candidate.json)"]
    end

    subgraph External ["External Services"]
        GroqLLM["Groq API (Qwen 3.8 27B)"]
        Postgres[(PostgreSQL / Supabase)]
    end

    StreamClient --> Endpoint
    Endpoint --> DBManager
    DBManager -->|1. Fetch history & save user message| Postgres
    Endpoint --> PromptBuilder
    PromptBuilder -->|2. System prompt + context + question| GroqLLM
    GroqLLM -->|3. Streaming token chunks| Endpoint
    Endpoint -->|4. SSE data events| StreamClient
    Endpoint -->|5. Save full assistant message| Postgres
```

---

## Project Structure

```
knome/
├── docs/
│   └── screenshots/          # Interface screenshots used in documentation
│       ├── knome.png         # Initial landing view
│       ├── knome-chat.png    # Live chat view
│       └── knome-mobile.png  # Mobile drawer view
├── backend/
│   ├── .env.example          # Environment variable template
│   ├── candidate.json        # My verified technical background and project data
│   ├── database.py           # Async SQLAlchemy engine & session management
│   ├── main.py               # FastAPI app, endpoints (/health, /chat, /chat/stream)
│   ├── models.py             # SQLModel schemas (Conversation, Message)
│   ├── profile.py            # Pydantic schemas for candidate profile validation
│   ├── prompt.py             # System prompt construction and instructions
│   ├── pyproject.toml        # Dependencies and metadata
│   └── uv.lock               # Dependency lockfile
├── frontend/
│   ├── .env.example          # Frontend environment variable template
│   ├── index.html            # HTML entry point with Google Fonts
│   ├── package.json          # Dependencies and scripts
│   ├── vite.config.ts        # Vite build configuration
│   └── src/
│       ├── api.ts            # API functions for REST and streaming requests
│       ├── App.tsx           # Main application state and layout
│       ├── styles.css        # Custom CSS design system
│       └── components/       # Reusable React UI components
│           ├── ChatComposer.tsx
│           ├── ChatMessageItem.tsx
│           ├── EmptyState.tsx
│           ├── KnomeLogo.tsx
│           ├── MarkdownRenderer.tsx
│           ├── NeuralCanvas.tsx
│           ├── Sidebar.tsx
│           └── TopNav.tsx
└── README.md                 # Project documentation
```

---

## Running Locally

### Prerequisites
- **Node.js**: v18.18 or higher (v20 recommended)
- **Python**: v3.11 or higher
- **PostgreSQL**: A local PostgreSQL database, or a free cloud database like Supabase
- **Groq API Key**: A free key from [console.groq.com](https://console.groq.com)

---

### 1. Backend Setup

1. Open your terminal and move into the `backend` directory:
   ```bash
   cd backend
   ```

2. Install dependencies & run the server:

   **Option A — Using `uv` (Recommended, matches lockfile):**
   ```bash
   uv sync
   uv run uvicorn main:app --reload --port 8000
   ```

   **Option B — Using standard Python `venv` & `pip`:**
   ```bash
   # Create virtual environment
   python -m venv .venv

   # Activate environment
   .\.venv\Scripts\Activate.ps1    # Windows (PowerShell)
   # source .venv/bin/activate     # macOS / Linux

   # Install dependencies
   pip install fastapi uvicorn groq python-dotenv sqlmodel "sqlalchemy[asyncio]" asyncpg pydantic email-validator

   # Run server
   python -m uvicorn main:app --reload --port 8000
   ```

3. Configure your local environment file:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and fill in your values (see [Environment Variables](#environment-variables)). The backend will be accessible at `http://127.0.0.1:8000`. You can visit `http://127.0.0.1:8000/health` to confirm it is running.

---

### 2. Frontend Setup

1. Open a new terminal and move into the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create your local environment file:
   ```bash
   cp .env.example .env
   ```
   Ensure `VITE_API_BASE_URL` points to `http://127.0.0.1:8000`.

4. Start the development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## Environment Variables

### Backend (`backend/.env`)

```env
# Groq API key for LLM responses
GROQ_API_KEY=your_groq_api_key_here

# PostgreSQL database URL with asyncpg
# Local example: postgresql+asyncpg://postgres:password@localhost:5432/knome
# Supabase example: postgresql+asyncpg://postgres.project:password@aws-0-region.pooler.supabase.com:6543/postgres
DATABASE_URL=postgresql+asyncpg://username:password@host:port/database_name
```

### Frontend (`frontend/.env`)

```env
# URL where your backend is hosted (without trailing slash)
VITE_API_BASE_URL=http://127.0.0.1:8000
```

---

## API Endpoints

### `GET /health`
Quick health check to verify the server is running.
- **Response**: `{"status": "healthy"}`

### `POST /chat`
Standard request-response chat endpoint.
- **Request Body**:
  ```json
  {
    "message": "What projects have you built?",
    "session_id": "optional-session-uuid-or-null"
  }
  ```
- **Response**:
  ```json
  {
    "session_id": "700ea99d-83b4-4b57-a9a7-546059e0a295",
    "message": "What projects have you built?",
    "reply": "I have built three key engineering projects..."
  }
  ```

### `POST /chat/stream`
Streaming endpoint that sends Server-Sent Events (SSE) as tokens are generated.
- **Request Body**:
  ```json
  {
    "message": "Explain your distributed task queue project.",
    "session_id": "optional-session-uuid-or-null"
  }
  ```
- **Response**: `text/event-stream`
- **Events Sent**:
  1. `{"event": "session", "session_id": "..."}` — Sent at the start to sync the session ID.
  2. `{"event": "delta", "delta": "..."}` — Sent for each incoming token chunk.
  3. `{"event": "done", "session_id": "..."}` — Sent after the full response is generated and saved to the database.
  4. `{"event": "error", "error": "..."}` — Sent if generation fails.

---

## Engineering Decisions & Lessons Learned

Here are a few practical challenges I encountered while building knome and how I solved them:

### 1. Working with Supabase Connection Pooling (PgBouncer)
- **Problem**: When deploying on Supabase with the transaction pooler on port 6543, `asyncpg` was throwing errors about prepared statements already existing or being in an invalid state.
- **Solution**: In `backend/database.py`, I configured the SQLAlchemy engine with `statement_cache_size: 0` and generated unique statement names. This stops `asyncpg` from caching prepared statements across pooled connections, allowing queries to run cleanly behind PgBouncer.

### 2. Managing Database Sessions During Streaming
- **Problem**: In FastAPI, using `session: AsyncSession = Depends(get_session)` with a `StreamingResponse` can cause issues because the route dependency context manager can close before the generator finishes sending all chunks.
- **Solution**: Inside the streaming generator in `main.py`, I managed the database session directly with `async with async_session() as session:`. This keeps the connection open throughout the stream and guarantees the complete assistant reply is saved to PostgreSQL before the session closes.

### 3. Real Streaming vs. Fake Animation
- **Problem**: Some portfolio projects fake streaming on the frontend by taking a completed response string and splitting it with `setInterval`.
- **Solution**: I implemented true streaming through the whole pipeline: Groq's API streams chunks with `stream=True`, FastAPI forwards them via `StreamingResponse(media_type="text/event-stream")`, and the frontend reads the body using `fetch` with `ReadableStreamDefaultReader` and `TextDecoder`.

### 4. Reading Experience During Fast Generation
- **Problem**: If the chat automatically scrolls down unconditionally while tokens arrive, a recruiter trying to scroll up to read an earlier paragraph gets yanked back to the bottom.
- **Solution**: In `frontend/src/App.tsx`, I added a scroll listener that detects if the user is more than 260px from the bottom. If they have scrolled up, auto-scroll pauses and a clean `↓ LATEST` button appears so they can jump back down whenever they're ready.

---

## Deployment

### 1. Database (Supabase)
- Create a project on [Supabase](https://supabase.com).
- Copy the connection string under **Database Settings**.
- Make sure to use the `postgresql+asyncpg://` prefix so SQLAlchemy uses the async driver.

### 2. Backend (Render)
- **Build Command**: `pip install uv && uv sync --frozen` (or `pip install fastapi uvicorn groq python-dotenv sqlmodel "sqlalchemy[asyncio]" asyncpg pydantic email-validator`)
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Set environment variables: `GROQ_API_KEY` and `DATABASE_URL`.

### 3. Frontend (Vercel)
- Import the repository on [Vercel](https://vercel.com) and set the root directory to `frontend`.
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- Set environment variable: `VITE_API_BASE_URL` pointing to your deployed backend URL.

---

## Future Improvements

- [ ] **Job Description Fit Mode**: Add an option for recruiters to paste a target job description and see a transparent match breakdown based on my skills and projects.
- [ ] **Resume PDF Export**: Allow users to download a clean, concise PDF summary of the conversation topics covered.
- [ ] **Interactive Project Demos**: Add interactive links and architecture diagrams directly inside chat responses.

---

## Author & Contact

**Mohd Jawwad Ahmed**
- **Role**: Backend Software Engineer & Aspiring AI Engineer
- **GitHub**: [@Jawadoooooo](https://github.com/Jawadoooooo)
- **LinkedIn**: [linkedin.com/in/mohd-jawwad](https://linkedin.com/in/mohd-jawwad)
- **Email**: mohdjawwad73@gmail.com
- **Education**: B.Tech in Electronics and Communication Engineering (2023–2027)

---

## License

This project is open for inspection and personal evaluation. All portfolio contents and personal project descriptions belong to the author.
