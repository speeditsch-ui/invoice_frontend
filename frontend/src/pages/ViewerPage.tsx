import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { fetchInvoice, updateInvoice, pdfUrl, filePdfUrl } from "../api";
import type { InvoiceDetail, InvoiceUpdateRequest, FileEntry } from "../types";
import PdfViewer from "../components/PdfViewer";
import InvoiceFields from "../components/InvoiceFields";
import FileList from "../components/FileList";

export default function ViewerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Current invoice from DB (if any)
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  // Currently displayed PDF URL
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string | null>(null);
  // Currently selected filename
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  // Load invoice by ID (from route param or file selection)
  const loadInvoice = useCallback(async (invoiceId: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchInvoice(invoiceId);
      setInvoice(data);
      if (data.has_pdf) {
        setCurrentPdfUrl(pdfUrl(invoiceId));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load from route param on mount / change
  useEffect(() => {
    if (id) {
      const invoiceId = Number(id);
      if (!isNaN(invoiceId)) {
        loadInvoice(invoiceId);
      }
    }
  }, [id, loadInvoice]);

  // Handle file selection from sidebar
  const handleFileSelect = useCallback((file: FileEntry) => {
    setSelectedFile(file.filename);
    setCurrentPdfUrl(filePdfUrl(file.filename));

    if (file.invoice_id) {
      // Navigate to invoice route (updates URL + loads invoice data)
      navigate(`/invoices/${file.invoice_id}`, { replace: true });
    } else {
      // No linked invoice — just show the PDF, clear invoice data
      navigate("/invoices", { replace: true });
      setInvoice(null);
      setError(null);
    }
  }, [navigate]);

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

  const title = invoice
    ? invoice.supplier_name
      ? `${invoice.supplier_name} – ${invoice.invoice_number || "Ohne Nr."}`
      : `Rechnung #${invoice.id}`
    : selectedFile
      ? selectedFile
      : "Datei auswählen";

  return (
    <div className="viewer-page">
      <header className="viewer-header">
        <Link to="/invoices" className="btn-back">
          ← Liste
        </Link>
        <h2>{title}</h2>
      </header>

      <div className="viewer-layout-3col">
        {/* Left: File list sidebar */}
        <div className="viewer-filelist">
          <FileList selectedFile={selectedFile} onSelect={handleFileSelect} />
        </div>

        {/* Center: PDF viewer */}
        <div className="viewer-pdf">
          {loading ? (
            <p className="loading-text">Laden…</p>
          ) : error ? (
            <div className="error-banner" style={{ margin: "1rem" }}>{error}</div>
          ) : currentPdfUrl ? (
            <PdfViewer url={currentPdfUrl} />
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
