"use client";

// 이용약관 (/terms)
// - lib/staticContent.TERMS_SECTIONS 의 정적 텍스트를 섹션 단위로 표시
// - 데모용 발췌. 실서비스 시 법무 검토를 거친 전문으로 교체

import { Box, Typography } from "@mui/material";
import AppHeader from "@/components/ui/AppHeader";
import { ScrollBody } from "@/components/ui/Section";
import { TERMS_SECTIONS } from "@/lib/staticContent";
import { palette } from "@/lib/theme";

export default function TermsPage() {
  return (
    <>
      <AppHeader title="이용 약관" left="back" />
      <ScrollBody>
        <Box sx={{ p: 2.5 }}>
          <Typography
            sx={{
              fontSize: 12,
              color: palette.inkSubtle,
              mb: 2,
              lineHeight: 1.6,
            }}
          >
            아래 약관은 서비스 운영을 위한 기본 약관 발췌본입니다. 정식 약관 전문은
            추후 공지를 통해 안내드립니다.
          </Typography>
          {TERMS_SECTIONS.map((s, i) => (
            <Box key={i} sx={{ mb: 2.5 }}>
              <Typography
                sx={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: palette.ink,
                  mb: 0.75,
                }}
              >
                {s.title}
              </Typography>
              <Typography
                sx={{
                  fontSize: 13,
                  color: palette.inkMute,
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                }}
              >
                {s.body}
              </Typography>
            </Box>
          ))}
        </Box>
      </ScrollBody>
    </>
  );
}
