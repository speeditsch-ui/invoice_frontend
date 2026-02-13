import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { fetchSuppliers, createSupplier, deleteSupplier } from "../api";
import type { SupplierByEmail } from "../types";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<SupplierByEmail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSuppliers();
      setSuppliers(data.suppliers);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    setSaving(true);
    setError(null);
    try {
      await createSupplier({
        supplier_name: newName.trim(),
        email: newEmail.trim(),
      });
      setNewName("");
      setNewEmail("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setError(null);
    try {
      await deleteSupplier(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler beim Löschen");
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1>Lieferanten &amp; E-Mail</h1>
        <Link to="/invoices" className="btn-sm" style={{ marginLeft: "auto" }}>
          Rechnungen
        </Link>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <p className="loading-text">Laden…</p>
      ) : (
        <div className="table-scroll">
          <table className="doc-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Lieferant</th>
                <th>E-Mail</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {suppliers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="empty-row">
                    Keine Lieferanten vorhanden.
                  </td>
                </tr>
              ) : (
                suppliers.map((s) => (
                  <tr key={s.id}>
                    <td className="col-id">{s.id}</td>
                    <td>{s.supplier_name}</td>
                    <td className="col-email">{s.email}</td>
                    <td>
                      <button
                        className="btn-sm btn-delete"
                        onClick={() => handleDelete(s.id)}
                      >
                        Löschen
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add-Form */}
      <form onSubmit={handleAdd} className="supplier-add-form">
        <h3>Neuen Lieferanten hinzufügen</h3>
        <div className="supplier-add-fields">
          <input
            type="text"
            placeholder="Lieferant"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="E-Mail-Adresse"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
          />
          <button type="submit" disabled={saving}>
            {saving ? "Speichern…" : "Hinzufügen"}
          </button>
        </div>
      </form>
    </div>
  );
}
