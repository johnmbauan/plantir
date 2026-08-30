import { Accordion, Alert, Anchor, Divider, List, Stack, Text, ThemeIcon } from "@mantine/core";
import { IconBrandTelegram, IconBulb, IconDeviceFloppy, IconSend, IconUser, IconUsersGroup } from "@tabler/icons-react";
import { Trans, useTranslation } from "react-i18next";

export default function TelegramSetupAccordion() {
  const { t } = useTranslation();

  return (
    <Accordion variant="contained" radius="md">
      <Accordion.Item value="setup">
        <Accordion.Control icon={<IconBrandTelegram size={18} />}>
          <Text size="sm" fw={500}>{t("telegramSetup.accordionTitle")}</Text>
        </Accordion.Control>
        <Accordion.Panel>
          <Alert
            mb="md"
            variant="light"
            color="blue"
            icon={<IconBulb size={16} />}
            title={t("telegramSetup.webTipTitle")}
          >
            <Text size="sm">
              <Trans
                i18nKey="telegramSetup.webTipBody"
                components={{
                  web: (
                    <Anchor
                      href="https://web.telegram.org/"
                      target="_blank"
                      rel="noopener noreferrer"
                      size="sm"
                      underline="always"
                    />
                  ),
                }}
              />
            </Text>
          </Alert>

          <List spacing="md" size="sm" center>
            <List.Item
              icon={
                <ThemeIcon radius="xl" size="md" color="var(--green-700)" variant="light">
                  <IconUser size={14} />
                </ThemeIcon>
              }
            >
              <Stack gap={2}>
                <Text size="sm" fw={500}>{t("telegramSetup.step1Title")}</Text>
                <Text size="sm" c="dimmed">
                  <Trans
                    i18nKey="telegramSetup.step1Body"
                    components={{
                      link: (
                        <Anchor
                          href="https://t.me/userinfobot"
                          target="_blank"
                          rel="noopener noreferrer"
                          size="sm"
                        />
                      ),
                      bold: <strong />,
                    }}
                  />
                </Text>
              </Stack>
            </List.Item>

            <List.Item
              icon={
                <ThemeIcon radius="xl" size="md" color="var(--green-700)" variant="light">
                  <IconSend size={14} />
                </ThemeIcon>
              }
            >
              <Stack gap={2}>
                <Text size="sm" fw={500}>{t("telegramSetup.step2Title")}</Text>
                <Text size="sm" c="dimmed">
                  <Trans
                    i18nKey="telegramSetup.step2Body"
                    components={{
                      link: (
                        <Anchor
                          href="https://t.me/PlantirAlert_bot"
                          target="_blank"
                          rel="noopener noreferrer"
                          size="sm"
                        />
                      ),
                      bold: <strong />,
                    }}
                  />
                </Text>
              </Stack>
            </List.Item>

            <List.Item
              icon={
                <ThemeIcon radius="xl" size="md" color="var(--green-700)" variant="light">
                  <IconDeviceFloppy size={14} />
                </ThemeIcon>
              }
            >
              <Stack gap={2}>
                <Text size="sm" fw={500}>{t("telegramSetup.step3Title")}</Text>
                <Text size="sm" c="dimmed">
                  {t("telegramSetup.step3Body")}
                </Text>
              </Stack>
            </List.Item>
          </List>

          <Divider my="md" />

          <List spacing="xs" size="sm" center>
            <List.Item
              icon={
                <ThemeIcon radius="xl" size="md" color="var(--green-700)" variant="light">
                  <IconUsersGroup size={14} />
                </ThemeIcon>
              }
            >
              <Stack gap={2}>
                <Text size="sm" fw={500}>{t("telegramSetup.groupTitle")}</Text>
                <Text size="sm" c="dimmed">
                  <Trans
                    i18nKey="telegramSetup.groupBody"
                    components={{
                      link: (
                        <Anchor
                          href="https://t.me/PlantirAlert_bot"
                          target="_blank"
                          rel="noopener noreferrer"
                          size="sm"
                        />
                      ),
                      userinfobot: (
                        <Anchor
                          href="https://t.me/userinfobot"
                          target="_blank"
                          rel="noopener noreferrer"
                          size="sm"
                        />
                      ),
                    }}
                  />
                </Text>
              </Stack>
            </List.Item>
          </List>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
}
