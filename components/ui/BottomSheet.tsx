"use client";

import { Box, Drawer, Typography } from "@mui/material";
import { palette } from "@/lib/theme";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  height?: number | string;
}

export default function BottomSheet({
  open,
  onClose,
  title,
  children,
  footer,
  height = "auto",
}: Props) {
  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          maxWidth: 420,
          mx: "auto",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          background: palette.surface,
          maxHeight: "85dvh",
          display: "flex",
          flexDirection: "column",
        },
      }}
      sx={{
        "& .MuiDrawer-paper": {
          width: { xs: "100%", md: 420 },
        },
      }}
    >
      <Box sx={{ display: "grid", placeItems: "center", pt: 1, pb: 0.5 }}>
        <Box
          sx={{
            width: 40,
            height: 4,
            borderRadius: 999,
            background: palette.line,
          }}
        />
      </Box>
      {title && (
        <Box sx={{ px: 2.5, py: 1.25 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 800 }}>{title}</Typography>
        </Box>
      )}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          px: 2.5,
          pb: 2,
          height,
        }}
      >
        {children}
      </Box>
      {footer && (
        <Box
          className="safe-bottom"
          sx={{
            borderTop: `1px solid ${palette.line}`,
            p: 1.5,
            background: palette.surface,
          }}
        >
          {footer}
        </Box>
      )}
    </Drawer>
  );
}
