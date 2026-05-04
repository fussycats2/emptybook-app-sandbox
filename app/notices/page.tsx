"use client";

// 공지사항 목록 (/notices)
// - lib/staticContent.NOTICES 의 정적 데이터 표시
// - pinned 항목은 상단 고정 배지

import { Box, Stack, Typography } from "@mui/material";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import KeyboardArrowRightRoundedIcon from "@mui/icons-material/KeyboardArrowRightRounded";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/ui/AppHeader";
import { ScrollBody } from "@/components/ui/Section";
import EmptyState from "@/components/ui/EmptyState";
import { NOTICES } from "@/lib/staticContent";
import { palette } from "@/lib/theme";

export default function NoticesPage() {
  const router = useRouter();

  return (
    <>
      <AppHeader title="공지사항" left="back" />
      <ScrollBody>
        {NOTICES.length === 0 && (
          <EmptyState
            icon={<CampaignRoundedIcon />}
            title="등록된 공지가 없어요"
          />
        )}
        {NOTICES.length > 0 && (
          <Box>
            {NOTICES.map((n) => (
              <Stack
                key={n.id}
                direction="row"
                alignItems="center"
                gap={1.25}
                onClick={() => router.push(`/notices/${n.id}`)}
                sx={{
                  p: "18px 16px",
                  borderBottom: `1px solid ${palette.lineSoft}`,
                  cursor: "pointer",
                  transition: "background 160ms ease",
                  "&:hover": { background: palette.surfaceAlt },
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" alignItems="center" gap={0.75} mb={0.25}>
                    {n.pinned && (
                      <Box
                        sx={{
                          fontSize: 10,
                          fontWeight: 800,
                          color: palette.primary,
                          background: palette.primarySoft,
                          borderRadius: 999,
                          px: 0.85,
                          py: 0.2,
                        }}
                      >
                        공지
                      </Box>
                    )}
                    <Typography
                      sx={{
                        fontSize: 14.5,
                        fontWeight: 700,
                        color: palette.ink,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {n.title}
                    </Typography>
                  </Stack>
                  <Typography sx={{ fontSize: 11.5, color: palette.inkSubtle }}>
                    {n.date}
                  </Typography>
                </Box>
                <KeyboardArrowRightRoundedIcon
                  sx={{ color: palette.inkSubtle }}
                />
              </Stack>
            ))}
          </Box>
        )}
      </ScrollBody>
    </>
  );
}
