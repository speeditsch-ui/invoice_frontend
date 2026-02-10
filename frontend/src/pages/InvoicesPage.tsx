import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { fetchInvoices } from "../api";
import type { InvoiceListItem } from "../types";

/** Format a number as EUR currency string. */
function formatEur(value: number | null, currency?: string | null): string {
  if (value == null) return "–";
  return value.toLocaleString("de-DE", {
    style: "currency",
    currency: currency || "EUR",
    minimumFractionDigits: 2,
  });
}

/** Format a date string to German locale. */
function formatDate(value: string | null): string {
  if (!value) return "–";
  return new Date(value).toLocaleDateString("de-DE");
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
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
      const data = await fetchInvoices(search || undefined, limit, offset);
      setInvoices(data.invoices);
      setTotal(data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
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
        <h1>Rechnungen</h1>
        <Link to="/viewer" className="btn-sm" style={{ marginLeft: "auto" }}>
          Datei-Browser
        </Link>
      </header>

      <form onSubmit={handleSearch} className="search-bar">
        <input
          type="text"
          placeholder="Lieferant, Rechnungsnr. oder E-Mail suchen…"
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
          <div className="table-scroll">
            <table className="doc-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Lieferant</th>
                  <th>Rechnungsnr.</th>
                  <th>Datum</th>
                  <th className="col-right">Netto</th>
                  <th>E-Mail</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty-row">
                      Keine Rechnungen gefunden.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="col-id">{inv.id}</td>
                      <td>{inv.supplier_name || <span className="text-muted">–</span>}</td>
                      <td>{inv.invoice_number || <span className="text-muted">–</span>}</td>
                      <td>{formatDate(inv.invoice_date)}</td>
                      <td className="col-right">{formatEur(inv.net_total, inv.currency)}</td>
                      <td className="col-email">{inv.source_email}</td>
                      <td>
                        <Link to={`/viewer/${inv.id}`} className="btn-sm">
                          Öffnen
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - limit))}
            >
              ← Zurück
            </button>
            <span>
              {total === 0
                ? "Keine Ergebnisse"
                : `${offset + 1}–${Math.min(offset + limit, total)} von ${total}`}
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
