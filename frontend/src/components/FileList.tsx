import { useEffect, useState } from "react";
import { fetchFiles, isImageFile } from "../api";
import type { FileEntry } from "../types";

interface Props {
  selectedFile: string | null;
  onSelect: (file: FileEntry) => void;
  /** Called once when the file list has been loaded from the API. */
  onFilesLoaded?: (files: FileEntry[]) => void;
}

/** Format bytes to a human-readable size. */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

/** Extract just the basename from a possibly nested path. */
function basename(filepath: string): string {
  const idx = filepath.lastIndexOf("/");
  return idx >= 0 ? filepath.substring(idx + 1) : filepath;
}

export default function FileList({ selectedFile, onSelect, onFilesLoaded }: Props) {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchFiles();
        setFiles(data.files);
        onFilesLoaded?.(data.files);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Fehler beim Laden");
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = filter
    ? files.filter((f) => {
        const q = filter.toLowerCase();
        return (
          f.filename.toLowerCase().includes(q) ||
          basename(f.filename).toLowerCase().includes(q) ||
          (f.supplier_name || "").toLowerCase().includes(q) ||
          (f.invoice_number || "").toLowerCase().includes(q)
        );
      })
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
                <span className="file-item-icon">{isImageFile(file.filename) ? "🖼️" : "📄"}</span>
                <div className="file-item-info">
                  <span className="file-item-name">{basename(file.filename)}</span>
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
