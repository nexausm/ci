"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  DEFAULT_PRINT_SETTINGS,
  readPrintSettings,
  writePrintSettings,
  type PrintSettings,
} from "@/lib/print-settings";

type Listener = () => void;

const listeners = new Set<Listener>();
let cached: PrintSettings | null = null;

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): PrintSettings {
  if (!cached) cached = readPrintSettings();
  return cached;
}

function getServerSnapshot(): PrintSettings {
  return DEFAULT_PRINT_SETTINGS;
}

export function usePrintSettings() {
  const settings = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const update = useCallback((patch: Partial<PrintSettings>) => {
    const next = { ...getSnapshot(), ...patch };
    writePrintSettings(next);
    cached = next;
    listeners.forEach((listener) => listener());
  }, []);

  return { settings, update };
}
