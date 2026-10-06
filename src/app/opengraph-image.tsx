import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Pulseboard live crypto market dashboard";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "linear-gradient(135deg, #0c1210 0%, #163024 55%, #0c1210 100%)",
          color: "#e8f0ea",
        }}
      >
        <p style={{ margin: 0, fontSize: 28, letterSpacing: "0.18em", textTransform: "uppercase", color: "#8fd9a8" }}>
          Live public API
        </p>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <h1 style={{ margin: 0, fontSize: 96, letterSpacing: "-0.04em" }}>Pulseboard</h1>
          <p style={{ margin: "16px 0 0", fontSize: 32, color: "#93a399", maxWidth: 760 }}>
            Real-time crypto markets, searchable cards, and live highlights.
          </p>
        </div>
      </div>
    ),
    { ...size },
  );
}
