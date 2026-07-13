import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Paper, PasswordInput, Button, Title, Text, Stack, Center, Loader } from "@mantine/core";
import { useAuth } from "@/context/AuthContext";
import supabase from "@/supabase";
import {
  clearPendingPasswordSetup,
  needsPasswordSetup,
  validatePassword,
} from "@/pages/password/password-helper";
import { getErrorMessage } from "@/utils/error";

export default function SetPasswordPage() {
  const navigate = useNavigate();
  const { session, user, loading } = useAuth();
  const authUser = user ?? session?.user;
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;

    if (!session) {
      navigate("/login", {
        replace: true,
        state: { message: "Invite link expired or invalid." },
      });
      return;
    }

    if (!needsPasswordSetup(authUser)) {
      navigate("/", { replace: true });
    }
  }, [loading, session, authUser, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
        data: { needs_password_setup: false },
      });
      if (updateError) throw updateError;
      clearPendingPasswordSetup();
      navigate("/", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Center h="100svh">
        <Loader color="var(--green-500)" />
      </Center>
    );
  }

  if (!session || !needsPasswordSetup(authUser)) {
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
              Set your password to finish setting up your account. Use at least 8 characters with one uppercase letter and one number.
            </Text>
          </Stack>

          {error && (
            <Text size="sm" c="red">
              {error}
            </Text>
          )}

          <PasswordInput
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            required
            autoComplete="new-password"
          />

          <PasswordInput
            label="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.currentTarget.value)}
            required
            autoComplete="new-password"
          />

          <Button type="submit" loading={submitting} fullWidth mt="xs">
            Set password
          </Button>
        </Stack>
      </Paper>
    </Center>
  );
}
