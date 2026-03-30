import { Center, Stack, Title, Text } from "@mantine/core";

export default function Admin() {
  return (
    <Center h="60vh">
      <Stack align="center" gap="xs">
        <Title order={2} c="var(--green-700)">
          Admin
        </Title>
        <Text c="var(--green-500)">Coming soon</Text>
      </Stack>
    </Center>
  );
}
