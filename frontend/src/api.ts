/**
 * Thin API client for the Result Viewer backend.
 * Base URL is configurable via VITE_API_BASE_URL env variable.
 */

import type {
  DocumentListResponse,
  DocumentDetail,
  FieldsUpdateRequest,
  FieldsUpdateResponse,
} from "./types";

const BASE = import.meta.env.VITE_API_BASE_URL ?? "";

function headers(): HeadersInit {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const apiKey = import.meta.env.VITE_API_KEY;
  if (apiKey) {
    h["X-API-Key"] = apiKey;
  }
  return h;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

/** List documents with optional search, limit, offset. */
export async function fetchDocuments(
  search?: string,
  limit = 50,
  offset = 0
): Promise<DocumentListResponse> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  params.set("limit", String(limit));
  params.set("offset", String(offset));

  const res = await fetch(`${BASE}/api/documents?${params}`, {
    headers: headers(),
  });
  return handleResponse<DocumentListResponse>(res);
}

/** Get single document with fields. */
export async function fetchDocument(id: number): Promise<DocumentDetail> {
  const res = await fetch(`${BASE}/api/documents/${id}`, {
    headers: headers(),
  });
  return handleResponse<DocumentDetail>(res);
}

/** Get the URL for streaming the PDF. */
export function pdfUrl(id: number): string {
  return `${BASE}/api/documents/${id}/pdf`;
}

/** Update (upsert) document fields. */
export async function updateFields(
  id: number,
  payload: FieldsUpdateRequest
): Promise<FieldsUpdateResponse> {
  const res = await fetch(`${BASE}/api/documents/${id}/fields`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify(payload),
  });
  return handleResponse<FieldsUpdateResponse>(res);
}
