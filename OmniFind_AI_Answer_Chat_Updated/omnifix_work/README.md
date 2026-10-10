# OmniFind — Enhanced Search Platform

## Run locally

```bash
py -m pip install -r requirements.txt
py app.py
```

Open `http://127.0.0.1:5000/login` and sign in. The AI Answer Chat button is in the top navigation.

## Features added
- Places / GPS button is visible only after choosing **Places / GPS**.
- Place searches use live Nominatim geocoding and open Google Maps directions.
- JSON and CSV download buttons export the current search results.
- File ingest modal supports browse and drag/drop; upload requests return an indexing status.
- Search ranking now combines title match, phrase match, keyword coverage, a BM25-inspired score, and feature-hash similarity. Feature hashing is lexical similarity, not a trained semantic model.
- SQLite-backed account registration and login with salted password hashes, signed sessions, logout, forgot-password endpoint, reset tokens, and optional email verification.
- Search, graph, geocode, and ingest APIs require a signed-in session.

## Enable real email verification and password reset

Set these environment variables on your development machine or deployment platform. Do not commit credentials to GitHub:

- `SECRET_KEY`: a long random secret, persistent across restarts
- `SMTP_HOST`: your mail provider's SMTP host
- `SMTP_PORT`: usually `587`
- `SMTP_USERNAME`
- `SMTP_PASSWORD`: use a provider/app password, not your everyday account password
- `SMTP_FROM`: verified sender address
- `COOKIE_SECURE=1` when deployed behind HTTPS; leave unset/0 for localhost HTTP

Without SMTP, registration creates a local development account but cannot verify inbox ownership or deliver reset emails. Configure SMTP before production use. Account email syntax is checked, but email ownership is only verified after the verification link is sent and clicked.

## Important limitations
- This is a search prototype, not a full-web crawler or Google-scale index.
- Public APIs have rate limits and may fail intermittently.
- HNSW is only truly enabled when `hnswlib` installs successfully; the fallback graph is diagnostic.
- Uploaded files and graph vectors are currently held in server memory; persist uploads/indexes in a database/object store for production.
- The result export covers the results returned for the current search, not every record on the internet.


## AI Answer Engine Chat (real API integration)

The **AI Answer Chat** button opens a chat-style answer engine. For each user question, the Flask backend retrieves relevant results from the configured public APIs, sends compact source context to the OpenAI API, and returns an answer with source links. API keys stay on the backend and are never embedded in browser JavaScript.

1. Copy `.env.example` to `.env` in the same folder as `app.py`.
2. Open `.env` and set `OPENAI_API_KEY` to your own API key.
3. Optionally set `OPENAI_MODEL` (default: `gpt-4o-mini`) and a persistent random `SECRET_KEY`.
4. Install dependencies with `py -m pip install -r requirements.txt`, restart with `py app.py`, then sign in and click **AI Answer Chat**.

Never upload `.env` or your API key to GitHub. Check `.gitignore` before committing. OpenAI API access and usage billing/limits are separate from a ChatGPT subscription. If the key is missing, the chat shows a setup message instead of pretending an AI answer was generated. If a provider fails or has no results, the UI reports that transparently.

The chatbot uses retrieved public-API search records as context; this is not a full web crawler and source coverage depends on the selected public APIs. Verify important answers against the linked source pages.
