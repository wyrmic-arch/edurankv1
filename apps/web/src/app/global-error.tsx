"use client";

// Replaces the root layout entirely, so it must render its own <html>/<body>
// and cannot rely on the app's global CSS. Styles are inlined on purpose.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en" data-theme="night">
      <body style={{ margin: 0, backgroundColor: "#0A0A0A", color: "#E4E4E4", fontFamily: "system-ui, sans-serif" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            textAlign: "center",
          }}
        >
          <div>
            <div style={{ letterSpacing: "0.14em", textTransform: "uppercase", fontSize: "10px", color: "#A4A9B0" }}>
              SOMETHING BROKE
            </div>
            <h1 style={{ fontSize: "40px", margin: "10px 0 16px" }}>Off the rails.</h1>
            <p style={{ color: "#A4A9B0", marginBottom: "24px" }}>Reload to try again.</p>
            <button
              onClick={reset}
              style={{
                border: "1px solid #E4E4E4",
                background: "#E4E4E4",
                color: "#0A0A0A",
                padding: "10px 18px",
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                fontSize: "11px",
              }}
            >
              Reload
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
