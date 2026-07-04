import { ActionIcon, Tooltip } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";

interface RefreshButtonProps {
  onClick: () => void;
  label: string;
}

export function RefreshButton({ onClick, label }: RefreshButtonProps) {
  return (
    <Tooltip label="Refresh" withArrow>
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
