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
  SupplierByEmailListResponse,
  SupplierByEmailCreate,
  SupplierByEmail,
  DeleteResponse,
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

/** Get the URL for streaming a file (PDF or image) by its relative path. */
export function fileUrl(filename: string): string {
  // Encode each path segment individually so slashes are preserved
  const encoded = filename
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
  return `${BASE}/api/files/${encoded}/raw`;
}

/** @deprecated Use fileUrl instead. Kept for backwards compatibility. */
export function filePdfUrl(filename: string): string {
  return fileUrl(filename);
}

/** Check whether a filename refers to an image (jpg/jpeg/png). */
export function isImageFile(filename: string): boolean {
  const lower = filename.toLowerCase();
  return lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png");
}

/** Check whether a filename refers to a PDF. */
export function isPdfFile(filename: string): boolean {
  return filename.toLowerCase().endsWith(".pdf");
}

// ── Supplier-by-Email ────────────────────────────────────

/** List all supplier-email mappings. */
export async function fetchSuppliers(): Promise<SupplierByEmailListResponse> {
  const res = await fetch(`${BASE}/api/suppliers`, {
    headers: headers(),
  });
  return handleResponse<SupplierByEmailListResponse>(res);
}

/** Create a new supplier-email mapping. */
export async function createSupplier(
  payload: SupplierByEmailCreate
): Promise<SupplierByEmail> {
  const res = await fetch(`${BASE}/api/suppliers`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(payload),
  });
  return handleResponse<SupplierByEmail>(res);
}

/** Delete a supplier-email mapping by ID. */
export async function deleteSupplier(id: number): Promise<DeleteResponse> {
  const res = await fetch(`${BASE}/api/suppliers/${id}`, {
    method: "DELETE",
    headers: headers(),
  });
  return handleResponse<DeleteResponse>(res);
}
