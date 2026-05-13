// 브라우저 탭 favicon — Next.js 가 빌드 시점 32×32 PNG 로 굽는다.
// 외부 .ico 자산 없이 ImageResponse 만으로 처리 (PalettE / 폰트 일관성).

import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          fontSize: 18,
          fontWeight: 800,
          letterSpacing: "-0.04em",
          borderRadius: 7,
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
