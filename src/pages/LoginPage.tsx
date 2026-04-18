import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Paper, TextInput, PasswordInput, Button, Title, Text, Stack, Center } from "@mantine/core";
import supabase from "@/supabase";
import { getErrorMessage } from "@/utils/error";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate("/", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Center h="100svh">
      <Paper
        component="form"
        onSubmit={handleSubmit}
        shadow="sm"
        radius="md"
        p="xl"
        w={360}
        style={{ border: "1px solid var(--terracotta-100)" }}
      >
        <Stack gap="md">
          <Stack gap={4}>
            <Title order={2} c="var(--green-700)" style={{ letterSpacing: "-0.3px" }}>
              🪴 Plantir
            </Title>
            <Text size="sm" c="dimmed">
              Sign in to manage your plants
            </Text>
          </Stack>

          {error && (
            <Text size="sm" c="red">
              {error}
            </Text>
          )}

          <TextInput
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            required
            autoComplete="email"
          />

          <PasswordInput
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            required
            autoComplete="current-password"
          />

          <Button type="submit" loading={loading} fullWidth mt="xs">
            Sign in
          </Button>
        </Stack>
      </Paper>
    </Center>
  );
}
