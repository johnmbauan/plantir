import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Paper, PasswordInput, Button, Text, Stack, Center, Loader } from "@mantine/core";
import BrandLogo from "@/components/BrandLogo";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import supabase from "@/supabase";
import { DASHBOARD_PATH } from "@/constants/routes";
import {
  clearPendingPasswordSetup,
  needsPasswordSetup,
  validatePassword,
} from "@/pages/password/password-helper";
import { getErrorMessage } from "@/utils/error";
import { useNativeValidation } from "@/hooks/useNativeValidation";

export default function SetPasswordPage() {
  const { t } = useTranslation();
  const { requiredInputProps } = useNativeValidation();
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
        state: { message: t("auth.setPassword.inviteExpired") },
      });
      return;
    }

    if (!needsPasswordSetup(authUser)) {
      navigate(DASHBOARD_PATH, { replace: true });
    }
  }, [loading, session, authUser, navigate, t]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError(t("auth.setPassword.passwordsDoNotMatch"));
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
      navigate(DASHBOARD_PATH, { replace: true });
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
            <BrandLogo variant="auth" />
            <Text size="sm" c="dimmed">
              {t("auth.setPassword.subtitle")}
            </Text>
          </Stack>

          {error && (
            <Text size="sm" c="red">
              {error}
            </Text>
          )}

          <PasswordInput
            label={t("auth.setPassword.password")}
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            required
            autoComplete="new-password"
            {...requiredInputProps}
          />

          <PasswordInput
            label={t("auth.setPassword.confirmPassword")}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.currentTarget.value)}
            required
            autoComplete="new-password"
            {...requiredInputProps}
          />

          <Button type="submit" loading={submitting} fullWidth mt="xs">
            {t("auth.setPassword.submit")}
          </Button>
        </Stack>
      </Paper>
    </Center>
  );
}
