/** API response types matching the backend schemas. */

export interface InvoiceListItem {
  id: number;
  supplier_name: string;
  invoice_number: string | null;
  invoice_date: string | null;
  net_total: number | null;
  currency: string | null;
  source_email: string;
  created_at: string | null;
}

export interface InvoiceListResponse {
  total: number;
  invoices: InvoiceListItem[];
}

export interface InvoiceDetail {
  id: number;
  supplier_name: string;
  invoice_number: string | null;
  invoice_date: string | null;
  net_total: number | null;
  currency: string | null;
  vat_rate: number | null;
  vat_amount: number | null;
  source_email: string;
  pdf_path: string | null;
  llm_flags: string | null;
  created_at: string | null;
  pdf_sha256: string;
  has_pdf: boolean;
}

export interface InvoiceUpdateRequest {
  supplier_name?: string;
  invoice_number?: string | null;
  invoice_date?: string | null;
  net_total?: number | null;
  currency?: string | null;
  vat_rate?: number | null;
  vat_amount?: number | null;
  source_email?: string;
}

export interface InvoiceUpdateResponse {
  updated: number;
  message: string;
}

export interface FileEntry {
  filename: string;
  size: number;
  modified: string;
  invoice_id: number | null;
  supplier_name: string | null;
  invoice_number: string | null;
}

export interface FileListResponse {
  total: number;
  files: FileEntry[];
}
