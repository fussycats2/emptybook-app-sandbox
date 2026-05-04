"use client";

// 오픈소스 라이선스 (/licenses)
// - lib/staticContent.OSS_LICENSES 배열을 카드 리스트로 표시
// - 새 dep 추가 시 staticContent 의 배열을 손으로 동기화한다 (자동 생성기 미도입)

import { Box, Stack, Typography } from "@mui/material";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import AppHeader from "@/components/ui/AppHeader";
import { ScrollBody } from "@/components/ui/Section";
import { OSS_LICENSES } from "@/lib/staticContent";
import { palette } from "@/lib/theme";

export default function LicensesPage() {
  return (
    <>
      <AppHeader title="오픈소스 라이선스" left="back" />
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
            EmptyBook 은 다음 오픈소스 라이브러리의 도움으로 만들어졌어요.
            각 프로젝트의 저작권은 원 저자에게 있으며, 표기된 라이선스 조건을
            따릅니다.
          </Typography>
          <Box
            sx={{
              background: palette.surface,
              border: `1px solid ${palette.line}`,
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            {OSS_LICENSES.map((dep, i) => {
              const interactive = !!dep.homepage;
              const Row = (
                <Stack
                  direction="row"
                  alignItems="center"
                  gap={1}
                  sx={{
                    p: 1.5,
                    borderTop: i === 0 ? "none" : `1px solid ${palette.line}`,
                    cursor: interactive ? "pointer" : "default",
                    textDecoration: "none",
                    color: palette.ink,
                    "&:hover": interactive
                      ? { background: palette.lineSoft }
                      : {},
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontSize: 14,
                        fontWeight: 700,
                        wordBreak: "break-all",
                      }}
                    >
                      {dep.name}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 11.5,
                        color: palette.inkSubtle,
                        mt: 0.25,
                      }}
                    >
                      v{dep.version} · {dep.license}
                    </Typography>
                  </Box>
                  {interactive && (
                    <OpenInNewRoundedIcon
                      sx={{ fontSize: 16, color: palette.inkSubtle }}
                    />
                  )}
                </Stack>
              );
              return interactive ? (
                <Box
                  key={dep.name}
                  component="a"
                  href={dep.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ display: "block", textDecoration: "none" }}
                >
                  {Row}
                </Box>
              ) : (
                <Box key={dep.name}>{Row}</Box>
              );
            })}
          </Box>
        </Box>
      </ScrollBody>
    </>
  );
}
