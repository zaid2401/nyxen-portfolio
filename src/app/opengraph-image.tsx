import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const alt = `${siteConfig.brand} — ${siteConfig.name}, ${siteConfig.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Social card, generated at build time.
 *
 * Built from plain layout primitives rather than the site's CSS — Satori (what
 * next/og renders with) supports a subset of flexbox, no Tailwind, and requires
 * an explicit `display` on any element with more than one child. This
 * intentionally re-states the design in that smaller vocabulary.
 */
export default function Image() {
  const accent = "#2fe0a6";
  const ground = "#04050a";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: ground,
        padding: "72px 80px",
        fontFamily: "sans-serif",
        position: "relative",
      }}
    >
      {/* Grid field */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.045) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      {/* Accent bloom */}
      <div
        style={{
          position: "absolute",
          top: -260,
          left: 380,
          width: 900,
          height: 620,
          display: "flex",
          background:
            "radial-gradient(closest-side, rgba(47,224,166,0.18), rgba(47,224,166,0))",
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div
          style={{
            width: 44,
            height: 44,
            border: `2px solid ${accent}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: accent,
            fontSize: 26,
            fontWeight: 700,
          }}
        >
          N
        </div>
        <div
          style={{
            display: "flex",
            color: "#e8ebf0",
            fontSize: 24,
            letterSpacing: 10,
            fontWeight: 600,
          }}
        >
          {siteConfig.brand}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            color: accent,
            fontSize: 20,
            letterSpacing: 6,
            marginBottom: 22,
          }}
        >
          SYSTEM ONLINE
        </div>
        <div
          style={{
            display: "flex",
            color: "#e8ebf0",
            fontSize: 76,
            fontWeight: 700,
            letterSpacing: -2,
            lineHeight: 1.05,
          }}
        >
          {`${siteConfig.name} — ${siteConfig.role}`}
        </div>
        <div
          style={{
            display: "flex",
            color: "#949cad",
            fontSize: 30,
            marginTop: 26,
            maxWidth: 900,
            lineHeight: 1.4,
          }}
        >
          Automation systems, developer tooling and data-driven solutions.
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid rgba(255,255,255,0.12)",
          paddingTop: 26,
          color: "#5d6577",
          fontSize: 22,
          letterSpacing: 3,
        }}
      >
        <div style={{ display: "flex" }}>{siteConfig.domain}</div>
        <div style={{ display: "flex" }}>
          {siteConfig.roles.slice(1).join("  ·  ")}
        </div>
      </div>
    </div>,
    size,
  );
}
