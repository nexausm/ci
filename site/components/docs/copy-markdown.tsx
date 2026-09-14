"use client";

import { buttonVariants } from "fumadocs-ui/components/ui/button";
import { useCopyButton } from "fumadocs-ui/utils/use-copy-button";
import { Check, Copy } from "lucide-react";

export function CopyMarkdownButton({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const [checked, onClick] = useCopyButton(() =>
    navigator.clipboard.writeText(content),
  );

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${buttonVariants({
        color: "secondary",
        size: "sm",
        className: "[&_svg]:text-fd-muted-foreground gap-2 [&_svg]:size-3.5",
      })}${className ? ` ${className}` : ""}`}
    >
      {checked ? <Check /> : <Copy />}
      Copy Markdown
    </button>
  );
}
