import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-lg font-semibold tracking-tight",
        className,
      )}
    >
      <Image
        src="/images/logo/nci-logo.png"
        alt="nci"
        width={115}
        height={127}
        unoptimized
        className="h-6 w-auto"
      />
      <span>Cloud Invoice</span>
    </span>
  );
}
