import type { ReactNode } from "react";
import { Box, Stack } from "@mantine/core";

interface AdminTabLayoutProps {
  header: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export function AdminTabLayout({ header, children, footer }: AdminTabLayoutProps) {
  return (
    <Stack
      gap="md"
      style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
      }}
    >
      {header}
      <Box style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
        {children}
      </Box>
      {footer != null && (
        <Box
          py="sm"
          style={{
            flexShrink: 0,
            marginTop: "auto",
            position: "sticky",
            bottom: 0,
            background: "var(--surface)",
            borderTop: "1px solid var(--terracotta-100)",
            zIndex: 2,
          }}
        >
          {footer}
        </Box>
      )}
    </Stack>
  );
}
