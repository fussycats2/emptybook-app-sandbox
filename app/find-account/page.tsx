"use client";

// 계정 찾기 페이지 (/find-account)
// - 두 가지 흐름을 한 페이지의 탭으로 묶었다 (?tab=email | password)
//   1) 이메일 찾기: 휴대폰 번호 입력 → /api/auth/find-email 으로 마스킹된 이메일 반환
//   2) 비밀번호 찾기: 이메일 입력 → supabase.auth.resetPasswordForEmail 호출 → 메일 안내
//
// 보안 메모
// - 이메일 찾기는 SMS 본인 인증이 빠져 있어 추후 업그레이드 권장 (마스킹으로 1차 보호)
// - 비밀번호 재설정 메일은 redirectTo 를 /auth/callback?next=/reset-password 로 두어
//   기존 OAuth 콜백(exchangeCodeForSession)을 그대로 재사용한다.

import {
  Box,
  Button,
  OutlinedInput,
  Stack,
  Typography,
} from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import AppHeader from "@/components/ui/AppHeader";
import { palette } from "@/lib/theme";
import { useToast } from "@/components/ui/ToastProvider";
import { supabaseBrowser } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/repo";
import { INPUT_SX, PRIMARY_BUTTON_SX } from "@/lib/ui/formStyle";

type TabKey = "email" | "password";

export default function FindAccountPage() {
  return (
    <Suspense fallback={<AppHeader title="계정 찾기" left="back" bordered={false} />}>
      <FindAccountInner />
    </Suspense>
  );
}

function FindAccountInner() {
  const params = useSearchParams();
  const initialTab = params.get("tab") === "password" ? "password" : "email";
  const [tab, setTab] = useState<TabKey>(initialTab);

  return (
    <>
      <AppHeader title="계정 찾기" left="back" bordered={false} />
      <Box sx={{ p: 3, pt: 1, flex: 1, display: "flex", flexDirection: "column" }}>
        <TabSwitcher tab={tab} onChange={setTab} />
        <Box sx={{ mt: 3, flex: 1 }}>
          {tab === "email" ? <FindEmailForm /> : <ResetPasswordForm />}
        </Box>
      </Box>
    </>
  );
}

// 두 개짜리 segmented tab — 외부 라이브러리 없이 단순 버튼 두 개로 충분
function TabSwitcher({
  tab,
  onChange,
}: {
  tab: TabKey;
  onChange: (k: TabKey) => void;
}) {
  const items: { key: TabKey; label: string }[] = [
    { key: "email", label: "아이디 찾기" },
    { key: "password", label: "비밀번호 찾기" },
  ];
  return (
    <Stack
      direction="row"
      sx={{
        background: palette.lineSoft,
        borderRadius: 999,
        p: 0.5,
      }}
    >
      {items.map((it) => {
        const active = tab === it.key;
        return (
          <Box
            key={it.key}
            onClick={() => onChange(it.key)}
            sx={{
              flex: 1,
              textAlign: "center",
              py: 1,
              fontSize: 13.5,
              fontWeight: 700,
              cursor: "pointer",
              borderRadius: 999,
              background: active ? palette.surface : "transparent",
              color: active ? palette.primary : palette.inkSubtle,
              boxShadow: active
                ? "0 1px 2px rgba(26, 38, 32, 0.06), 0 4px 12px rgba(26, 38, 32, 0.06)"
                : "none",
              transition: "all 160ms ease",
            }}
          >
            {it.label}
          </Box>
        );
      })}
    </Stack>
  );
}

