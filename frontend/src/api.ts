/**
 * Thin API client for the Invoice Viewer backend.
 * Base URL is configurable via VITE_API_BASE_URL env variable.
 */

import type {
  InvoiceListResponse,
  InvoiceDetail,
  InvoiceUpdateRequest,
  InvoiceUpdateResponse,
  FileListResponse,
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

/** List invoices with optional search, limit, offset. */
export async function fetchInvoices(
  search?: string,
  limit = 50,
  offset = 0
): Promise<InvoiceListResponse> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  params.set("limit", String(limit));
  params.set("offset", String(offset));

  const res = await fetch(`${BASE}/api/invoices?${params}`, {
    headers: headers(),
  });
  return handleResponse<InvoiceListResponse>(res);
}

/** Get single invoice with all fields. */
export async function fetchInvoice(id: number): Promise<InvoiceDetail> {
  const res = await fetch(`${BASE}/api/invoices/${id}`, {
    headers: headers(),
  });
  return handleResponse<InvoiceDetail>(res);
}

/** Get the URL for streaming the PDF. */
export function pdfUrl(id: number): string {
  return `${BASE}/api/invoices/${id}/pdf`;
}

/** Update invoice fields. */
export async function updateInvoice(
  id: number,
  payload: InvoiceUpdateRequest
): Promise<InvoiceUpdateResponse> {
  const res = await fetch(`${BASE}/api/invoices/${id}`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify(payload),
  });
  return handleResponse<InvoiceUpdateResponse>(res);
}

/** List PDF files from the inbox folder. */
export async function fetchFiles(): Promise<FileListResponse> {
  const res = await fetch(`${BASE}/api/files`, {
    headers: headers(),
  });
  return handleResponse<FileListResponse>(res);
}

/** Get the URL for streaming a PDF by filename. */
export function filePdfUrl(filename: string): string {
  return `${BASE}/api/files/${encodeURIComponent(filename)}/pdf`;
}
