"use client";

// 공지사항 상세 (/notices/[id])
// - getNotice 로 정적 데이터에서 조회. 없는 id 면 EmptyState 안내

import { Box, Stack, Typography } from "@mui/material";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/ui/AppHeader";
import { ScrollBody } from "@/components/ui/Section";
import EmptyState from "@/components/ui/EmptyState";
import { getNotice } from "@/lib/staticContent";
import { palette } from "@/lib/theme";

export default function NoticeDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const notice = getNotice(params.id);

  return (
    <>
      <AppHeader title="공지사항" left="back" />
      <ScrollBody>
        {!notice && (
          <EmptyState
            icon={<CampaignRoundedIcon />}
            title="공지를 찾을 수 없어요"
            description="삭제되었거나 잘못된 링크일 수 있어요."
            actionLabel="목록으로"
            onAction={() => router.replace("/notices")}
          />
        )}
        {notice && (
          <Box sx={{ p: 2.5 }}>
            <Stack direction="row" alignItems="center" gap={0.75} mb={1}>
              {notice.pinned && (
                <Box
                  sx={{
                    fontSize: 10.5,
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
              <Typography sx={{ fontSize: 11.5, color: palette.inkSubtle }}>
                {notice.date}
              </Typography>
            </Stack>
            <Typography
              sx={{ fontSize: 18, fontWeight: 800, lineHeight: 1.4, mb: 2 }}
            >
              {notice.title}
            </Typography>
            <Typography
              sx={{
                fontSize: 14,
                lineHeight: 1.7,
                color: palette.inkMute,
                whiteSpace: "pre-wrap",
              }}
            >
              {notice.body}
            </Typography>
          </Box>
        )}
      </ScrollBody>
    </>
  );
}
