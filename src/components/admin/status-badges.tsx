import { Badge } from "@/components/ui/badge";
import type { ImportBatchStatus, NotificationStatus, ProductStatus, QuoteStatus } from "@/types";

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  const map = {
    draft: { label: "草稿", variant: "muted" as const },
    active: { label: "上架中", variant: "success" as const },
    archived: { label: "已封存", variant: "warning" as const },
  };
  const { label, variant } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  const map = {
    new: { label: "新案件", variant: "default" as const },
    reviewing: { label: "處理中", variant: "info" as const },
    quoted: { label: "已報價", variant: "purple" as const },
    closed: { label: "已結案", variant: "success" as const },
    cancelled: { label: "已取消", variant: "muted" as const },
  };
  const { label, variant } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export const quoteStatusOptions: { value: QuoteStatus; label: string }[] = [
  { value: "new", label: "新案件" },
  { value: "reviewing", label: "處理中" },
  { value: "quoted", label: "已報價" },
  { value: "closed", label: "已結案" },
  { value: "cancelled", label: "已取消" },
];

export function ImportStatusBadge({ status }: { status: ImportBatchStatus }) {
  const map = {
    pending: { label: "待處理", variant: "muted" as const },
    processing: { label: "處理中", variant: "info" as const },
    completed: { label: "完成", variant: "success" as const },
    failed: { label: "失敗", variant: "warning" as const },
  };
  const { label, variant } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export function NotificationBadge({ status }: { status: NotificationStatus }) {
  const map = {
    pending: { label: "通知待送", variant: "muted" as const },
    sent: { label: "通知已送", variant: "success" as const },
    failed: { label: "通知失敗", variant: "warning" as const },
    skipped: { label: "通知略過", variant: "outline" as const },
  };
  const { label, variant } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}
