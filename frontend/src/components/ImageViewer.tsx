import { useState } from "react";

interface Props {
  url: string;
}

export default function ImageViewer({ url }: Props) {
  const [scale, setScale] = useState(1.0);
  const [imgError, setImgError] = useState<string | null>(null);

  return (
    <div className="image-viewer">
      <div className="image-controls">
        <span className="image-zoom">
          <button onClick={() => setScale((s) => Math.max(0.25, s - 0.25))}>
            −
          </button>
          <span>{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale((s) => Math.min(5, s + 0.25))}>
            +
          </button>
        </span>
        <button
          className="image-fit-btn"
          onClick={() => setScale(1.0)}
          title="Auf 100% zurücksetzen"
        >
          1:1
        </button>
      </div>

      {imgError && <div className="error-banner">{imgError}</div>}

      <div className="image-wrapper">
        <img
          src={url}
          alt="Vorschau"
          style={{ transform: `scale(${scale})`, transformOrigin: "top center" }}
          onError={() => setImgError("Bild konnte nicht geladen werden.")}
          onLoad={() => setImgError(null)}
          draggable={false}
        />
      </div>
    </div>
  );
}
