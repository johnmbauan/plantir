import { Stack, Text, List, ThemeIcon } from "@mantine/core";
import { IconCpu, IconWifi, IconClipboard, IconBox, IconHourglass } from "@tabler/icons-react";
import wifiPortalHome from "@/assets/wifi-portal-home.png";
import wifiPortalConfigure from "@/assets/wifi-portal-configure.png";

const portalImageStyle: React.CSSProperties = {
  maxWidth: 260,
  borderRadius: 8,
  border: "1px solid var(--mantine-color-gray-3)",
};

export default function ConnectStep() {
  return (
    <Stack gap="sm" mt="md">
      <Text fw={600}>Connect to device hotspot</Text>
      <List spacing="sm" size="sm" center>
        <List.Item
          icon={
            <ThemeIcon radius="xl" size="sm" color="var(--green-700)" variant="light">
              <IconClipboard size={14} />
            </ThemeIcon>
          }
        >
          Make sure the setup code from the previous step is copied.
        </List.Item>
        <List.Item
          icon={
            <ThemeIcon radius="xl" size="sm" color="var(--green-700)" variant="light">
              <IconBox size={14} />
            </ThemeIcon>
          }
        >
          Open the cap of the device.
        </List.Item>
        <List.Item
          icon={
            <ThemeIcon radius="xl" size="sm" color="var(--green-700)" variant="light">
              <IconCpu size={14} />
            </ThemeIcon>
          }
        >
          Press the <strong>RESTART</strong> button on the side of the device. After you press it, the chip inside the Plantir device will light a green LED three times in a row. The device will then open a Wi-Fi hotspot named <strong>Plantir-Device-Setup</strong>.
        </List.Item>
        <List.Item
          icon={
            <ThemeIcon radius="xl" size="sm" color="var(--green-700)" variant="light">
              <IconWifi size={14} />
            </ThemeIcon>
          }
        >
          On your phone or computer, connect to <strong>Plantir-Device-Setup</strong>. A portal will open automatically — it should look like this:
        </List.Item>
      </List>
      <img src={wifiPortalHome} alt="WiFi portal home screen" style={portalImageStyle} />
      <List spacing="sm" size="sm" center>
        <List.Item
          icon={
            <ThemeIcon radius="xl" size="sm" color="var(--green-700)" variant="light">
              <IconWifi size={14} />
            </ThemeIcon>
          }
        >
          Tap <strong>Configure WiFi</strong>, then select your home network, enter the password, paste the setup code into the <strong>Plantir Setup</strong> field, and tap <strong>Save</strong>:
        </List.Item>
      </List>
      <img src={wifiPortalConfigure} alt="WiFi portal configure screen" style={portalImageStyle} />
      <List spacing="sm" size="sm" center>
        <List.Item
          icon={
            <ThemeIcon radius="xl" size="sm" color="var(--green-700)" variant="light">
              <IconHourglass size={14} />
            </ThemeIcon>
          }
        >
          Wait for the <strong>Plantir-Device-Setup</strong> portal to close automatically.
        </List.Item>
      </List>
    </Stack>
  );
}
