import { useState, useEffect } from "react";
import type { InvoiceDetail, InvoiceUpdateRequest } from "../types";

/** Editable fields definition with labels. */
const EDITABLE_FIELDS: {
  key: keyof InvoiceUpdateRequest;
  label: string;
  type: "text" | "date" | "number";
}[] = [
  { key: "supplier_name", label: "Lieferant", type: "text" },
  { key: "invoice_number", label: "Rechnungsnr.", type: "text" },
  { key: "invoice_date", label: "Rechnungsdatum", type: "date" },
  { key: "net_total", label: "Nettobetrag", type: "number" },
  { key: "currency", label: "Währung", type: "text" },
  { key: "vat_rate", label: "MwSt.-Satz (%)", type: "number" },
  { key: "vat_amount", label: "MwSt.-Betrag", type: "number" },
  { key: "source_email", label: "Quell-E-Mail", type: "text" },
];

/** Read-only info fields. */
const INFO_FIELDS: { key: keyof InvoiceDetail; label: string }[] = [
  { key: "id", label: "ID" },
  { key: "pdf_sha256", label: "SHA-256" },
  { key: "created_at", label: "Erstellt am" },
  { key: "llm_flags", label: "LLM-Flags" },
];

interface Props {
  invoice: InvoiceDetail;
  onSave: (updates: InvoiceUpdateRequest) => Promise<void>;
  onReload: () => void;
  saveStatus: "idle" | "saving" | "saved" | "error";
}

export default function InvoiceFields({
  invoice,
  onSave,
  onReload,
  saveStatus,
}: Props) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Initialize values from invoice
  useEffect(() => {
    const v: Record<string, string> = {};
    for (const field of EDITABLE_FIELDS) {
      const raw = invoice[field.key as keyof InvoiceDetail];
      v[field.key] = raw != null ? String(raw) : "";
    }
    setValues(v);
    setDirtyKeys(new Set());
  }, [invoice]);

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setDirtyKeys((prev) => {
      const next = new Set(prev);
      const original = invoice[key as keyof InvoiceDetail];
      const originalStr = original != null ? String(original) : "";
      if (value !== originalStr) {
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });
  };

  const handleSave = () => {
    const updates: Record<string, unknown> = {};
    for (const key of dirtyKeys) {
      const fieldDef = EDITABLE_FIELDS.find((f) => f.key === key);
      if (!fieldDef) continue;

      const val = values[key];
      if (fieldDef.type === "number") {
        updates[key] = val ? parseFloat(val) : null;
      } else if (fieldDef.type === "date") {
        updates[key] = val || null;
      } else {
        updates[key] = val || null;
      }
    }
    onSave(updates as InvoiceUpdateRequest);
  };

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const formatInfoValue = (key: string, value: unknown): string => {
    if (value == null) return "–";
    if (key === "created_at" && typeof value === "string") {
      return new Date(value).toLocaleString("de-DE");
    }
    return String(value);
  };

  return (
    <div className="fields-form">
      <div className="fields-form-header">
        <h3>Rechnungsdaten</h3>
        <div className="fields-form-actions">
          <button onClick={onReload} className="btn-reload" title="Neu laden">
            ↻ Neu laden
          </button>
          <button
            onClick={handleSave}
            disabled={dirtyKeys.size === 0 || saveStatus === "saving"}
            className="btn-save"
          >
            {saveStatus === "saving"
              ? "Speichern…"
              : `Speichern (${dirtyKeys.size})`}
          </button>
        </div>
      </div>

      {saveStatus === "saved" && (
        <div className="status-banner success">Gespeichert!</div>
      )}
      {saveStatus === "error" && (
        <div className="status-banner error">
          Fehler beim Speichern. Bitte erneut versuchen.
        </div>
      )}

      {/* Editable fields */}
      <div className="fields-list">
        {EDITABLE_FIELDS.map((field) => (
          <div
            key={field.key}
            className={`field-row ${dirtyKeys.has(field.key) ? "dirty" : ""}`}
          >
            <label className="field-key">{field.label}</label>
            <div className="field-value-wrapper">
              <input
                type={field.type === "number" ? "text" : field.type}
                inputMode={field.type === "number" ? "decimal" : undefined}
                value={values[field.key] ?? ""}
                onChange={(e) => handleChange(field.key, e.target.value)}
                className="field-value-input"
                placeholder={field.type === "date" ? "JJJJ-MM-TT" : undefined}
              />
              <button
                className="btn-copy"
                onClick={() => handleCopy(values[field.key] ?? "", field.key)}
                title="In Zwischenablage kopieren"
              >
                {copiedKey === field.key ? "✓" : "📋"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Read-only info section */}
      <div className="info-section">
        <h4>Zusatzinformationen</h4>
        {INFO_FIELDS.map((field) => {
          const rawValue = invoice[field.key];
          const displayValue = formatInfoValue(field.key, rawValue);
          return (
            <div key={field.key} className="info-row">
              <span className="info-label">{field.label}</span>
              <span
                className={`info-value ${field.key === "pdf_sha256" ? "monospace" : ""}`}
                title={String(rawValue ?? "")}
              >
                {displayValue}
              </span>
              <button
                className="btn-copy btn-copy-sm"
                onClick={() => handleCopy(displayValue, `info-${field.key}`)}
                title="Kopieren"
              >
                {copiedKey === `info-${field.key}` ? "✓" : "📋"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
