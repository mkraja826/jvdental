import { ImageResponse } from "next/og";

export const alt = "JV Dental & Implant Centre — Dental care in Hyderabad";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "edge";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: "#102d34", color: "#ffffff", padding: 74, flexDirection: "column", justifyContent: "space-between", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", fontSize: 27, fontWeight: 700, letterSpacing: 2, color: "#c9d8d1" }}>
          JV DENTAL &amp; IMPLANT CENTRE
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "flex", fontSize: 69, fontWeight: 700, lineHeight: 1.1 }}>Dental care in Hyderabad</div>
          <div style={{ display: "flex", fontSize: 30, color: "#dae5df" }}>Implants · Restorative Dentistry · Complete Care</div>
        </div>
        <div style={{ display: "flex", width: "100%", justifyContent: "space-between", fontSize: 25, color: "#b4cbc2" }}>
          <span>S R Nagar · Near Ameerpet</span><span>jvdental.com</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
