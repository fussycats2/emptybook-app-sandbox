"use client";

// 설정 페이지 (/mypage/settings)
// 프로필/계정/알림/개인정보/기타 섹션과 로그아웃·탈퇴 버튼
// - 프로필 정보(표시이름/사용자명/전화번호) 는 updateMyProfile 로 저장
// - 알림/개인정보 토글은 updateAppPrefs (app_prefs jsonb) 로 즉시 반영 (debounce 없이 fire-and-forget)
// - 이메일 변경/비번 변경/연동/본인인증 행은 여전히 placeholder

import {
  Box,
  Button,
  OutlinedInput,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import KeyboardArrowRightRoundedIcon from "@mui/icons-material/KeyboardArrowRightRounded";
import { useEffect, useState } from "react";
import AppHeader from "@/components/ui/AppHeader";
import { ScrollBody } from "@/components/ui/Section";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { palette } from "@/lib/theme";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import { useAuth } from "@/lib/auth/AuthProvider";
import { withDefaultPrefs } from "@/lib/repo";
import {
  useMyProfile,
  useUpdateAppPrefs,
  useUpdateMyProfile,
} from "@/lib/query/profileHooks";

const ACCOUNT_PLACEHOLDER = [
  { label: "비밀번호 변경" },
  { label: "연동 계정", value: "Kakao" },
  { label: "본인 인증", value: "완료" },
];

const ETC: { label: string; value?: string; info?: boolean }[] = [
  { label: "이용 약관" },
  { label: "개인정보 처리방침" },
  { label: "오픈소스 라이선스" },
  { label: "앱 버전", value: "1.2.3", info: true },
];

// 알림/개인정보 토글 — key 는 AppPrefs 의 push/privacy 자식 키와 1:1
const PUSH_ITEMS: { key: "all" | "chat" | "trade" | "marketing"; label: string }[] = [
  { key: "all", label: "푸시 알림" },
  { key: "chat", label: "채팅 알림" },
  { key: "trade", label: "거래 알림" },
  { key: "marketing", label: "마케팅 알림" },
];
const PRIVACY_ITEMS: {
  key: "location" | "wishlist_public" | "trades_public";
  label: string;
}[] = [
  { key: "location", label: "위치 정보 사용" },
  { key: "wishlist_public", label: "관심 도서 공개" },
  { key: "trades_public", label: "거래 내역 공개" },
];

export default function SettingsPage() {
  const router = useRouter();
  const toast = useToast();
  const { user, signOut } = useAuth();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // React Query — 프로필 단일 캐시. settings 저장 시 mypage 도 자동 invalidate
  const { data: profile } = useMyProfile();
  const updateProfile = useUpdateMyProfile();
  const updateAppPrefsMutation = useUpdateAppPrefs();
  const savingProfile = updateProfile.isPending;

  // 프로필 입력 폼 — 서버에서 받아온 값으로 한 번 시드
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [original, setOriginal] = useState({
    displayName: "",
    username: "",
    phone: "",
  });
  const [push, setPush] = useState(withDefaultPrefs().push);
  const [privacy, setPrivacy] = useState(withDefaultPrefs().privacy);

  // profile 캐시가 들어오면 폼 한 번 시드 (이후 사용자가 입력하는 동안엔 덮지 않음)
  useEffect(() => {
    if (!profile) return;
    const dn = profile.display_name ?? "";
    const un = profile.username ?? "";
    const ph = profile.phone ?? "";
    setDisplayName(dn);
    setUsername(un);
    setPhone(ph);
    setOriginal({ displayName: dn, username: un, phone: ph });
    const prefs = withDefaultPrefs(profile.app_prefs);
    setPush(prefs.push);
    setPrivacy(prefs.privacy);
  }, [profile]);

  // 변경된 항목이 하나라도 있을 때만 저장 버튼 활성화
  const profileDirty =
    displayName !== original.displayName ||
    username !== original.username ||
    phone !== original.phone;

  const handleSaveProfile = async () => {
    if (savingProfile || !profileDirty) return;
    const res = await updateProfile.mutateAsync({
      display_name: displayName,
      username,
      phone,
    });
    if (res.uniqueViolation) {
      toast?.show("이미 사용 중인 사용자명이에요", "warning");
    } else if (res.ok) {
      toast?.show("프로필을 저장했어요");
      setOriginal({ displayName, username, phone });
    } else {
      toast?.show("저장에 실패했어요. 잠시 후 다시 시도해주세요.", "error");
    }
  };

  // 토글 변경 → mutation 호출. 실패해도 UI 는 새 상태 유지 (낙관적)
  const togglePush = (key: typeof PUSH_ITEMS[number]["key"], v: boolean) => {
    setPush((prev) => ({ ...prev, [key]: v }));
    updateAppPrefsMutation.mutate({ push: { [key]: v } });
  };
  const togglePrivacy = (
    key: typeof PRIVACY_ITEMS[number]["key"],
    v: boolean
  ) => {
    setPrivacy((prev) => ({ ...prev, [key]: v }));
    updateAppPrefsMutation.mutate({ privacy: { [key]: v } });
  };

  return (
    <>
      <AppHeader title="설정" left="back" />
      <ScrollBody>
        <Group title="프로필 정보">
          <Box sx={{ p: 1.5 }}>
            <Stack gap={1}>
              <Field
                label="표시 이름"
                placeholder="이웃에게 보여질 이름"
                value={displayName}
                onChange={setDisplayName}
              />
              <Field
                label="사용자명"
                placeholder="영문/숫자 (예: bookworm)"
                value={username}
                onChange={setUsername}
              />
              <Field
                label="전화번호"
                placeholder="010-1234-5678"
                value={phone}
                onChange={setPhone}
              />
              <Button
                onClick={handleSaveProfile}
                disabled={!profileDirty || savingProfile}
                sx={{ mt: 0.5 }}
              >
                {savingProfile ? "저장 중…" : "프로필 저장"}
              </Button>
            </Stack>
          </Box>
        </Group>

        <Group title="계정">
          <Row label="이메일" value={user?.email ?? "-"} first />
          {ACCOUNT_PLACEHOLDER.map((a) => (
            <Row
              key={a.label}
              label={a.label}
              value={a.value}
              onClick={() => toast?.show("준비 중인 기능이에요")}
            />
          ))}
        </Group>

        <Group title="알림">
          {PUSH_ITEMS.map((item, i) => (
            <Toggle
              key={item.key}
              label={item.label}
              checked={!!push[item.key]}
              first={i === 0}
              onChange={(v) => togglePush(item.key, v)}
            />
          ))}
        </Group>

        <Group title="개인정보 보호">
          {PRIVACY_ITEMS.map((item, i) => (
            <Toggle
              key={item.key}
              label={item.label}
              checked={!!privacy[item.key]}
              first={i === 0}
              onChange={(v) => togglePrivacy(item.key, v)}
            />
          ))}
        </Group>

        <Group title="기타">
          {ETC.map((a, i) => (
            <Row
              key={a.label}
              label={a.label}
              value={a.value}
              first={i === 0}
              onClick={
                a.info ? undefined : () => toast?.show("준비 중인 기능이에요")
              }
            />
          ))}
        </Group>

        <Stack sx={{ p: 2, pb: 4 }} gap={1}>
          <Button variant="outlined" onClick={() => setConfirmLogout(true)}>
            로그아웃
          </Button>
          <Button
            variant="text"
            onClick={() => setConfirmDelete(true)}
            sx={{ color: palette.inkSubtle, fontSize: 13 }}
          >
            계정 탈퇴
          </Button>
        </Stack>
      </ScrollBody>
      <ConfirmDialog
        open={confirmLogout}
        onCancel={() => setConfirmLogout(false)}
        onConfirm={async () => {
          setConfirmLogout(false);
          await signOut();
          toast?.show("로그아웃되었어요");
          router.replace("/login");
          router.refresh();
        }}
        title="로그아웃 할까요?"
        confirmLabel="로그아웃"
      />
      <ConfirmDialog
        open={confirmDelete}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          toast?.show("탈퇴 신청을 접수했어요");
          router.push("/");
        }}
        title="정말 탈퇴할까요?"
        description="탈퇴하면 거래 내역과 후기를 모두 잃게 돼요. 신중히 결정해 주세요."
        confirmLabel="탈퇴하기"
        destructive
      />
    </>
  );
}

