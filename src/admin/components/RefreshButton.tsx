import { ActionIcon, Tooltip } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

interface RefreshButtonProps {
  onClick: () => void;
  label: string;
}

export function RefreshButton({ onClick, label }: RefreshButtonProps) {
  const { t } = useTranslation();
  return (
    <Tooltip label={t("admin.refresh")} withArrow>
      <ActionIcon
        variant="subtle"
        color="gray"
        onClick={onClick}
        aria-label={label}
      >
        <IconRefresh size={16} />
      </ActionIcon>
    </Tooltip>
  );
}
