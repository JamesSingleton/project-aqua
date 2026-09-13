"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@project-aqua/ui/components/dialog";
import { useRouter } from "next/navigation";

export function Modal({
  children,
  title = "Add swimmer",
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const router = useRouter();

  return (
    <Dialog open onOpenChange={(open) => !open && router.back()}>
      <DialogContent className="flex h-[min(90vh,720px)] max-w-4xl flex-col gap-4 overflow-hidden sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
