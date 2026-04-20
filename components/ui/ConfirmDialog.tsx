"use client";

import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Typography,
} from "@mui/material";
import { palette } from "@/lib/theme";

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
        sx: { borderRadius: 4, width: 320, maxWidth: "92vw", p: 1 },
      }}
    >
      <DialogTitle sx={{ fontSize: 17, fontWeight: 800, pb: 0.5 }}>
        {title}
      </DialogTitle>
      {description && (
        <DialogContent sx={{ pt: 0.5 }}>
          <Typography sx={{ fontSize: 14, color: palette.inkMute, lineHeight: 1.55 }}>
            {description}
          </Typography>
        </DialogContent>
      )}
      <DialogActions sx={{ px: 2, pb: 2, gap: 1 }}>
        <Button variant="outlined" fullWidth onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button
          fullWidth
          onClick={onConfirm}
          sx={{
            background: destructive ? palette.accent : palette.primary,
            "&:hover": {
              background: destructive ? "#E5564A" : palette.primaryDark,
            },
          }}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
