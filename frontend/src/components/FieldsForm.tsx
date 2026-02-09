import { useState, useEffect, useCallback } from "react";

interface Props {
  fields: Record<string, string | null>;
  onSave: (dirty: Record<string, string | null>) => Promise<void>;
  onReload: () => void;
  saveStatus: "idle" | "saving" | "saved" | "error";
}

export default function FieldsForm({
  fields,
  onSave,
  onReload,
  saveStatus,
}: Props) {
  // Local editable copy
  const [values, setValues] = useState<Record<string, string>>(toStringMap(fields));
  const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Reset when fields change from parent (e.g., after save/reload)
  useEffect(() => {
    setValues(toStringMap(fields));
    setDirtyKeys(new Set());
  }, [fields]);

  const handleChange = useCallback(
    (key: string, value: string) => {
      setValues((prev) => ({ ...prev, [key]: value }));
      setDirtyKeys((prev) => {
        const next = new Set(prev);
        // Mark dirty only if different from original
        if (value !== (fields[key] ?? "")) {
          next.add(key);
        } else {
          next.delete(key);
        }
        return next;
      });
    },
    [fields]
  );

  const handleSave = () => {
    const dirty: Record<string, string | null> = {};
    for (const key of dirtyKeys) {
      dirty[key] = values[key] || null;
    }
    onSave(dirty);
  };

  const handleCopy = async (key: string) => {
    try {
      await navigator.clipboard.writeText(values[key] ?? "");
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      // Fallback for non-https
      const ta = document.createElement("textarea");
      ta.value = values[key] ?? "";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    }
  };

  const keys = Object.keys(values);

  return (
    <div className="fields-form">
      <div className="fields-form-header">
        <h3>Felder ({keys.length})</h3>
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

      {keys.length === 0 ? (
        <p className="empty-fields">Keine Felder vorhanden.</p>
      ) : (
        <div className="fields-list">
          {keys.map((key) => (
            <div
              key={key}
              className={`field-row ${dirtyKeys.has(key) ? "dirty" : ""}`}
            >
              <label className="field-key" title={key}>
                {key}
              </label>
              <div className="field-value-wrapper">
                <input
                  type="text"
                  value={values[key] ?? ""}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="field-value-input"
                />
                <button
                  className="btn-copy"
                  onClick={() => handleCopy(key)}
                  title="In Zwischenablage kopieren"
                >
                  {copiedKey === key ? "✓" : "📋"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Convert nullable values to strings for controlled inputs. */
function toStringMap(fields: Record<string, string | null>): Record<string, string> {
  const map: Record<string, string> = {};
  for (const [k, v] of Object.entries(fields)) {
    map[k] = v ?? "";
  }
  return map;
}
