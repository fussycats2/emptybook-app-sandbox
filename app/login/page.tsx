"use client";

import {
  Box,
  Button,
  Collapse,
  Divider,
  IconButton,
  OutlinedInput,
  Stack,
  Typography,
} from "@mui/material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AppHeader from "@/components/ui/AppHeader";
import { palette } from "@/lib/theme";
import { useToast } from "@/components/ui/ToastProvider";

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [emailMode, setEmailMode] = useState(false);

  return (
    <>
      <AppHeader title="" left="back" bordered={false} />
      <Box sx={{ p: 3, pt: 1, display: "flex", flexDirection: "column", flex: 1 }}>
        <Box>
          <Typography sx={{ fontSize: 26, fontWeight: 800, lineHeight: 1.3 }}>
            다시 오신 걸
            <br />
            환영해요 👋
          </Typography>
          <Typography sx={{ fontSize: 14, color: palette.inkMute, mt: 1 }}>
            가장 빠른 방법으로 시작하세요.
          </Typography>
        </Box>

        <Stack gap={1.25} mt={4}>
          <Button
            fullWidth
            onClick={() => router.push("/home")}
            sx={{
              background: palette.kakao,
              color: palette.kakaoText,
              fontWeight: 800,
              minHeight: 52,
              "&:hover": { background: "#FFE000" },
            }}
          >
            카카오로 시작
          </Button>
          <Button
            fullWidth
            variant="outlined"
            sx={{ minHeight: 52 }}
            onClick={() => toast?.show("준비 중인 기능이에요")}
          >
            네이버로 시작
          </Button>
          <Button
            fullWidth
            variant="outlined"
            sx={{ minHeight: 52 }}
            onClick={() => toast?.show("준비 중인 기능이에요")}
          >
            Apple로 시작
          </Button>
        </Stack>

        <Divider sx={{ my: 3, color: palette.inkSubtle, fontSize: 12 }}>또는</Divider>

        <Button
          variant="text"
          endIcon={
            emailMode ? (
              <KeyboardArrowUpRoundedIcon />
            ) : (
              <KeyboardArrowDownRoundedIcon />
            )
          }
          onClick={() => setEmailMode((v) => !v)}
          sx={{ color: palette.inkMute, alignSelf: "center" }}
        >
          이메일로 로그인
        </Button>

        <Collapse in={emailMode} timeout={220}>
          <Stack gap={1.25} mt={2}>
            <OutlinedInput
              fullWidth
              placeholder="이메일 주소"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <OutlinedInput
              fullWidth
              placeholder="비밀번호"
              type={show ? "text" : "password"}
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
            <Button
              fullWidth
              onClick={() => router.push("/home")}
              sx={{ mt: 0.5 }}
            >
              로그인
            </Button>
            <Stack
              direction="row"
              justifyContent="center"
              gap={2}
              sx={{ fontSize: 12.5, color: palette.inkSubtle, mt: 1 }}
            >
              <span style={{ cursor: "pointer" }}>아이디 찾기</span>
              <span>|</span>
              <span style={{ cursor: "pointer" }}>비밀번호 찾기</span>
              <span>|</span>
              <span
                onClick={() => router.push("/signup")}
                style={{ color: palette.primary, fontWeight: 700, cursor: "pointer" }}
              >
                회원가입
              </span>
            </Stack>
          </Stack>
        </Collapse>
      </Box>
    </>
  );
}
