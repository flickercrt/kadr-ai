import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "كادر AI — اصنع السينما والإعلان، إطارًا بإطار";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const font = await readFile(join(process.cwd(), "assets/IBMPlexSansArabic-Bold.ttf"));
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-end",
          background: "#0E1116",
          color: "#F5F7FA",
          padding: "72px",
          fontFamily: "Plex",
          direction: "rtl",
        }}
      >
        <div style={{ display: "flex", flexDirection: "row-reverse", color: "#FF6B4A", fontSize: 32 }}>
          <span>كادر</span>
          <span style={{ marginRight: 12 }}>AI</span>
        </div>
        <div style={{ display: "flex", flexDirection: "row-reverse", marginTop: 28, fontSize: 76, lineHeight: 1.25 }}>
          <span>اصنع</span>
          <span style={{ marginRight: 18 }}>السينما</span>
          <span style={{ marginRight: 18 }}>والإعلان</span>
        </div>
        <div style={{ display: "flex", flexDirection: "row-reverse", marginTop: 18, fontSize: 42, color: "#00D4B4" }}>
          <span>إطارًا</span>
          <span style={{ marginRight: 14 }}>بإطار</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Plex", data: font, weight: 700, style: "normal" }],
    },
  );
}
