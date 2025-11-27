import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const score = searchParams.get("score") || "0";
  const username = searchParams.get("username") || "Player";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "800px",
          background: "linear-gradient(to bottom, #ede9fe, #dbeafe, #f1f5f9)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          fontSize: 48,
          fontFamily: "Arial",
        }}
      >
        <div
          style={{
            fontSize: 90,
            fontWeight: "bold",
            marginBottom: "40px",
            color: "#4c1d95",
          }}
        >
          Math Blitz
        </div>

        <div style={{ fontSize: 50, color: "#334155" }}>
          @{username} scored
        </div>

        <div
          style={{
            fontSize: 180,
            fontWeight: "bold",
            color: "#6d28d9",
            marginTop: "20px",
          }}
        >
          {score}
        </div>

        <div style={{ marginTop: "40px", color: "#475569", fontSize: 36 }}>
          🔥 Can you beat this score?
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 800,
    }
  );
}
