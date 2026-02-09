import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { fetchDocuments } from "../api";
import type { DocumentListItem } from "../types";

export default function DocumentsPage() {
  const [docs, setDocs] = useState<DocumentListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const limit = 50;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDocuments(search || undefined, limit, offset);
      setDocs(data.documents);
      setTotal(data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [search, offset]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0);
    load();
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1>Dokumente</h1>
      </header>

      <form onSubmit={handleSearch} className="search-bar">
        <input
          type="text"
          placeholder="Dateiname suchen…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit">Suchen</button>
      </form>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <p className="loading-text">Laden…</p>
      ) : (
        <>
          <table className="doc-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Dateiname</th>
                <th>Erstellt am</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {docs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="empty-row">
                    Keine Dokumente gefunden.
                  </td>
                </tr>
              ) : (
                docs.map((d) => (
                  <tr key={d.id}>
                    <td>{d.id}</td>
                    <td>{d.file_name}</td>
                    <td>{new Date(d.created_at).toLocaleString("de-DE")}</td>
                    <td>
                      <Link to={`/documents/${d.id}`} className="btn-sm">
                        Öffnen
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="pagination">
            <button
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - limit))}
            >
              ← Zurück
            </button>
            <span>
              {offset + 1}–{Math.min(offset + limit, total)} von {total}
            </span>
            <button
              disabled={offset + limit >= total}
              onClick={() => setOffset(offset + limit)}
            >
              Weiter →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
