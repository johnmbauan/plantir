import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Paper, TextInput, Button, Title, Text, Stack, Center, Anchor } from "@mantine/core";
import { useAuth } from "@/context/AuthContext";
import supabase from "@/supabase";
import { needsPasswordSetup } from "@/pages/password/password-helper";
import { getErrorMessage } from "@/utils/error";

function getResetPasswordRedirectUrl(): string {
  return `${window.location.origin}/reset-password`;
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { session, user, loading } = useAuth();
  const authUser = user ?? session?.user;
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

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
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getResetPasswordRedirectUrl(),
      });
      if (resetError) throw resetError;
      setSubmitted(true);
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
              {submitted
                ? "Check your email for a password reset link."
                : "Enter your email and we'll send you a reset link."}
            </Text>
          </Stack>

          {error && (
            <Text size="sm" c="red">
              {error}
            </Text>
          )}

          {submitted ? (
            <Text size="sm" c="dimmed">
              If an account exists for that email, you will receive a link shortly. The link expires in 1 hour.
            </Text>
          ) : (
            <TextInput
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              required
              autoComplete="email"
            />
          )}

          {!submitted && (
            <Button type="submit" loading={submitting} fullWidth mt="xs">
              Send reset link
            </Button>
          )}

          <Anchor component={Link} to="/login" size="sm" ta="center">
            Back to sign in
          </Anchor>
        </Stack>
      </Paper>
    </Center>
  );
}