// ── 아이디(이메일) 찾기 ──────────────────────────────────────────────────────
function FindEmailForm() {
  const toast = useToast();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ email: string; createdAt: string | null } | null>(
    null
  );
  const [notFound, setNotFound] = useState(false);

  const handleSubmit = async () => {
    if (submitting) return;
    setNotFound(false);
    setResult(null);
    if (phone.replace(/\D+/g, "").length < 9) {
      toast?.show("휴대폰 번호를 정확히 입력해주세요");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/find-email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const json = (await res.json()) as {
        found?: boolean;
        email?: string;
        createdAt?: string | null;
      };
      if (!json.found || !json.email) {
        setNotFound(true);
      } else {
        setResult({ email: json.email, createdAt: json.createdAt ?? null });
      }
    } catch {
      toast?.show("일시적인 오류가 발생했어요. 잠시 후 다시 시도해주세요");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack gap={2}>
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
          FIND YOUR ID
        </Typography>
        <Typography sx={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.3 }}>
          가입 시 입력한 휴대폰 번호로
          <br />
          이메일을 찾아드려요.
        </Typography>
        <Typography sx={{ fontSize: 13, color: palette.inkMute, mt: 1 }}>
          개인정보 보호를 위해 일부 글자는 가려져 표시됩니다.
        </Typography>
      </Box>

      <Stack gap={1.25}>
        <OutlinedInput
          fullWidth
          placeholder="휴대폰 번호 (숫자만 입력해도 됩니다)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="tel"
          autoComplete="tel"
          sx={INPUT_SX}
          onKeyDown={(e) => {
            if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
            e.preventDefault();
            handleSubmit();
          }}
        />
        <Button
          fullWidth
          onClick={handleSubmit}
          disabled={submitting}
          sx={{ ...PRIMARY_BUTTON_SX, mt: 0.5 }}
        >
          {submitting ? "찾는 중…" : "이메일 찾기"}
        </Button>
      </Stack>

      {result && (
        <Box
          sx={{
            mt: 1,
            p: 2,
            borderRadius: 3,
            background: palette.primaryTint,
            border: `1px solid ${palette.primarySoft}`,
          }}
        >
          <Typography sx={{ fontSize: 12.5, color: palette.inkMute, fontWeight: 700 }}>
            가입된 이메일
          </Typography>
          <Typography
            sx={{
              fontSize: 18,
              fontWeight: 800,
              color: palette.primaryDark,
              mt: 0.5,
              letterSpacing: "-0.01em",
            }}
          >
            {result.email}
          </Typography>
          {result.createdAt && (
            <Typography sx={{ fontSize: 12, color: palette.inkSubtle, mt: 1 }}>
              가입일: {new Date(result.createdAt).toLocaleDateString()}
            </Typography>
          )}
          <Stack direction="row" gap={1} sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => router.push("/login")}
              sx={{ flex: 1 }}
            >
              로그인하러 가기
            </Button>
            <Button
              size="small"
              onClick={() => router.push("/find-account?tab=password")}
              sx={{ flex: 1 }}
            >
              비밀번호 찾기
            </Button>
          </Stack>
        </Box>
      )}

      {notFound && (
        <Box
          sx={{
            mt: 1,
            p: 2,
            borderRadius: 3,
            background: palette.warnSoft,
            border: `1px solid ${palette.warn}55`,
          }}
        >
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: palette.warn }}>
            일치하는 계정을 찾을 수 없어요.
          </Typography>
          <Typography sx={{ fontSize: 12.5, color: palette.inkMute, mt: 0.5 }}>
            휴대폰 번호가 정확한지 확인해주세요. 가입 시 입력하지 않았다면
            이메일을 직접 입력해 로그인을 시도해보세요.
          </Typography>
        </Box>
      )}
    </Stack>
  );
}

// ── 비밀번호 찾기 ────────────────────────────────────────────────────────────
function ResetPasswordForm() {
  const toast = useToast();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  // 메일 링크 클릭 시 도착할 redirect URL — /auth/callback 이 code 교환 후 next 로 보낸다
  const redirectTo = useMemo(() => {
    if (typeof window === "undefined") return "";
    const u = new URL("/auth/callback", window.location.origin);
    u.searchParams.set("next", "/reset-password");
    return u.toString();
  }, []);

  const handleSubmit = async () => {
    if (submitting) return;
    if (!email.includes("@")) {
      toast?.show("이메일 주소를 확인해주세요");
      return;
    }
    if (!isSupabaseConfigured) {
      toast?.show("Supabase 환경변수가 없어 비밀번호 재설정을 사용할 수 없어요");
      return;
    }
    setSubmitting(true);
    const { error } = await supabaseBrowser().auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    setSubmitting(false);
    if (error) {
      // 보안: 존재 여부를 노출하지 않으려면 항상 sent 상태로 두는 편이 안전.
      // 여기서는 사용자 디버깅 편의를 위해 에러는 토스트로만 안내하고 sent 표시는 띄운다.
      toast?.show(error.message);
    }
    setSent(true);
  };

  if (sent) {
    return (
      <Stack gap={2}>
        <Box>
          <Typography
            sx={{
              fontSize: 11.5,
              fontWeight: 800,
              letterSpacing: "0.18em",
              color: palette.primary,
              mb: 1.25,
            }}
          >
            CHECK YOUR INBOX
          </Typography>
          <Typography sx={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.3 }}>
            메일을 보냈어요.
          </Typography>
          <Typography sx={{ fontSize: 14, color: palette.inkMute, mt: 1, lineHeight: 1.6 }}>
            <strong style={{ color: palette.ink }}>{email}</strong> 으로 비밀번호
            재설정 링크를 보냈어요. 메일이 보이지 않으면 스팸함도 확인해주세요.
          </Typography>
        </Box>
        <Button onClick={() => router.push("/login")} sx={PRIMARY_BUTTON_SX}>
          로그인 화면으로
        </Button>
        <Button
          variant="text"
          onClick={() => {
            setSent(false);
            setEmail("");
          }}
          sx={{ color: palette.inkMute }}
        >
          다른 이메일로 다시 보내기
        </Button>
      </Stack>
    );
  }

  return (
    <Stack gap={2}>
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
          RESET PASSWORD
        </Typography>
        <Typography sx={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.3 }}>
          가입한 이메일을 입력하면
          <br />
          재설정 링크를 보내드려요.
        </Typography>
        <Typography sx={{ fontSize: 13, color: palette.inkMute, mt: 1 }}>
          링크는 발송 후 1시간 동안 유효해요.
        </Typography>
      </Box>

      <Stack gap={1.25}>
        <OutlinedInput
          fullWidth
          placeholder="이메일 주소"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={INPUT_SX}
          onKeyDown={(e) => {
            if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
            e.preventDefault();
            handleSubmit();
          }}
        />
        <Button
          fullWidth
          onClick={handleSubmit}
          disabled={submitting}
          sx={{ ...PRIMARY_BUTTON_SX, mt: 0.5 }}
        >
          {submitting ? "보내는 중…" : "재설정 메일 보내기"}
        </Button>
      </Stack>
    </Stack>
  );
}
