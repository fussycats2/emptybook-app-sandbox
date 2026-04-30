"use client";

// 1:1 문의 (/help)
// - 운영 채널이 미연동이라 폼 작성 시 mailto: 로 메일 앱을 띄우는 단순 구현
// - 안내 박스(연락 시간 / 응답 SLA) + 카테고리 선택 + 제목/본문 입력

import {
  Box,
  Button,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import HeadsetMicRoundedIcon from "@mui/icons-material/HeadsetMicRounded";
import { useState } from "react";
import AppHeader from "@/components/ui/AppHeader";
import { FixedFooter, ScrollBody } from "@/components/ui/Section";
import { SUPPORT_INFO } from "@/lib/staticContent";
import { palette } from "@/lib/theme";

const CATEGORIES = [
  "거래 관련",
  "결제 / 환불",
  "계정 / 로그인",
  "신고 / 분쟁",
  "기능 제안",
  "기타",
];

export default function HelpPage() {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const canSubmit = subject.trim().length > 0 && body.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    // mailto 본문에 카테고리 prefix 추가 — 운영자가 문의 분류를 빠르게 파악할 수 있게
    const mailSubject = `[${category}] ${subject}`;
    const mailBody = body;
    const url = `mailto:${SUPPORT_INFO.email}?subject=${encodeURIComponent(
      mailSubject
    )}&body=${encodeURIComponent(mailBody)}`;
    window.location.href = url;
  };

  return (
    <>
      <AppHeader title="1:1 문의" left="back" />
      <ScrollBody>
        <Box sx={{ p: 2 }}>
          <Stack
            direction="row"
            alignItems="center"
            gap={1.5}
            sx={{
              p: 1.75,
              background: palette.primarySoft,
              borderRadius: 3,
              mb: 2,
            }}
          >
            <Box sx={{ color: palette.primary, display: "grid", placeItems: "center" }}>
              <HeadsetMicRoundedIcon />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 800, color: palette.primary }}>
                {SUPPORT_INFO.hours}
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: palette.inkMute, mt: 0.25 }}>
                {SUPPORT_INFO.responseSla}
              </Typography>
            </Box>
          </Stack>

          <Typography sx={{ fontSize: 12, fontWeight: 800, mb: 0.75 }}>
            문의 유형
          </Typography>
          <Select
            fullWidth
            size="small"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            sx={{ mb: 2 }}
          >
            {CATEGORIES.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </Select>

          <Typography sx={{ fontSize: 12, fontWeight: 800, mb: 0.75 }}>
            제목
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="문의 제목을 입력하세요"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Typography sx={{ fontSize: 12, fontWeight: 800, mb: 0.75 }}>
            내용
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={6}
            placeholder="문의 내용을 자세히 적어주시면 빠르게 도와드릴 수 있어요."
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />

          <Typography
            sx={{
              fontSize: 11.5,
              color: palette.inkSubtle,
              mt: 1.5,
              lineHeight: 1.6,
            }}
          >
            보내기 버튼을 누르면 메일 앱이 열려요. 문의 내용은 {SUPPORT_INFO.email}{" "}
            로 전달됩니다.
          </Typography>
        </Box>
      </ScrollBody>
      <FixedFooter>
        <Button
          fullWidth
          size="large"
          variant="contained"
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          문의 보내기
        </Button>
      </FixedFooter>
    </>
  );
}
