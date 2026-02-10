import { useEffect, useState } from "react";
import { fetchFiles } from "../api";
import type { FileEntry } from "../types";

interface Props {
  selectedFile: string | null;
  onSelect: (file: FileEntry) => void;
}

/** Format bytes to a human-readable size. */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export default function FileList({ selectedFile, onSelect }: Props) {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchFiles();
        setFiles(data.files);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Fehler beim Laden");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = filter
    ? files.filter((f) =>
        f.filename.toLowerCase().includes(filter.toLowerCase()) ||
        (f.supplier_name || "").toLowerCase().includes(filter.toLowerCase()) ||
        (f.invoice_number || "").toLowerCase().includes(filter.toLowerCase())
      )
    : files;

  return (
    <div className="file-list">
      <div className="file-list-header">
        <h3>Dateien ({files.length})</h3>
      </div>

      <div className="file-list-filter">
        <input
          type="text"
          placeholder="Filtern…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <p className="loading-text">Laden…</p>
      ) : (
        <div className="file-list-items">
          {filtered.length === 0 ? (
            <p className="file-list-empty">Keine Dateien gefunden.</p>
          ) : (
            filtered.map((file) => (
              <button
                key={file.filename}
                className={`file-item ${selectedFile === file.filename ? "active" : ""}`}
                onClick={() => onSelect(file)}
                title={file.filename}
              >
                <span className="file-item-icon">📄</span>
                <div className="file-item-info">
                  <span className="file-item-name">{file.filename}</span>
                  <span className="file-item-meta">
                    {formatSize(file.size)}
                    {file.supplier_name && ` · ${file.supplier_name}`}
                    {file.invoice_number && ` · ${file.invoice_number}`}
                  </span>
                </div>
                {file.invoice_id && (
                  <span className="file-item-badge" title="Verknüpfter Datensatz">
                    DB
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
