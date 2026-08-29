import { Group, Text, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";

const MARK_HEIGHT = {
  header: 28,
  auth: 40,
} as const;

interface BrandLogoProps {
  variant?: keyof typeof MARK_HEIGHT;
}

export default function BrandLogo({ variant = "header" }: BrandLogoProps) {
  const { t } = useTranslation();
  const height = MARK_HEIGHT[variant];
  const width = Math.round(height * (212 / 222));
  const brand = t("common.brand");

  return (
    <Group gap={8} wrap="nowrap" align="center">
      <img
        src="/logo.svg"
        alt=""
        height={height}
        width={width}
        data-testid="brand-logo-mark"
        style={{ display: "block", flexShrink: 0 }}
      />
      {variant === "auth" ? (
        <Title order={2} c="var(--green-700)" style={{ letterSpacing: "-0.3px" }}>
          {brand}
        </Title>
      ) : (
        <Text fw={700} size="lg" c="var(--green-700)" style={{ letterSpacing: "-0.3px" }}>
          {brand}
        </Text>
      )}
    </Group>
  );
}
