"use client";

import { Button } from "@project-aqua/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@project-aqua/ui/components/field";
import { Input } from "@project-aqua/ui/components/input";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  removeAvatarAction,
  updateAccountProfileAction,
  uploadAvatarAction,
} from "./actions";

const AVATAR_ACCEPT =
  "image/jpeg,image/png,image/webp,image/avif,image/svg+xml";

export function AccountProfileForm({
  teamId,
  name,
  email,
  title,
  image,
}: {
  teamId: string;
  name: string;
  email: string;
  title: string;
  image: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [fullName, setFullName] = useState(name);
  const [coachTitle, setCoachTitle] = useState(title);
  const [preview, setPreview] = useState<string | null>(image);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setPreview(image);
  }, [image]);

  useEffect(() => {
    if (!selectedFile) return;
    const url = URL.createObjectURL(selectedFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const dirty = fullName.trim() !== name || coachTitle.trim() !== title;

  function saveProfile() {
    setError("");
    setMessage("");
    startTransition(async () => {
      const result = await updateAccountProfileAction(teamId, {
        name: fullName,
        title: coachTitle,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage("Profile updated");
      router.refresh();
    });
  }

  function uploadAvatar() {
    if (!selectedFile) return;
    setError("");
    setMessage("");
    const formData = new FormData();
    formData.set("avatar", selectedFile);
    startTransition(async () => {
      const result = await uploadAvatarAction(teamId, formData);
      if (!result.ok) {
        setError(result.error);
        setPreview(image);
        setSelectedFile(null);
        return;
      }
      setSelectedFile(null);
      setPreview(result.image);
      setMessage("Avatar updated");
      router.refresh();
    });
  }

  function removeAvatar() {
    setError("");
    setMessage("");
    startTransition(async () => {
      const result = await removeAvatarAction(teamId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSelectedFile(null);
      setPreview(null);
      setMessage("Avatar removed");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start gap-4">
        <div className="bg-muted flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
          {preview ? (
            <img
              src={preview}
              alt="Your avatar"
              className="size-full object-cover"
            />
          ) : (
            <span className="text-muted-foreground text-lg font-medium">
              {fullName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() || "?"}
            </span>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <FieldLabel htmlFor="avatar">Profile photo</FieldLabel>
          <Input
            id="avatar"
            type="file"
            accept={AVATAR_ACCEPT}
            disabled={pending}
            onChange={(e) => {
              setSelectedFile(e.target.files?.[0] ?? null);
              setMessage("");
              setError("");
            }}
          />
          <FieldDescription>
            JPEG, PNG, WebP, AVIF, or SVG · max 2 MB
          </FieldDescription>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={pending || !selectedFile}
              onClick={uploadAvatar}
            >
              {pending && selectedFile ? "Uploading…" : "Upload"}
            </Button>
            {image || preview ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={removeAvatar}
              >
                Remove
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <FieldGroup className="max-w-md gap-4">
        <Field>
          <FieldLabel htmlFor="account-name">Name</FieldLabel>
          <Input
            id="account-name"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              setMessage("");
              setError("");
            }}
            disabled={pending}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="account-email">Email</FieldLabel>
          <Input id="account-email" value={email} disabled />
          <FieldDescription>
            Contact support to change the email on this account.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="account-title">Title on this team</FieldLabel>
          <Input
            id="account-title"
            value={coachTitle}
            placeholder="Head Coach"
            onChange={(e) => {
              setCoachTitle(e.target.value);
              setMessage("");
              setError("");
            }}
            disabled={pending}
          />
        </Field>
        {error ? <FieldError>{error}</FieldError> : null}
        <div className="flex items-center gap-3">
          <Button
            type="button"
            size="sm"
            disabled={pending || !dirty}
            onClick={saveProfile}
          >
            {pending && !selectedFile ? "Saving…" : "Save profile"}
          </Button>
          {message ? (
            <p className="text-muted-foreground text-xs">{message}</p>
          ) : null}
        </div>
      </FieldGroup>
    </div>
  );
}
