import { ActionIcon, Tooltip } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

interface Props {
  onClick: () => void;
}

export default function MissionHelpButton({ onClick }: Props) {
  const { t } = useTranslation();

  return (
    <Tooltip label={t("garden.openHelp")}>
      <ActionIcon
        variant="light"
        color="gray"
        radius="xl"
        aria-label={t("garden.openHelp")}
        onClick={onClick}
        style={{ color: "var(--green-700)" }}
      >
        <IconInfoCircle size={18} />
      </ActionIcon>
    </Tooltip>
  );
}
