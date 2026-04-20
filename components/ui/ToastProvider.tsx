"use client";

import { Snackbar, Alert, type AlertColor } from "@mui/material";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

interface ToastApi {
  show: (msg: string, severity?: AlertColor) => void;
}

const ToastCtx = createContext<ToastApi | null>(null);

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
