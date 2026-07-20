"use client";

import {
  createContext,
  use,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type BreadcrumbEntitiesContextValue = {
  labels: ReadonlyMap<string, string>;
  setLabel: (id: string, label: string) => void;
  removeLabel: (id: string) => void;
};

const BreadcrumbEntitiesContext =
  createContext<BreadcrumbEntitiesContextValue | null>(null);

export function BreadcrumbEntitiesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [labels, setLabels] = useState(() => new Map<string, string>());

  const setLabel = useRef((id: string, label: string) => {
    setLabels((prev) => {
      if (prev.get(id) === label) return prev;
      const next = new Map(prev);
      next.set(id, label);
      return next;
    });
  }).current;

  const removeLabel = useRef((id: string) => {
    setLabels((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }).current;

  return (
    <BreadcrumbEntitiesContext value={{ labels, setLabel, removeLabel }}>
      {children}
    </BreadcrumbEntitiesContext>
  );
}

/** Registers an entity id → display label for the team breadcrumb trail. */
export function SetBreadcrumbEntity({
  id,
  label,
}: {
  id: string;
  label: string;
}) {
  const ctx = use(BreadcrumbEntitiesContext);
  if (!ctx) {
    throw new Error(
      "SetBreadcrumbEntity must be used within BreadcrumbEntitiesProvider",
    );
  }

  const { setLabel, removeLabel } = ctx;

  useLayoutEffect(() => {
    setLabel(id, label);
    return () => removeLabel(id);
  }, [setLabel, removeLabel, id, label]);

  return null;
}

export function useBreadcrumbEntities() {
  const ctx = use(BreadcrumbEntitiesContext);
  if (!ctx) {
    throw new Error(
      "useBreadcrumbEntities must be used within BreadcrumbEntitiesProvider",
    );
  }
  return ctx.labels;
}
