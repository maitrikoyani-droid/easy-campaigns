import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: campaigns } = await supabase
      .from("campaigns")
      .select("sent_count, failed_count, open_count, click_count")
      .eq("user_id", userId);
    const totals = (campaigns ?? []).reduce(
      (acc, c) => ({
        sent: acc.sent + (c.sent_count ?? 0),
        delivered: acc.delivered + (c.sent_count ?? 0) - (c.failed_count ?? 0),
        opens: acc.opens + (c.open_count ?? 0),
        clicks: acc.clicks + (c.click_count ?? 0),
        failed: acc.failed + (c.failed_count ?? 0),
        campaigns: acc.campaigns + 1,
      }),
      { sent: 0, delivered: 0, opens: 0, clicks: 0, failed: 0, campaigns: 0 },
    );
    return totals;
  });