// 한 섹션 묶음 — 제목 + 회색 배경 카드 안에 Row/Toggle 들을 모아 표시
function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box sx={{ p: 2 }}>
      <Typography
        sx={{
          fontSize: 12,
          fontWeight: 800,
          color: palette.inkSubtle,
          mb: 0.5,
          px: 0.5,
        }}
      >
        {title}
      </Typography>
      <Box
        sx={{
          background: palette.surface,
          border: `1px solid ${palette.line}`,
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

// 텍스트 입력 1행 — 레이블 + Outlined input
function Field({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Box>
      <Typography
        sx={{ fontSize: 11.5, fontWeight: 700, color: palette.inkSubtle, mb: 0.5 }}
      >
        {label}
      </Typography>
      <OutlinedInput
        fullWidth
        size="small"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </Box>
  );
}

// 텍스트 라벨 + 우측 값 + (선택) 상세이동 화살표 — 클릭 가능 여부는 onClick 유무로 판단
function Row({
  label,
  value,
  first,
  onClick,
}: {
  label: string;
  value?: string;
  first?: boolean;
  onClick?: () => void;
}) {
  const interactive = !!onClick;
  return (
    <Stack
      direction="row"
      alignItems="center"
      onClick={onClick}
      sx={{
        p: 1.5,
        borderTop: first ? "none" : `1px solid ${palette.line}`,
        cursor: interactive ? "pointer" : "default",
        "&:hover": interactive ? { background: palette.lineSoft } : {},
      }}
    >
      <Typography sx={{ flex: 1, fontSize: 14, fontWeight: 600 }}>
        {label}
      </Typography>
      {value && (
        <Typography sx={{ fontSize: 12.5, color: palette.inkSubtle, mr: interactive ? 1 : 0 }}>
          {value}
        </Typography>
      )}
      {interactive && (
        <KeyboardArrowRightRoundedIcon sx={{ color: palette.inkSubtle }} />
      )}
    </Stack>
  );
}

// 좌측 라벨 + 우측 스위치 — 알림/개인정보 ON/OFF 행에 사용
function Toggle({
  label,
  checked,
  first,
  onChange,
}: {
  label: string;
  checked: boolean;
  first?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      sx={{
        p: 1.25,
        pl: 1.5,
        borderTop: first ? "none" : `1px solid ${palette.line}`,
      }}
    >
      <Typography sx={{ flex: 1, fontSize: 14 }}>{label}</Typography>
      <Switch checked={checked} onChange={(_, v) => onChange(v)} />
    </Stack>
  );
}
