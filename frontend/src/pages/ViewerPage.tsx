import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchInvoice, updateInvoice, pdfUrl, fileUrl, isImageFile } from "../api";
import type { InvoiceDetail, InvoiceUpdateRequest, FileEntry } from "../types";
import PdfViewer from "../components/PdfViewer";
import ImageViewer from "../components/ImageViewer";
import InvoiceFields from "../components/InvoiceFields";
import FileList from "../components/FileList";

export default function ViewerPage() {
  const { id } = useParams<{ id: string }>();

  // Current invoice from DB (if any)
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  // Currently displayed file URL (PDF or image)
  const [currentFileUrl, setCurrentFileUrl] = useState<string | null>(null);
  // Currently selected filename (used to decide PDF vs Image viewer)
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  // Full file list (for prev/next navigation)
  const [fileList, setFileList] = useState<FileEntry[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  // Load invoice data (without touching the file URL)
  const loadInvoice = useCallback(async (invoiceId: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchInvoice(invoiceId);
      setInvoice(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }, []);

  // On mount: if we arrived via /invoices/:id or /viewer/:id, load that invoice + set PDF URL
  useEffect(() => {
    if (id) {
      const invoiceId = Number(id);
      if (!isNaN(invoiceId)) {
        (async () => {
          setLoading(true);
          setError(null);
          try {
            const data = await fetchInvoice(invoiceId);
            setInvoice(data);
            if (data.has_pdf) {
              setCurrentFileUrl(pdfUrl(invoiceId));
              // Set a synthetic selectedFile so isImageFile can detect the type
              setSelectedFile(data.pdf_path || `invoice_${invoiceId}.pdf`);
            }
          } catch (e) {
            setError(e instanceof Error ? e.message : "Unbekannter Fehler");
          } finally {
            setLoading(false);
          }
        })();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle file selection from sidebar — pure state, no navigation
  const handleFileSelect = useCallback((file: FileEntry) => {
    setSelectedFile(file.filename);
    setCurrentFileUrl(fileUrl(file.filename));
    setError(null);

    if (file.invoice_id) {
      loadInvoice(file.invoice_id);
    } else {
      setInvoice(null);
    }
  }, [loadInvoice]);

  const handleSave = async (updates: InvoiceUpdateRequest) => {
    if (!invoice) return;
    setSaveStatus("saving");
    try {
      await updateInvoice(invoice.id, updates);
      setSaveStatus("saved");
      const data = await fetchInvoice(invoice.id);
      setInvoice(data);
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const handleReload = () => {
    if (invoice) {
      loadInvoice(invoice.id);
    }
  };

  // Callback when FileList has loaded
  const handleFilesLoaded = useCallback((files: FileEntry[]) => {
    setFileList(files);
  }, []);

  // Prev / Next navigation
  const currentIndex = selectedFile
    ? fileList.findIndex((f) => f.filename === selectedFile)
    : -1;

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < fileList.length - 1;

  const handlePrev = useCallback(() => {
    if (hasPrev) {
      const prev = fileList[currentIndex - 1];
      handleFileSelect(prev);
    }
  }, [hasPrev, fileList, currentIndex, handleFileSelect]);

  const handleNext = useCallback(() => {
    if (hasNext) {
      const next = fileList[currentIndex + 1];
      handleFileSelect(next);
    }
  }, [hasNext, fileList, currentIndex, handleFileSelect]);

  const title = invoice
    ? invoice.supplier_name
      ? `${invoice.supplier_name} – ${invoice.invoice_number || "Ohne Nr."}`
      : `Rechnung #${invoice.id}`
    : selectedFile
      ? selectedFile.split("/").pop() || selectedFile
      : "Datei auswählen";

  return (
    <div className="viewer-page">
      <header className="viewer-header">
        <Link to="/invoices" className="btn-back">
          ← Liste
        </Link>
        <h2>{title}</h2>

        <div className="viewer-nav-buttons">
          <button
            className="btn-nav"
            disabled={!hasPrev}
            onClick={handlePrev}
            title="Vorherige Datei"
          >
            ◀ Zurück
          </button>
          <span className="nav-position">
            {currentIndex >= 0
              ? `${currentIndex + 1} / ${fileList.length}`
              : "–"}
          </span>
          <button
            className="btn-nav"
            disabled={!hasNext}
            onClick={handleNext}
            title="Nächste Datei"
          >
            Weiter ▶
          </button>
        </div>
      </header>

      <div className="viewer-layout-3col">
        {/* Left: File list sidebar */}
        <div className="viewer-filelist">
          <FileList selectedFile={selectedFile} onSelect={handleFileSelect} onFilesLoaded={handleFilesLoaded} />
        </div>

        {/* Center: PDF / Image viewer */}
        <div className="viewer-pdf">
          {loading ? (
            <p className="loading-text">Laden…</p>
          ) : error ? (
            <div className="error-banner" style={{ margin: "1rem" }}>{error}</div>
          ) : currentFileUrl && selectedFile && isImageFile(selectedFile) ? (
            <ImageViewer url={currentFileUrl} />
          ) : currentFileUrl ? (
            <PdfViewer url={currentFileUrl} />
          ) : (
            <div className="no-pdf">
              <div className="no-pdf-message">
                <span className="no-pdf-icon">📄</span>
                <p>Datei aus der Liste wählen</p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Invoice fields (only if invoice is loaded) */}
        <div className="viewer-fields">
          {invoice ? (
            <InvoiceFields
              invoice={invoice}
              onSave={handleSave}
              onReload={handleReload}
              saveStatus={saveStatus}
            />
          ) : (
            <div className="fields-form">
              <div className="empty-fields">
                {selectedFile
                  ? "Kein Datensatz mit dieser Datei verknüpft."
                  : "Keine Rechnung ausgewählt."}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
