import { Waves } from "lucide-react";
import Link from "next/link";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/sign-in" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <Waves className="size-4" />
            </div>
            Project Aqua
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">{children}</div>
        </div>
      </div>
      <div className="bg-muted relative hidden overflow-hidden lg:block">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, #0b3a4a 0%, #0e5c6e 42%, #1a8a9a 78%, #7ec8c8 100%)",
          }}
        />
        <svg
          aria-hidden
          className="absolute inset-0 size-full opacity-40"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 800 1200"
        >
          <path
            fill="none"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="1.5"
            d="M0 220 Q200 160 400 220 T800 220"
          />
          <path
            fill="none"
            stroke="rgba(255,255,255,0.28)"
            strokeWidth="1.5"
            d="M0 320 Q200 260 400 320 T800 320"
          />
          <path
            fill="none"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="1.5"
            d="M0 420 Q200 360 400 420 T800 420"
          />
          <path
            fill="none"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="1.5"
            d="M0 520 Q200 460 400 520 T800 520"
          />
          <path
            fill="none"
            stroke="rgba(255,255,255,0.14)"
            strokeWidth="1.5"
            d="M0 620 Q200 560 400 620 T800 620"
          />
          <path
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="1.5"
            d="M0 720 Q200 660 400 720 T800 720"
          />
          <path
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1.5"
            d="M0 820 Q200 760 400 820 T800 820"
          />
        </svg>
        <div className="absolute inset-x-0 bottom-0 p-10 text-white">
          <p className="text-2xl font-semibold tracking-tight text-balance">
            Swim team management, without the chaos
          </p>
          <p className="mt-2 max-w-sm text-sm text-white/80 text-pretty">
            Rosters, meets, attendance, and calendars — built for competitive
            coaches.
          </p>
        </div>
      </div>
    </div>
  );
}
