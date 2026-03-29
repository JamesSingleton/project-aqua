import { cn } from "@project-aqua/design-system/lib/utils";

export function GenderCell({ gender }: { gender: string }) {
  return (
    <span
      className={cn(
        "font-medium",
        gender === "M" ? "text-blue-600" : "text-pink-600"
      )}
    >
      {gender}
    </span>
  );
}
