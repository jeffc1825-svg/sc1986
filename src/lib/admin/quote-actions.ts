"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/guard";
import { routes } from "@/config/routes";
import type { ActionState } from "@/lib/admin/product-actions";

const VALID_STATUSES = ["new", "reviewing", "quoted", "closed", "cancelled"] as const;

export async function updateQuoteAction(
  quoteId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase } = await requireAdmin();

  const status = String(formData.get("status") ?? "");
  const adminNote = String(formData.get("admin_note") ?? "")
    .trim()
    .slice(0, 5000);

  if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    return { error: "狀態不正確。" };
  }

  const { error } = await supabase
    .from("quote_requests")
    .update({ status, admin_note: adminNote || null })
    .eq("id", quoteId);

  if (error) return { error: `更新失敗:${error.message}` };

  revalidatePath(routes.admin.quotes);
  revalidatePath(routes.admin.quoteDetail(quoteId));
  return { error: null, success: "已更新案件。" };
}
