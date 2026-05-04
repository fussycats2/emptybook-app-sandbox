"use client";

// 확인/취소 두 버튼을 가진 모달 다이얼로그
// destructive=true 일 때는 위험한 작업(삭제 등)임을 강조하기 위해 빨간 톤으로 색을 바꾼다

import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Typography,
} from "@mui/material";
import { palette, radius } from "@/lib/theme";

interface Props {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "확인",
  cancelLabel = "취소",
  destructive,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      PaperProps={{
        sx: {
          borderRadius: `${radius.xl}px`,
          width: 340,
          maxWidth: "92vw",
          p: 1.25,
          boxShadow: "0 24px 60px rgba(26,38,32,0.24), 0 8px 24px rgba(26,38,32,0.12)",
        },
      }}
      sx={{
        "& .MuiBackdrop-root": {
          backgroundColor: "rgba(26, 38, 32, 0.45)",
          backdropFilter: "blur(2px)",
        },
      }}
    >
      <DialogTitle
        sx={{
          fontSize: 18,
          fontWeight: 800,
          letterSpacing: "-0.025em",
          pb: 0.5,
          pt: 2.5,
        }}
      >
        {title}
      </DialogTitle>
      {description && (
        <DialogContent sx={{ pt: 0.5 }}>
          <Typography sx={{ fontSize: 14, color: palette.inkMute, lineHeight: 1.65 }}>
            {description}
          </Typography>
        </DialogContent>
      )}
      <DialogActions sx={{ px: 2, pb: 2.25, gap: 1 }}>
        <Button variant="outlined" fullWidth onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button
          fullWidth
          onClick={onConfirm}
          sx={{
            background: destructive ? palette.accent : palette.primary,
            "&:hover": {
              background: destructive ? palette.accentDark : palette.primaryDark,
            },
          }}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
