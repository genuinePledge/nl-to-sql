# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

This is a monorepo for a Natural Language to SQL conversion system called "drivee-nl-to-sql":

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend    │────▶│  PostgreSQL │
│  (Vite/React)│     │ (FastAPI)    │     │  (Analytics)│
└─────────────┘     └──────────────┘     └─────────────┘
      │                   │                      │
      ▼                   ▼                      ▼
  Port 5173           Port 8000              Port 5432
```

**Key components:**
- **Frontend**: React 19 with Vite 8, using React Compiler and Tailwind CSS
- **Backend**: FastAPI with LangChain for NL-to-SQL agent, connecting to local Ollama (Gemma 4)
- **Database**: PostgreSQL with `ride_events` table (raw data) and views `orders`/`tenders`

## Common Commands

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Rebuild after code changes
docker compose build

# Stop services
docker compose down
```

## Database Schema

The `train.csv` (1.8M rows) is imported into `ride_events` table. Two views are created:
- **`orders`**: One row per order_id with order-level metrics
- **`tenders`**: One row per tender_id with driver/bidding data

## Environment

`.env` file defines:
- `LLM_URL=http://host.docker.internal:11434/` - Ollama endpoint
- Database connection parameters
