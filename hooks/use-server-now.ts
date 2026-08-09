"use client";

import { useEffect, useState } from "react";

export function useServerNow(): string {
  const [now, setNow] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/time", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { iso?: string } | null) => {
        if (!cancelled && data?.iso) setNow(data.iso);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return now;
}
