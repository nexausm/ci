import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STATUS_DOT, STATUS_LABEL, STATUS_VARIANT } from "@/lib/invoice-status";
import type { InvoiceStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <Badge variant={STATUS_VARIANT[status]} className="gap-1.5 font-medium">
      <span className={cn("size-1.5 rounded-full", STATUS_DOT[status])} />
      {STATUS_LABEL[status]}
    </Badge>
  );
}
