"use client";

import { Button } from "@project-aqua/ui/components/button";
import { Input } from "@project-aqua/ui/components/input";
import { Label } from "@project-aqua/ui/components/label";
import { Waves } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { removeTeamLogoAction, uploadTeamLogoAction } from "./actions";

const LOGO_ACCEPT = "image/jpeg,image/png,image/webp,image/avif,image/svg+xml";

export function TeamLogoUploader({
  teamId,
  logoUrl,
}: {
  teamId: string;
  logoUrl: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [preview, setPreview] = useState<string | null>(logoUrl);
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    setPreview(logoUrl);
  }, [logoUrl]);

  useEffect(() => {
    if (!selectedFile) return;
    const url = URL.createObjectURL(selectedFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  function upload() {
    if (!selectedFile) return;
    setMessage("");
    const formData = new FormData();
    formData.set("logo", selectedFile);
    startTransition(async () => {
      const result = await uploadTeamLogoAction(teamId, formData);
      if (!result.ok) {
        setMessage(result.error);
        setPreview(logoUrl);
        setSelectedFile(null);
        return;
      }
      setSelectedFile(null);
      setPreview(result.logo);
      setMessage("Logo updated");
      router.refresh();
    });
  }

  function remove() {
    setMessage("");
    startTransition(async () => {
      const result = await removeTeamLogoAction(teamId);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setSelectedFile(null);
      setPreview(null);
      setMessage("Logo removed");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-4">
        <div className="bg-muted flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
          {preview ? (
            <img
              src={preview}
              alt="Team logo"
              className="size-full object-cover"
            />
          ) : (
            <Waves className="text-muted-foreground size-8" />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Label htmlFor="settingsLogo">Logo image</Label>
          <Input
            id="settingsLogo"
            type="file"
            accept={LOGO_ACCEPT}
            disabled={pending}
            onChange={(e) => {
              setSelectedFile(e.target.files?.[0] ?? null);
              setMessage("");
            }}
          />
          <p className="text-muted-foreground text-xs">
            JPEG, PNG, WebP, AVIF, or SVG · max 2 MB
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          disabled={pending || !selectedFile}
          onClick={upload}
        >
          {pending && selectedFile ? "Uploading…" : "Upload logo"}
        </Button>
        {logoUrl || preview ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={remove}
          >
            Remove
          </Button>
        ) : null}
        {message ? (
          <p className="text-muted-foreground text-xs">{message}</p>
        ) : null}
      </div>
    </div>
  );
}
