import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchDocument, updateFields, pdfUrl } from "../api";
import type { DocumentDetail } from "../types";
import PdfViewer from "../components/PdfViewer";
import FieldsForm from "../components/FieldsForm";

export default function ViewerPage() {
  const { id } = useParams<{ id: string }>();
  const docId = Number(id);

  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDocument(docId);
      setDoc(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [docId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (dirtyFields: Record<string, string | null>) => {
    setSaveStatus("saving");
    try {
      await updateFields(docId, { fields: dirtyFields });
      setSaveStatus("saved");
      // Refresh data
      const data = await fetchDocument(docId);
      setDoc(data);
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  if (loading) return <p className="loading-text">Laden…</p>;
  if (error) return <div className="error-banner">{error}</div>;
  if (!doc) return <div className="error-banner">Dokument nicht gefunden.</div>;

  return (
    <div className="viewer-page">
      <header className="viewer-header">
        <Link to="/documents" className="btn-back">
          ← Zurück
        </Link>
        <h2>{doc.file_name}</h2>
      </header>

      <div className="viewer-layout">
        <div className="viewer-pdf">
          <PdfViewer url={pdfUrl(docId)} />
        </div>

        <div className="viewer-fields">
          <FieldsForm
            fields={doc.fields}
            onSave={handleSave}
            onReload={load}
            saveStatus={saveStatus}
          />
        </div>
      </div>
    </div>
  );
}
