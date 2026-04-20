"use client";

import {
  Box,
  Button,
  Checkbox,
  Chip,
  IconButton,
  LinearProgress,
  OutlinedInput,
  Stack,
  Typography,
} from "@mui/material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import AppHeader from "@/components/ui/AppHeader";
import { ScrollBody, FixedFooter } from "@/components/ui/Section";
import { palette } from "@/lib/theme";
import { useToast } from "@/components/ui/ToastProvider";

const GENRES = ["소설", "에세이", "자기계발", "경제/경영", "역사", "과학", "아동", "만화"];
const TERMS = [
  { key: "tos", label: "이용약관 동의", required: true },
  { key: "privacy", label: "개인정보 처리방침 동의", required: true },
  { key: "age", label: "만 14세 이상입니다", required: true },
  { key: "marketing", label: "마케팅 정보 수신 동의", required: false },
];

export default function SignupPage() {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [phone, setPhone] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [agreed, setAgreed] = useState<string[]>([]);

  const togglePick = (g: string) =>
    setPicked((p) => (p.includes(g) ? p.filter((x) => x !== g) : [...p, g]));
  const toggleAgree = (k: string) =>
    setAgreed((a) => (a.includes(k) ? a.filter((x) => x !== k) : [...a, k]));
  const allRequired = TERMS.filter((t) => t.required).every((t) =>
    agreed.includes(t.key)
  );

  const stepValid = useMemo(() => {
    if (step === 0)
      return (
        name.length > 1 &&
        email.includes("@") &&
        pw.length >= 8 &&
        pw === pw2 &&
        phone.length >= 9
      );
    if (step === 1) return picked.length > 0;
    return allRequired;
  }, [step, name, email, pw, pw2, phone, picked, allRequired]);

  const goNext = () => {
    if (step < 2) setStep(step + 1);
    else {
      toast?.show("가입을 환영해요!");
      router.push("/home");
    }
  };

  return (
    <>
      <AppHeader
        title="회원가입"
        left="back"
        right={
          <Typography sx={{ fontSize: 12, color: palette.inkSubtle }}>
            {step + 1} / 3
          </Typography>
        }
      />
      <Box sx={{ px: 2.5, pt: 1.5 }}>
        <LinearProgress
          variant="determinate"
          value={((step + 1) / 3) * 100}
          sx={{
            height: 6,
            borderRadius: 999,
            background: palette.lineSoft,
            "& .MuiLinearProgress-bar": {
              background: palette.primary,
              borderRadius: 999,
            },
          }}
        />
      </Box>
      <ScrollBody sx={{ p: 2.5 }}>
        {step === 0 && (
          <Stack gap={2}>
            <Box>
              <Typography sx={{ fontSize: 22, fontWeight: 800, lineHeight: 1.3 }}>
                계정 정보를
                <br />
                입력해주세요
              </Typography>
            </Box>
            <Field label="이름">
              <OutlinedInput
                fullWidth
                placeholder="실명"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field label="이메일">
              <OutlinedInput
                fullWidth
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label="비밀번호" hint="영문/숫자 조합 8자 이상">
              <OutlinedInput
                fullWidth
                type={show ? "text" : "password"}
                placeholder="비밀번호"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                endAdornment={
                  <IconButton size="small" onClick={() => setShow((s) => !s)}>
                    {show ? (
                      <VisibilityOffOutlinedIcon fontSize="small" />
                    ) : (
                      <VisibilityOutlinedIcon fontSize="small" />
                    )}
                  </IconButton>
                }
              />
            </Field>
            <Field
              label="비밀번호 확인"
              error={pw2.length > 0 && pw !== pw2 ? "비밀번호가 달라요" : undefined}
            >
              <OutlinedInput
                fullWidth
                type="password"
                placeholder="비밀번호 재입력"
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
              />
            </Field>
            <Field label="휴대폰 번호">
              <OutlinedInput
                fullWidth
                placeholder="01012345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </Field>
          </Stack>
        )}
        {step === 1 && (
          <Stack gap={2}>
            <Box>
              <Typography sx={{ fontSize: 22, fontWeight: 800, lineHeight: 1.3 }}>
                좋아하는 장르를
                <br />
                알려주세요
              </Typography>
              <Typography sx={{ fontSize: 13, color: palette.inkMute, mt: 1 }}>
                관심 분야의 책을 먼저 추천해드릴게요. (1개 이상)
              </Typography>
            </Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {GENRES.map((g) => {
                const on = picked.includes(g);
                return (
                  <Chip
                    key={g}
                    label={g}
                    onClick={() => togglePick(g)}
                    variant={on ? "filled" : "outlined"}
                    sx={{
                      fontSize: 13.5,
                      height: 38,
                      px: 1.5,
                      ...(on && {
                        background: palette.primary,
                        color: "#fff",
                      }),
                    }}
                  />
                );
              })}
            </Box>
          </Stack>
        )}
        {step === 2 && (
          <Stack gap={2}>
            <Box>
              <Typography sx={{ fontSize: 22, fontWeight: 800, lineHeight: 1.3 }}>
                약관에 동의하고
                <br />
                마무리해요
              </Typography>
            </Box>
            <Stack
              gap={0.5}
              sx={{
                background: palette.surface,
                border: `1px solid ${palette.line}`,
                borderRadius: 3,
                p: 1,
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                onClick={() =>
                  setAgreed(
                    agreed.length === TERMS.length ? [] : TERMS.map((t) => t.key)
                  )
                }
                sx={{
                  px: 1.5,
                  py: 1.25,
                  borderRadius: 2,
                  cursor: "pointer",
                  "&:hover": { background: palette.lineSoft },
                }}
              >
                <Checkbox
                  checked={agreed.length === TERMS.length}
                  sx={{ p: 0.5, mr: 1 }}
                />
                <Typography sx={{ fontWeight: 800 }}>전체 동의</Typography>
              </Stack>
              <Box sx={{ height: 1, background: palette.line, mx: 1 }} />
              {TERMS.map((t) => (
                <Stack
                  key={t.key}
                  direction="row"
                  alignItems="center"
                  onClick={() => toggleAgree(t.key)}
                  sx={{
                    px: 1.5,
                    py: 1.1,
                    cursor: "pointer",
                    "&:hover": { background: palette.lineSoft },
                  }}
                >
                  <Checkbox
                    checked={agreed.includes(t.key)}
                    sx={{ p: 0.5, mr: 1 }}
                  />
                  <Typography sx={{ flex: 1, fontSize: 14 }}>
                    {t.label}{" "}
                    <span
                      style={{
                        color: t.required ? palette.primary : palette.inkSubtle,
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      [{t.required ? "필수" : "선택"}]
                    </span>
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Stack>
        )}
      </ScrollBody>
      <FixedFooter>
        <Button
          variant="contained"
          fullWidth
          disabled={!stepValid}
          onClick={goNext}
          startIcon={step === 2 ? <CheckRoundedIcon /> : undefined}
        >
          {step === 2 ? "가입 완료" : "다음"}
        </Button>
      </FixedFooter>
    </>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <Box>
      <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: palette.inkMute, mb: 0.75 }}>
        {label}
      </Typography>
      {children}
      {(hint || error) && (
        <Typography
          sx={{
            fontSize: 11.5,
            mt: 0.5,
            color: error ? palette.accent : palette.inkSubtle,
          }}
        >
          {error ?? hint}
        </Typography>
      )}
    </Box>
  );
}
