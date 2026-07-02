import { Accordion, Anchor, List, Stack, Text, ThemeIcon } from "@mantine/core";
import { IconBrandTelegram, IconDeviceFloppy, IconSend, IconUser } from "@tabler/icons-react";

export default function TelegramSetupAccordion() {
  return (
    <Accordion variant="contained" radius="md" mb="lg">
      <Accordion.Item value="setup">
        <Accordion.Control icon={<IconBrandTelegram size={18} />}>
          <Text size="sm" fw={500}>How to set up Telegram notifications</Text>
        </Accordion.Control>
        <Accordion.Panel>
          <List spacing="md" size="sm" center>
            <List.Item
              icon={
                <ThemeIcon radius="xl" size="md" color="var(--green-700)" variant="light">
                  <IconUser size={14} />
                </ThemeIcon>
              }
            >
              <Stack gap={2}>
                <Text size="sm" fw={500}>Find your Chat ID</Text>
                <Text size="sm" c="dimmed">
                  Open Telegram and search for{" "}
                  <Anchor
                    href="https://t.me/userinfobot"
                    target="_blank"
                    rel="noopener noreferrer"
                    size="sm"
                  >
                    @userinfobot
                  </Anchor>
                  . Tap <strong>Start</strong> — it will immediately reply with your numeric Chat ID (e.g. <code>123456789</code>).
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
                <Text size="sm" fw={500}>Start a conversation with the Plantir bot</Text>
                <Text size="sm" c="dimmed">
                  Search for{" "}
                  <Anchor
                    href="https://t.me/PlantirAlert_bot"
                    target="_blank"
                    rel="noopener noreferrer"
                    size="sm"
                  >
                    @PlantirAlert_bot
                  </Anchor>{" "}
                  in Telegram and tap <strong>Start</strong>. This is required so Telegram allows the bot to send you messages.
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
                <Text size="sm" fw={500}>Enter your Chat ID below and save</Text>
                <Text size="sm" c="dimmed">
                  Paste the number from Step 1 into the <strong>Telegram Chat ID</strong> field, pick your preferred notification time, and hit <strong>Save</strong>.
                </Text>
              </Stack>
            </List.Item>
          </List>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
}
