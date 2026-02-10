import { useMemo, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import type { Options } from "react-pdf/src/shared/types.ts";

// Use a plain .js copy of the worker to avoid .mjs MIME type issues with nginx.
// The file is copied to dist/pdf.worker.min.js by the vite plugin in vite.config.ts.
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

interface Props {
  url: string;
}

export default function PdfViewer({ url }: Props) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const onLoadSuccess = ({ numPages: n }: { numPages: number }) => {
    setNumPages(n);
    setPageNumber(1);
    setPdfError(null);
  };

  const onLoadError = (error: Error) => {
    setPdfError(error.message || "PDF konnte nicht geladen werden.");
  };

  const apiKey = import.meta.env.VITE_API_KEY;

  const pdfOptions: Options = useMemo(() => {
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers["X-API-Key"] = apiKey;
    }
    return { httpHeaders: headers };
  }, [apiKey]);

  return (
    <div className="pdf-viewer">
      <div className="pdf-controls">
        <button
          disabled={pageNumber <= 1}
          onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
        >
          ◀
        </button>
        <span>
          Seite {pageNumber} / {numPages || "?"}
        </span>
        <button
          disabled={pageNumber >= numPages}
          onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
        >
          ▶
        </button>
        <span className="pdf-zoom">
          <button onClick={() => setScale((s) => Math.max(0.25, s - 0.25))}>
            −
          </button>
          <span>{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale((s) => Math.min(3, s + 0.25))}>
            +
          </button>
        </span>
      </div>

      {pdfError && <div className="error-banner">{pdfError}</div>}

      <div className="pdf-document-wrapper">
        <Document
          file={{ url }}
          options={pdfOptions}
          onLoadSuccess={onLoadSuccess}
          onLoadError={onLoadError}
          loading={<p className="loading-text">PDF wird geladen…</p>}
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            loading={<p className="loading-text">Seite wird gerendert…</p>}
          />
        </Document>
      </div>
    </div>
  );
}
