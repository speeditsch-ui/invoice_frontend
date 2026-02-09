-- Result Viewer DB Schema
-- Run this script to initialize the database.

CREATE DATABASE IF NOT EXISTS result_viewer
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE result_viewer;

CREATE TABLE IF NOT EXISTS documents (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  file_path   VARCHAR(512)  NOT NULL,
  file_name   VARCHAR(255)  NOT NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_file_name (file_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS document_fields (
  document_id INT          NOT NULL,
  field_key   VARCHAR(255) NOT NULL,
  field_value TEXT,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (document_id, field_key),
  CONSTRAINT fk_document_fields_doc
    FOREIGN KEY (document_id) REFERENCES documents(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Example seed data (optional – remove in production)
-- INSERT INTO documents (file_path, file_name) VALUES ('example/invoice.pdf', 'invoice.pdf');
-- INSERT INTO document_fields (document_id, field_key, field_value) VALUES (1, 'Rechnungsnummer', 'RE-2024-001');
-- INSERT INTO document_fields (document_id, field_key, field_value) VALUES (1, 'Betrag', '1.234,56 €');
