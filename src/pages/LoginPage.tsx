import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Paper, TextInput, PasswordInput, Button, Title, Text, Stack, Center, Anchor } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { useNativeValidation } from "@/hooks/useNativeValidation";
import supabase from "@/supabase";
import { needsPasswordSetup } from "@/pages/password/password-helper";
import { getErrorMessage } from "@/utils/error";

export default function LoginPage() {
  const { t } = useTranslation();
  const { emailInputProps, requiredInputProps } = useNativeValidation();
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
              {t("common.brandWithEmoji")}
            </Title>
            <Text size="sm" c="dimmed">
              {t("auth.login.subtitle")}
            </Text>
          </Stack>

          {(inviteMessage || error) && (
            <Text size="sm" c={error ? "red" : "dimmed"}>
              {error ?? inviteMessage}
            </Text>
          )}

          <TextInput
            label={t("auth.login.email")}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            required
            autoComplete="email"
            {...emailInputProps}
          />

          <PasswordInput
            label={t("auth.login.password")}
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            required
            autoComplete="current-password"
            {...requiredInputProps}
          />

          <Button type="submit" loading={submitting} fullWidth mt="xs">
            {t("auth.login.signIn")}
          </Button>

          <Anchor component={Link} to="/forgot-password" size="sm" ta="center">
            {t("auth.login.forgotPassword")}
          </Anchor>
        </Stack>
      </Paper>
    </Center>
  );
}
