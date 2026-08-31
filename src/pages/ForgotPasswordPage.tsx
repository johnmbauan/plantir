import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Paper, TextInput, Button, Text, Stack, Center, Anchor } from "@mantine/core";
import BrandLogo from "@/components/BrandLogo";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import supabase from "@/supabase";
import { DASHBOARD_PATH } from "@/constants/routes";
import { needsPasswordSetup } from "@/pages/password/password-helper";
import { getErrorMessage } from "@/utils/error";
import { useNativeValidation } from "@/hooks/useNativeValidation";

function getResetPasswordRedirectUrl(): string {
  return `${window.location.origin}/reset-password`;
}

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const { emailInputProps } = useNativeValidation();
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

    navigate(DASHBOARD_PATH, { replace: true });
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
            <BrandLogo variant="auth" />
            <Text size="sm" c="dimmed">
              {submitted
                ? t("auth.forgotPassword.subtitleSubmitted")
                : t("auth.forgotPassword.subtitle")}
            </Text>
          </Stack>

          {error && (
            <Text size="sm" c="red">
              {error}
            </Text>
          )}

          {submitted ? (
            <Text size="sm" c="dimmed">
              {t("auth.forgotPassword.submittedHint")}
            </Text>
          ) : (
            <TextInput
              label={t("auth.forgotPassword.email")}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              required
              autoComplete="email"
              {...emailInputProps}
            />
          )}

          {!submitted && (
            <Button type="submit" loading={submitting} fullWidth mt="xs">
              {t("auth.forgotPassword.sendResetLink")}
            </Button>
          )}

          <Anchor component={Link} to="/login" size="sm" ta="center">
            {t("auth.forgotPassword.backToSignIn")}
          </Anchor>
        </Stack>
      </Paper>
    </Center>
  );
}
