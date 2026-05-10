# RAGStudy

A study assistant that lets you upload your documents and chat with them. Upload a PDF, textbook, notes, whatever — it chunks and embeds everything, then uses RAG to pull relevant context when you ask questions.

Built with Next.js on the frontend and a separate Express API for the heavy lifting (embeddings, vector search, streaming chat). Uses pgvector to store and search embeddings, OpenRouter to avoid locking into a single AI provider, and Clerk for auth.

Still pretty early, but the core pipeline works.

## What it does

- Upload PDF, TXT, Markdown, or DOCX files
- Extracts text, splits it into chunks, generates embeddings via OpenRouter
- Stores everything in Postgres with pgvector
- Chat endpoint streams responses with relevant document chunks injected as context
- All routes are authenticated via Clerk JWTs

## Tech stack

**Frontend** — Next.js 16, React 19, TailwindCSS, Clerk  
**Backend** — Express 5, Drizzle ORM, postgres.js  
**DB** — PostgreSQL + pgvector extension  
**AI** — OpenRouter (`openai/text-embedding-3-small` for embeddings, `openai/gpt-4o-mini` for chat by default)

## Project structure

```
ragstudy/
├── app/                    # Next.js frontend
├── backend/
│   └── src/
│       ├── db/
│       │   └── schema/     # Drizzle table definitions
│       ├── lib/            # Shared utilities (db, openrouter client)
│       ├── middleware/     # Rate limiter
│       └── routes/
│           ├── embedding.ts  # File upload + embed pipeline
│           └── chat.ts       # Streaming chat with RAG
└── proxy.ts                # Clerk middleware for Next.js
```

## Setup

You'll need Node.js 20+, pnpm, and a Postgres database with the pgvector extension enabled.

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 1. Install dependencies

```bash
pnpm install
cd backend && pnpm install
```

### 2. Environment variables

Create `.env.local` in the root (for the frontend) and `backend/.env.local` for the API.

**Root `.env.local`**
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

**`backend/.env.local`**
```
DATABASE_URL=postgresql://user:password@localhost:5432/ragstudy
CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
OPENROUTER_API_KEY=sk-or-...
SITE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000
```

### 3. Push the database schema

```bash
cd backend
pnpm exec drizzle-kit push
```

### 4. Run

```bash
# frontend (from root)
pnpm dev

# backend (from backend/)
pnpm dev
```

Frontend runs on port 3000, backend on port 3000 (change `port` in `backend/src/index.ts` if needed).

## API

All routes require a Clerk JWT in the `Authorization: Bearer <token>` header.

### Upload and embed a file

```
POST /api/embed
Content-Type: multipart/form-data

file: <your file>
```

Accepts `.pdf`, `.txt`, `.md`, `.docx` up to 50MB. Returns the document ID and chunk count.

### Chat (streaming)

```
POST /api/chat
Content-Type: application/json

{
  "messages": [{ "role": "user", "content": "Summarize chapter 3" }],
  "model": "openai/gpt-4o-mini",   // optional, any OpenRouter model
  "documentId": "uuid-here"         // optional, enables RAG
}
```

Streams back SSE events: `data: {"delta": "..."}` and a final `data: [DONE]`.

When `documentId` is provided, the last user message gets embedded and the top 5 most similar chunks are injected into the context automatically.

### List documents

```
GET /api/documents
```

### Delete a document

```
DELETE /api/documents/:id
```

Deletes the document and all its chunks (cascade).

## Notes

- The rate limiter is set to 50 req/min per user — adjust in `index.ts` if needed
- Default chat model is `openai/gpt-4o-mini` via OpenRouter, but you can pass any model slug OpenRouter supports
- Chunks are ~1500 characters with 150-char overlap, breaking on word boundaries
