"use client";

// 화면 어디서든 짧은 안내 메시지(토스트)를 띄우는 Provider
// useToast() 훅으로 toast.show("문구") 호출만 하면 된다

import { Snackbar, Alert, type AlertColor } from "@mui/material";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

// 외부로 노출되는 API: 메시지 + (옵션)성공/에러/경고 등 심각도
interface ToastApi {
  show: (msg: string, severity?: AlertColor) => void;
}

const ToastCtx = createContext<ToastApi | null>(null);

// 호출 측에서 toast?.show(...) 형태로 안전하게 사용하도록 null 가능
export function useToast() {
  return useContext(ToastCtx);
}

export default function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [severity, setSeverity] = useState<AlertColor>("success");

  // 외부에서 호출되는 함수 — 메시지/심각도를 갱신하고 스낵바를 연다
  const show = useCallback((m: string, s: AlertColor = "success") => {
    setMsg(m);
    setSeverity(s);
    setOpen(true);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={2200}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{ bottom: { xs: 88, md: 96 } }}
      >
        <Alert
          variant="filled"
          severity={severity}
          onClose={() => setOpen(false)}
          sx={{
            borderRadius: 999,
            px: 2,
            fontWeight: 600,
            background: severity === "success" ? "#1A2B22" : undefined,
          }}
        >
          {msg}
        </Alert>
      </Snackbar>
    </ToastCtx.Provider>
  );
}
