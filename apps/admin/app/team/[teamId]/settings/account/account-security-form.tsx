"use client";

import { changePassword, twoFactor } from "@project-aqua/auth/client";
import { Button } from "@project-aqua/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@project-aqua/ui/components/field";
import { Input } from "@project-aqua/ui/components/input";
import { Separator } from "@project-aqua/ui/components/separator";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import QRCode from "react-qr-code";

export function AccountSecurityForm({
  twoFactorEnabled,
}: {
  twoFactorEnabled: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  const [totpPassword, setTotpPassword] = useState("");
  const [totpURI, setTotpURI] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verifyCode, setVerifyCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [twoFactorError, setTwoFactorError] = useState("");
  const [twoFactorMessage, setTwoFactorMessage] = useState("");
  const [enabled, setEnabled] = useState(twoFactorEnabled);

  function savePassword() {
    setPasswordError("");
    setPasswordMessage("");
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }
    startTransition(async () => {
      const result = await changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });
      if (result.error) {
        setPasswordError(result.error.message ?? "Failed to change password");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage("Password updated");
    });
  }

  function enableTwoFactor() {
    setTwoFactorError("");
    setTwoFactorMessage("");
    startTransition(async () => {
      const result = await twoFactor.enable({ password: totpPassword });
      if (result.error) {
        setTwoFactorError(result.error.message ?? "Failed to enable 2FA");
        return;
      }
      setTotpURI(result.data?.totpURI ?? null);
      setBackupCodes(result.data?.backupCodes ?? []);
      setTotpPassword("");
      setTwoFactorMessage(
        "Scan the QR code, then verify with a code from your app.",
      );
    });
  }

  function verifyTwoFactor() {
    setTwoFactorError("");
    setTwoFactorMessage("");
    startTransition(async () => {
      const result = await twoFactor.verifyTotp({ code: verifyCode });
      if (result.error) {
        setTwoFactorError(result.error.message ?? "Invalid code");
        return;
      }
      setEnabled(true);
      setTotpURI(null);
      setVerifyCode("");
      setTwoFactorMessage("Two-factor authentication is enabled");
      router.refresh();
    });
  }

  function disableTwoFactor() {
    setTwoFactorError("");
    setTwoFactorMessage("");
    startTransition(async () => {
      const result = await twoFactor.disable({ password: disablePassword });
      if (result.error) {
        setTwoFactorError(result.error.message ?? "Failed to disable 2FA");
        return;
      }
      setEnabled(false);
      setDisablePassword("");
      setBackupCodes([]);
      setTotpURI(null);
      setTwoFactorMessage("Two-factor authentication disabled");
      router.refresh();
    });
  }

  function regenerateBackupCodes() {
    setTwoFactorError("");
    setTwoFactorMessage("");
    startTransition(async () => {
      const result = await twoFactor.generateBackupCodes({
        password: disablePassword || totpPassword,
      });
      if (result.error) {
        setTwoFactorError(
          result.error.message ?? "Enter your password above, then try again",
        );
        return;
      }
      setBackupCodes(result.data?.backupCodes ?? []);
      setTwoFactorMessage("New backup codes generated — save them now");
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium">Change password</h4>
          <p className="text-muted-foreground text-sm">
            Update the password used to sign in to Project Aqua.
          </p>
        </div>
        <FieldGroup className="max-w-md gap-4">
          <Field>
            <FieldLabel htmlFor="current-password">Current password</FieldLabel>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={pending}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="new-password">New password</FieldLabel>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={pending}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="confirm-password">
              Confirm new password
            </FieldLabel>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={pending}
            />
          </Field>
          {passwordError ? <FieldError>{passwordError}</FieldError> : null}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              size="sm"
              disabled={pending || !currentPassword || !newPassword}
              onClick={savePassword}
            >
              Update password
            </Button>
            {passwordMessage ? (
              <p className="text-muted-foreground text-xs">{passwordMessage}</p>
            ) : null}
          </div>
        </FieldGroup>
      </div>

      <Separator />

      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium">Two-factor authentication</h4>
          <p className="text-muted-foreground text-sm">
            {enabled
              ? "Authenticator app 2FA is enabled on your account."
              : "Add an authenticator app for an extra sign-in step."}
          </p>
        </div>

        {!enabled && !totpURI ? (
          <FieldGroup className="max-w-md gap-4">
            <Field>
              <FieldLabel htmlFor="totp-password">Confirm password</FieldLabel>
              <Input
                id="totp-password"
                type="password"
                value={totpPassword}
                onChange={(e) => setTotpPassword(e.target.value)}
                disabled={pending}
              />
              <FieldDescription>
                Required to generate your authenticator secret.
              </FieldDescription>
            </Field>
            <Button
              type="button"
              size="sm"
              disabled={pending || !totpPassword}
              onClick={enableTwoFactor}
            >
              Set up 2FA
            </Button>
          </FieldGroup>
        ) : null}

        {totpURI ? (
          <div className="flex flex-col gap-4">
            <div className="bg-background w-fit rounded-lg border p-4">
              <QRCode value={totpURI} size={160} />
            </div>
            <FieldGroup className="max-w-md gap-4">
              <Field>
                <FieldLabel htmlFor="verify-code">Verification code</FieldLabel>
                <Input
                  id="verify-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  disabled={pending}
                  placeholder="123456"
                />
              </Field>
              <Button
                type="button"
                size="sm"
                disabled={pending || verifyCode.length < 6}
                onClick={verifyTwoFactor}
              >
                Verify and enable
              </Button>
            </FieldGroup>
          </div>
        ) : null}

        {backupCodes.length > 0 ? (
          <div className="bg-muted/40 max-w-md space-y-2 rounded-lg border p-4">
            <p className="text-sm font-medium">Backup codes</p>
            <p className="text-muted-foreground text-xs">
              Store these somewhere safe. Each code can be used once.
            </p>
            <ul className="font-mono grid grid-cols-2 gap-1 text-sm">
              {backupCodes.map((code) => (
                <li key={code}>{code}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {enabled ? (
          <FieldGroup className="max-w-md gap-4">
            <Field>
              <FieldLabel htmlFor="disable-password">Password</FieldLabel>
              <Input
                id="disable-password"
                type="password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                disabled={pending}
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pending || !disablePassword}
                onClick={regenerateBackupCodes}
              >
                Regenerate backup codes
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={pending || !disablePassword}
                onClick={disableTwoFactor}
              >
                Disable 2FA
              </Button>
            </div>
          </FieldGroup>
        ) : null}

        {twoFactorError ? <FieldError>{twoFactorError}</FieldError> : null}
        {twoFactorMessage ? (
          <p className="text-muted-foreground text-sm">{twoFactorMessage}</p>
        ) : null}
      </div>
    </div>
  );
}
