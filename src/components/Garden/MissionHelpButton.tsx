import { ActionIcon, Tooltip } from "@mantine/core";
import { IconQuestionMark } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

interface Props {
  onClick: () => void;
}

export default function MissionHelpButton({ onClick }: Props) {
  const { t } = useTranslation();

  return (
    <Tooltip label={t("garden.openHelp")}>
      <ActionIcon
        variant="subtle"
        color="gray"
        aria-label={t("garden.openHelp")}
        onClick={onClick}
        style={{ color: "var(--green-700)" }}
      >
        <IconQuestionMark size={20} />
      </ActionIcon>
    </Tooltip>
  );
}
