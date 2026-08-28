import { Stack, Text, List, ThemeIcon } from "@mantine/core";
import { IconCpu, IconWifi, IconClipboard, IconBox, IconHourglass } from "@tabler/icons-react";
import { Trans, useTranslation } from "react-i18next";
import wifiPortalHome from "@/assets/wifi-portal-home.png";
import wifiPortalConfigure from "@/assets/wifi-portal-configure.png";

const portalImageStyle: React.CSSProperties = {
  maxWidth: 260,
  borderRadius: 8,
  border: "1px solid var(--mantine-color-gray-3)",
};

export default function ConnectStep() {
  const { t } = useTranslation();
  return (
    <Stack gap="sm" mt="md">
      <Text fw={600}>{t("registrationWizard.connect.title")}</Text>
      <List spacing="sm" size="sm" center>
        <List.Item
          icon={
            <ThemeIcon radius="xl" size="sm" color="var(--green-700)" variant="light">
              <IconClipboard size={14} />
            </ThemeIcon>
          }
        >
          {t("registrationWizard.connect.copyCodeFirst")}
        </List.Item>
        <List.Item
          icon={
            <ThemeIcon radius="xl" size="sm" color="var(--green-700)" variant="light">
              <IconBox size={14} />
            </ThemeIcon>
          }
        >
          {t("registrationWizard.connect.openCap")}
        </List.Item>
        <List.Item
          icon={
            <ThemeIcon radius="xl" size="sm" color="var(--green-700)" variant="light">
              <IconCpu size={14} />
            </ThemeIcon>
          }
        >
          <Trans i18nKey="registrationWizard.connect.pressRestart" components={{ bold: <strong /> }} />
        </List.Item>
        <List.Item
          icon={
            <ThemeIcon radius="xl" size="sm" color="var(--green-700)" variant="light">
              <IconWifi size={14} />
            </ThemeIcon>
          }
        >
          <Trans i18nKey="registrationWizard.connect.connectHotspot" components={{ bold: <strong /> }} />
        </List.Item>
      </List>
      <img src={wifiPortalHome} alt={t("registrationWizard.connect.portalHomeAlt")} style={portalImageStyle} />
      <List spacing="sm" size="sm" center>
        <List.Item
          icon={
            <ThemeIcon radius="xl" size="sm" color="var(--green-700)" variant="light">
              <IconWifi size={14} />
            </ThemeIcon>
          }
        >
          <Trans i18nKey="registrationWizard.connect.configureWifi" components={{ bold: <strong /> }} />
        </List.Item>
      </List>
      <img src={wifiPortalConfigure} alt={t("registrationWizard.connect.portalConfigureAlt")} style={portalImageStyle} />
      <List spacing="sm" size="sm" center>
        <List.Item
          icon={
            <ThemeIcon radius="xl" size="sm" color="var(--green-700)" variant="light">
              <IconHourglass size={14} />
            </ThemeIcon>
          }
        >
          <Trans i18nKey="registrationWizard.connect.waitPortalClose" components={{ bold: <strong /> }} />
        </List.Item>
      </List>
    </Stack>
  );
}
