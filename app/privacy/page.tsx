"use client";

// 개인정보 처리방침 (/privacy)
// - lib/staticContent.PRIVACY_SECTIONS 의 정적 텍스트를 섹션 단위로 표시
// - 데모용 발췌. 실서비스 시 법무 검토를 거친 전문으로 교체

import { Box, Typography } from "@mui/material";
import AppHeader from "@/components/ui/AppHeader";
import { ScrollBody } from "@/components/ui/Section";
import { PRIVACY_SECTIONS } from "@/lib/staticContent";
import { palette } from "@/lib/theme";

export default function PrivacyPage() {
  return (
    <>
      <AppHeader title="개인정보 처리방침" left="back" />
      <ScrollBody>
        <Box sx={{ p: 2.5 }}>
          <Box
            sx={{
              p: 2,
              mb: 3,
              background: palette.primaryTint,
              border: `1px solid ${palette.primarySoft}`,
              borderRadius: 3,
            }}
          >
            <Typography
              sx={{
                fontSize: 12.5,
                color: palette.primaryDark,
                lineHeight: 1.65,
                fontWeight: 600,
              }}
            >
              ⓘ 본 처리방침은 EmptyBook 이 이용자의 개인정보를 어떻게 수집·이용·보호하는지
              안내하기 위한 발췌본입니다. 정식 처리방침 전문은 추후 공지를 통해
              안내드립니다.
            </Typography>
          </Box>
          {PRIVACY_SECTIONS.map((s, i) => (
            <Box
              key={i}
              sx={{
                mb: 2,
                p: 2,
                background: palette.surface,
                border: `1px solid ${palette.lineSoft}`,
                borderRadius: 3,
              }}
            >
              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  color: palette.primary,
                  mb: 0.75,
                }}
              >
                SECTION {String(i + 1).padStart(2, "0")}
              </Typography>
              <Typography
                sx={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: palette.ink,
                  letterSpacing: "-0.025em",
                  mb: 1.25,
                }}
              >
                {s.title}
              </Typography>
              <Typography
                sx={{
                  fontSize: 13,
                  color: palette.inkMute,
                  lineHeight: 1.75,
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
