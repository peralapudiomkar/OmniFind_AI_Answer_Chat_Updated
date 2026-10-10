# OmniFind — multi-source search prototype

OmniFind is a runnable Flask + JavaScript search prototype that queries several public APIs: Open Library (books), Wikimedia Commons (images), DummyJSON (sample product catalog), GitHub (repositories/code discovery), Apple iTunes (music metadata/previews), OpenAlex (scholarly works), Wikipedia (general reference search), and OpenStreetMap Nominatim (place search/geocoding).

## Run locally (Windows)
1. Install Python 3.10+.
2. Extract the ZIP.
3. Open a terminal in the extracted `OmniFind_RealWorld` folder.
4. Run `py -m pip install -r requirements.txt`.
5. Run `py app.py`.
6. Open `http://127.0.0.1:5000`.

## Deploy to Render
This repository includes `render.yaml`. Set the root directory to the project root, build command to `pip install -r requirements.txt`, and start command to `python app.py`.

## Features
- Search across web references, books/documents, images, products, GitHub repositories, music, scholarly research, and places.
- Hybrid, keyword, and vector-like ranking modes.
- Browser GPS permission button for location-aware place searches. GPS works on HTTPS (Render) or localhost and only after user permission.
- Public source links and thumbnails/previews where providers return them.
- File uploads up to 12 MB, text extraction for text/code, PDF extraction with pypdf, and DOCX extraction with python-docx.
- Graph inspector and optional `hnswlib` approximate-nearest-neighbor indexing on the server.

## Important limits (please read)
This is a functional **prototype**, not a Google/Yahoo-scale search engine. It does not crawl or index the entire web, and the public APIs have their own coverage, rate limits, and availability. Product results are from DummyJSON's demonstration catalog, not live global shopping inventory. GitHub search finds repositories, not all source-code files. iTunes provides music metadata and previews when available, not arbitrary audio files. Images, papers, and reference pages are from the providers listed above.

The fallback vectorizer uses deterministic feature hashing, **not** a trained semantic embedding model. `hnswlib` is a real HNSW implementation when installed; the browser C++/WASM files are not wired into the live Flask search pipeline. Search results and uploads are currently in-memory for the process; there is no persistent production database, user accounts, or cross-restart upload storage. A real public launch would need durable storage, background crawlers/connectors, robust rate limiting, provider-specific compliance, security review, monitoring, and trained embeddings/reranking.

## API endpoints
- `GET /api/health`
- `GET /api/search?q=transformer&category=all&mode=hybrid`
- `GET /api/search?q=coffee&category=places&lat=...&lon=...`
- `GET /api/geocode?q=Guntur`
- `GET /api/graph`
- `POST /api/ingest` with multipart field `file`

## Search categories
`all`, `web` (WSM / Web Search Module), `places`, `documents`, `images`, `products`, `code`, `audio`, `science`, `education`.
