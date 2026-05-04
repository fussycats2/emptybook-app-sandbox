"use client";

// 비밀번호 재설정 페이지 (/reset-password)
// - /find-account?tab=password 에서 보낸 메일 링크 → /auth/callback?next=/reset-password 를 거쳐 도착
// - 도착 시점에는 supabase 의 recovery 세션이 활성 상태이므로 user 가 존재한다.
//   user 가 없다면 잘못된 진입(혹은 만료) — 안내 후 로그인 화면으로 보낸다.
// - 새 비밀번호 입력 → updateUser({ password }) 후 /home 으로 이동.

import {
  Box,
  Button,
  IconButton,
  OutlinedInput,
  Stack,
  Typography,
} from "@mui/material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import AppHeader from "@/components/ui/AppHeader";
import { palette } from "@/lib/theme";
import { useToast } from "@/components/ui/ToastProvider";
import { useAuth } from "@/lib/auth/AuthProvider";
import { supabaseBrowser } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/repo";
import { INPUT_SX, PRIMARY_BUTTON_SX } from "@/lib/ui/formStyle";

export default function ResetPasswordPage() {
  const router = useRouter();
  const toast = useToast();
  const { user, loading } = useAuth();
  const [show, setShow] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 비밀번호 정책 — 최소 길이만 제한 (Supabase 기본 정책과 정렬)
  const valid = useMemo(() => pw.length >= 6 && pw === pw2, [pw, pw2]);
  const mismatch = pw2.length > 0 && pw !== pw2;

  const handleSubmit = async () => {
    if (submitting) return;
    if (!valid) {
      toast?.show("비밀번호를 확인해주세요 (6자 이상, 일치)");
      return;
    }
    if (!isSupabaseConfigured) {
      toast?.show("Supabase 환경변수가 없어 비밀번호 재설정을 사용할 수 없어요");
      return;
    }
    setSubmitting(true);
    const { error } = await supabaseBrowser().auth.updateUser({ password: pw });
    setSubmitting(false);
    if (error) {
      toast?.show(error.message || "비밀번호 변경에 실패했어요");
      return;
    }
    toast?.show("비밀번호가 변경되었어요");
    router.replace("/home");
    router.refresh();
  };

  // recovery 세션이 없으면 진입 자체를 차단 — 만료/오타 링크 방어
  if (!loading && !user) {
    return (
      <>
        <AppHeader title="비밀번호 재설정" left="back" bordered={false} />
        <Box sx={{ p: 3, pt: 1, flex: 1 }}>
          <Typography
            sx={{
              fontSize: 11.5,
              fontWeight: 800,
              letterSpacing: "0.18em",
              color: palette.warn,
              mb: 1.25,
            }}
          >
            LINK EXPIRED
          </Typography>
          <Typography sx={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>
            링크가 만료됐거나
            <br />
            올바르지 않아요.
          </Typography>
          <Typography sx={{ fontSize: 14, color: palette.inkMute, mt: 1, lineHeight: 1.6 }}>
            비밀번호 재설정 메일을 다시 요청해주세요. 링크는 발송 후 1시간 동안만
            유효해요.
          </Typography>
          <Stack gap={1} sx={{ mt: 3 }}>
            <Button
              onClick={() => router.replace("/find-account?tab=password")}
              sx={PRIMARY_BUTTON_SX}
            >
              재설정 메일 다시 받기
            </Button>
            <Button
              variant="text"
              onClick={() => router.replace("/login")}
              sx={{ color: palette.inkMute }}
            >
              로그인 화면으로
            </Button>
          </Stack>
        </Box>
      </>
    );
  }

  return (
    <>
      <AppHeader title="비밀번호 재설정" left="back" bordered={false} />
      <Box sx={{ p: 3, pt: 1, flex: 1, display: "flex", flexDirection: "column" }}>
        <Box>
          <Typography
            sx={{
              display: "inline-block",
              fontSize: 10.5,
              fontWeight: 800,
              letterSpacing: "0.16em",
              color: palette.primary,
              background: palette.primaryTint,
              border: `1px solid ${palette.primarySoft}`,
              borderRadius: 999,
              px: 1.1,
              py: 0.4,
              mb: 1.5,
            }}
          >
            NEW PASSWORD
          </Typography>
          <Typography sx={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.3 }}>
            새 비밀번호를
            <br />
            설정해주세요.
          </Typography>
          <Typography sx={{ fontSize: 13, color: palette.inkMute, mt: 1 }}>
            6자 이상으로 안전하게 만들어주세요.
          </Typography>
        </Box>

        <Stack gap={1.25} mt={3}>
          <OutlinedInput
            fullWidth
            placeholder="새 비밀번호"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            sx={INPUT_SX}
            endAdornment={
              <IconButton
                size="small"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "비밀번호 숨기기" : "비밀번호 보기"}
                sx={{ color: palette.inkSubtle, mr: -0.5 }}
              >
                {show ? (
                  <VisibilityOffOutlinedIcon fontSize="small" />
                ) : (
                  <VisibilityOutlinedIcon fontSize="small" />
                )}
              </IconButton>
            }
          />
          <OutlinedInput
            fullWidth
            placeholder="비밀번호 확인"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            error={mismatch}
            sx={INPUT_SX}
            onKeyDown={(e) => {
              if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
              e.preventDefault();
              handleSubmit();
            }}
          />
          {mismatch && (
            <Typography sx={{ fontSize: 12, color: palette.accent, ml: 0.5 }}>
              비밀번호가 일치하지 않아요.
            </Typography>
          )}
          <Button
            fullWidth
            onClick={handleSubmit}
            disabled={!valid || submitting}
            sx={{ ...PRIMARY_BUTTON_SX, mt: 1 }}
          >
            {submitting ? "변경 중…" : "비밀번호 변경"}
          </Button>
        </Stack>
      </Box>
    </>
  );
}
