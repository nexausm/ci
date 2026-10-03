"use client";

import { useTheme } from "next-themes";
import { IoMoonOutline, IoSunnyOutline } from "react-icons/io5";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      title="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={
        className ??
        "text-muted-foreground hover:text-foreground inline-flex size-8 items-center justify-center rounded-md transition-colors"
      }
    >
      <IoSunnyOutline className="size-4 dark:hidden" />
      <IoMoonOutline className="hidden size-4 dark:block" />
    </button>
  );
}
