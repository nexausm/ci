"use client";

import { useCallback, useSyncExternalStore } from "react";
import { readTemplateId, writeTemplateId } from "@/lib/template-settings";

type Listener = () => void;

const listeners = new Set<Listener>();
let cached: string | null = null;

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): string {
  if (!cached) cached = readTemplateId();
  return cached;
}

function getServerSnapshot(): string {
  return "standard";
}

export function useTemplateId() {
  const templateId = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setTemplateId = useCallback((id: string) => {
    writeTemplateId(id);
    cached = id;
    listeners.forEach((listener) => listener());
  }, []);

  return { templateId, setTemplateId };
}
