// iOS 홈 화면에 추가 시 사용되는 아이콘 (180×180 PNG).
// favicon 과 같은 디자인 톤이지만 사이즈/라운드 비율을 iOS 권장에 맞춤.

import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2D5F4A",
          color: "#fff",
          fontSize: 92,
          fontWeight: 800,
          letterSpacing: "-0.04em",
          fontFamily:
            '-apple-system, "Segoe UI", system-ui, sans-serif',
        }}
      >
        EB
      </div>
    ),
    { ...size }
  );
}
