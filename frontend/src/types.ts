/** API response types matching the backend schemas. */

export interface DocumentListItem {
  id: number;
  file_name: string;
  created_at: string;
}

export interface DocumentListResponse {
  total: number;
  documents: DocumentListItem[];
}

export interface DocumentDetail {
  id: number;
  file_name: string;
  file_path: string;
  created_at: string;
  fields: Record<string, string | null>;
}

export interface FieldsUpdateRequest {
  fields: Record<string, string | null>;
}

export interface FieldsUpdateResponse {
  updated: number;
  message: string;
}
