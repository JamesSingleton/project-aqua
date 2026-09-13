"use client";

import type { ThemePreference } from "@project-aqua/db/schema";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@project-aqua/ui/components/field";
import {
  RadioGroup,
  RadioGroupItem,
} from "@project-aqua/ui/components/radio-group";
import { cn } from "@project-aqua/ui/lib/utils";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState, useTransition } from "react";
import { updateThemeAction } from "./actions";

const THEMES = [
  {
    value: "light",
    label: "Light",
    description: "Bright backgrounds for daytime use.",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Dark",
    description: "Dimmed surfaces that are easier on the eyes.",
    icon: Moon,
  },
  {
    value: "system",
    label: "System",
    description: "Match your device’s light or dark preference.",
    icon: Monitor,
  },
] as const;

export function AccountAppearanceForm({
  teamId,
  initialTheme,
}: {
  teamId: string;
  initialTheme: ThemePreference;
}) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const value = mounted ? (theme ?? initialTheme) : initialTheme;

  function handleChange(next: string) {
    if (next !== "light" && next !== "dark" && next !== "system") return;
    setError(null);
    setTheme(next);
    startTransition(async () => {
      const result = await updateThemeAction(teamId, next);
      if (!result.ok) {
        setError(result.error);
      }
    });
  }

  return (
    <Field>
      <FieldLabel>Theme</FieldLabel>
      <RadioGroup
        value={value}
        onValueChange={handleChange}
        className="grid gap-3 sm:grid-cols-3"
        disabled={!mounted || pending}
      >
        {THEMES.map((option) => {
          const Icon = option.icon;
          const selected = value === option.value;
          const inputId = `theme-${option.value}`;
          return (
            <label
              key={option.value}
              htmlFor={inputId}
              className={cn(
                "border-border hover:border-primary/40 flex cursor-pointer flex-col gap-2 rounded-lg border p-3 transition-colors",
                selected && "border-primary ring-primary/20 ring-2",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Icon className="size-4" />
                  {option.label}
                </span>
                <RadioGroupItem id={inputId} value={option.value} />
              </div>
              <FieldDescription>{option.description}</FieldDescription>
            </label>
          );
        })}
      </RadioGroup>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </Field>
  );
}
