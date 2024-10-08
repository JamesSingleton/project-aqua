"use client";

import { type ElementRef, useEffect, useRef } from "react";
import { Dialog } from "@repo/ui/dialog";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

export function Modal({ children }: { children: React.ReactElement }) {
  const router = useRouter();
  const dialogRef = useRef<ElementRef<"dialog">>(null);

  useEffect(() => {
    if (!dialogRef.current?.open) {
      dialogRef.current?.showModal();
    }
  }, []);

  function navigateBack() {
    router.back();
  }

  return createPortal(
    <Dialog defaultOpen onOpenChange={(open) => !open && navigateBack()}>
      {children}
    </Dialog>,
    document.getElementById("modal-root")!,
  );
}
