import { Stack, Text, Title } from "@mantine/core";
import type { ReactNode } from "react";

interface ModalSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function ModalSection({ title, description, children }: ModalSectionProps) {
  return (
    <Stack gap="xs">
      <Title order={6}>{title}</Title>
      {description && (
        <Text size="xs" c="dimmed">
          {description}
        </Text>
      )}
      {children}
    </Stack>
  );
}
