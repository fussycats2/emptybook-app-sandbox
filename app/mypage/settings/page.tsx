"use client";

import {
  Box,
  Button,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import KeyboardArrowRightRoundedIcon from "@mui/icons-material/KeyboardArrowRightRounded";
import { useState } from "react";
import AppHeader from "@/components/ui/AppHeader";
import { ScrollBody } from "@/components/ui/Section";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { palette } from "@/lib/theme";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";

const ACCOUNT = [
  { label: "이메일 변경", value: "hong@email.com" },
  { label: "비밀번호 변경" },
  { label: "연동 계정", value: "Kakao" },
  { label: "본인 인증", value: "완료" },
];
const ETC = [
  { label: "이용 약관" },
  { label: "개인정보 처리방침" },
  { label: "오픈소스 라이선스" },
  { label: "앱 버전", value: "1.2.3" },
];

export default function SettingsPage() {
  const router = useRouter();
  const toast = useToast();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [push, setPush] = useState({
    "푸시 알림": true,
    "채팅 알림": true,
    "거래 알림": true,
    "마케팅 알림": false,
  });
  const [privacy, setPrivacy] = useState({
    "위치 정보 사용": true,
    "관심 도서 공개": false,
    "거래 내역 공개": true,
  });

  return (
    <>
      <AppHeader title="설정" left="back" />
      <ScrollBody>
        <Group title="계정">
          {ACCOUNT.map((a, i) => (
            <Row
              key={a.label}
              label={a.label}
              value={a.value}
              first={i === 0}
              onClick={() => toast?.show("준비 중인 기능이에요")}
            />
          ))}
        </Group>

        <Group title="알림">
          {Object.entries(push).map(([k, v], i) => (
            <Toggle
              key={k}
              label={k}
              checked={v}
              first={i === 0}
              onChange={(x) => setPush((p) => ({ ...p, [k]: x }))}
            />
          ))}
        </Group>

        <Group title="개인정보 보호">
          {Object.entries(privacy).map(([k, v], i) => (
            <Toggle
              key={k}
              label={k}
              checked={v}
              first={i === 0}
              onChange={(x) => setPrivacy((p) => ({ ...p, [k]: x }))}
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
              onClick={() => toast?.show("준비 중인 기능이에요")}
            />
          ))}
        </Group>

        <Stack sx={{ p: 2, pb: 4 }} gap={1}>
          <Button
            variant="outlined"
            onClick={() => setConfirmLogout(true)}
          >
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
        onConfirm={() => {
          setConfirmLogout(false);
          toast?.show("로그아웃되었어요");
          router.push("/");
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
  return (
    <Stack
      direction="row"
      alignItems="center"
      onClick={onClick}
      sx={{
        p: 1.5,
        borderTop: first ? "none" : `1px solid ${palette.line}`,
        cursor: onClick ? "pointer" : "default",
        "&:hover": { background: palette.lineSoft },
      }}
    >
      <Typography sx={{ flex: 1, fontSize: 14, fontWeight: 600 }}>
        {label}
      </Typography>
      {value && (
        <Typography sx={{ fontSize: 12.5, color: palette.inkSubtle, mr: 1 }}>
          {value}
        </Typography>
      )}
      <KeyboardArrowRightRoundedIcon sx={{ color: palette.inkSubtle }} />
    </Stack>
  );
}

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
