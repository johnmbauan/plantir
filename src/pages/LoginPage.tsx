import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Paper, TextInput, PasswordInput, Button, Title, Text, Stack, Center } from "@mantine/core";
import { useAuth } from "@/context/AuthContext";
import supabase from "@/supabase";
import { needsPasswordSetup } from "@/pages/password/password-helper";
import { getErrorMessage } from "@/utils/error";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, user, loading } = useAuth();
  const authUser = user ?? session?.user;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inviteMessage = (location.state as { message?: string } | null)?.message ?? null;

  useEffect(() => {
    if (loading || !session) return;

    if (needsPasswordSetup(authUser)) {
      navigate("/set-password", { replace: true });
      return;
    }

    navigate("/", { replace: true });
  }, [loading, session, authUser, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate("/", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || session) {
    return null;
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

          {(inviteMessage || error) && (
            <Text size="sm" c={error ? "red" : "dimmed"}>
              {error ?? inviteMessage}
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

          <Button type="submit" loading={submitting} fullWidth mt="xs">
            Sign in
          </Button>
        </Stack>
      </Paper>
    </Center>
  );
}
