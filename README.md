# Result Viewer

Eine WebApp zum Anzeigen lokal gespeicherter PDFs mit editierbaren, extrahierten Feldern aus MariaDB.

## Architektur

```
┌───────────┐     ┌───────────┐     ┌───────────┐
│  Frontend  │────▶│  Backend   │────▶│  MariaDB   │
│  (React)   │     │  (FastAPI) │     │            │
│  nginx:80  │     │  :8000     │     │  :3306     │
└───────────┘     └───────────┘     └───────────┘
      │                 │
      │   /api/* proxy  │──▶ /data/pdfs (read-only)
      └─────────────────┘
```

- **Frontend**: React + Vite + TypeScript, ausgeliefert via nginx
- **Backend**: FastAPI (Python), SQLAlchemy + PyMySQL
- **Datenbank**: MariaDB (im Docker Compose enthalten oder extern)

## Schnellstart mit Docker Compose

### 1. Repository klonen

```bash
git clone <repo-url> && cd result-viewer
```

### 2. Umgebungsvariablen konfigurieren

```bash
cp .env.example .env
# .env bearbeiten – mindestens PDF_ROOT anpassen
```

### 3. PDF-Ordner bereitstellen

Stelle sicher, dass der Ordner existiert, auf den `PDF_ROOT` zeigt. Er wird als Read-Only-Volume ins Backend gemountet.

```bash
mkdir -p ./sample_pdfs  # oder auf den echten Ordner zeigen
```

### 4. Starten

```bash
docker compose up --build -d
```

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:8000
- **MariaDB**: localhost:3306

### 5. Stoppen

```bash
docker compose down
```

## Umgebungsvariablen

| Variable       | Default          | Beschreibung                                      |
|----------------|------------------|---------------------------------------------------|
| `DB_HOST`      | `mariadb`        | Datenbank-Host (im Compose: Service-Name)         |
| `DB_PORT`      | `3306`           | Datenbank-Port                                    |
| `DB_NAME`      | `result_viewer`  | Datenbankname                                     |
| `DB_USER`      | `root`           | Datenbank-Benutzer                                |
| `DB_PASS`      | `changeme`       | Datenbank-Passwort                                |
| `PDF_ROOT`     | `./sample_pdfs`  | Pfad zum PDF-Ordner auf dem Host                  |
| `API_KEY`      | *(leer)*         | Optionaler API-Key; wenn gesetzt, muss jeder /api-Request den Header `X-API-Key` mitschicken |
| `CORS_ORIGINS` | `http://localhost:8080,http://localhost:5173` | Erlaubte CORS-Origins (kommasepariert) |

## Datenbank-Schema

Das Schema wird automatisch beim ersten Start von MariaDB ausgeführt (`db/init.sql`):

- **`documents`**: `id`, `file_path`, `file_name`, `created_at`
- **`document_fields`**: `document_id`, `field_key`, `field_value`, `updated_at` (PK: document_id + field_key)

## API-Endpunkte

| Methode | Pfad                          | Beschreibung                        |
|---------|-------------------------------|-------------------------------------|
| GET     | `/api/documents`              | Dokumentliste (Query: `search`, `limit`, `offset`) |
| GET     | `/api/documents/{id}`         | Dokument-Details mit Feldern        |
| GET     | `/api/documents/{id}/pdf`     | PDF-Datei streamen                  |
| PUT     | `/api/documents/{id}/fields`  | Felder upserten (`{fields: {k: v}}`) |
| GET     | `/health`                     | Health-Check                        |

## Lokale Entwicklung (ohne Docker)

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Umgebungsvariablen setzen oder .env im backend/-Ordner
export DB_HOST=localhost DB_PORT=3306 DB_NAME=result_viewer DB_USER=root DB_PASS=changeme
export PDF_ROOT=/pfad/zu/pdfs

uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173 (Vite-Proxy leitet /api an localhost:8000 weiter)
```

## Troubleshooting

| Problem | Lösung |
|---------|--------|
| `Connection refused` zur DB | Prüfe, ob MariaDB läuft und `DB_HOST`/`DB_PORT` korrekt sind |
| PDF wird nicht angezeigt | Prüfe, ob `PDF_ROOT` korrekt ist und die `file_path` in der DB relativ dazu ist |
| 401 Unauthorized | `API_KEY` ist gesetzt – sende Header `X-API-Key` mit |
| CORS-Fehler | `CORS_ORIGINS` um die Frontend-URL erweitern |
| Container startet nicht | `docker compose logs <service>` prüfen |

## Projektstruktur

```
.
├── backend/                # FastAPI-Backend
│   ├── app/
│   │   ├── main.py         # App-Einstiegspunkt
│   │   ├── config.py       # Konfiguration via ENV
│   │   ├── database.py     # SQLAlchemy Engine & Session
│   │   ├── models.py       # ORM-Modelle
│   │   ├── schemas.py      # Pydantic-Schemas
│   │   ├── security.py     # API-Key Middleware
│   │   └── routers/
│   │       └── documents.py # Alle /api/documents Endpoints
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/               # React + Vite + TypeScript
│   ├── src/
│   │   ├── api.ts          # API-Client
│   │   ├── types.ts        # TypeScript-Typen
│   │   ├── App.tsx          # Router-Setup
│   │   ├── pages/
│   │   │   ├── DocumentsPage.tsx
│   │   │   └── ViewerPage.tsx
│   │   └── components/
│   │       ├── PdfViewer.tsx
│   │       └── FieldsForm.tsx
│   ├── nginx.conf
│   ├── Dockerfile
│   └── package.json
├── db/
│   └── init.sql            # DB-Schema
├── docker-compose.yml
├── .env.example
└── README.md
```
