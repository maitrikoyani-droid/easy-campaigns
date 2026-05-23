import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendCampaignBatch } from "@/lib/email-engine.server";

export const Route = createFileRoute("/api/public/hooks/process-campaigns")({
  server: {
    handlers: {
      POST: async () => {
        const nowIso = new Date().toISOString();
        // 1) Promote scheduled campaigns whose time has come
        const { data: due } = await supabaseAdmin
          .from("campaigns")
          .select("id")
          .eq("status", "scheduled")
          .lte("scheduled_at", nowIso);
        const dueIds = (due ?? []).map((c) => c.id);

        // 2) Find sending campaigns ready for next batch
        const { data: sending } = await supabaseAdmin
          .from("campaigns")
          .select("id, batch_delay_seconds, last_batch_at");
        const readyIds: string[] = [];
        for (const c of sending ?? []) {
          if (!dueIds.includes(c.id)) {
            // include sending campaigns whose delay has passed
            const { data: row } = await supabaseAdmin
              .from("campaigns").select("status").eq("id", c.id).maybeSingle();
            if (row?.status !== "sending") continue;
            const last = c.last_batch_at ? new Date(c.last_batch_at).getTime() : 0;
            const wait = (c.batch_delay_seconds || 60) * 1000;
            if (Date.now() - last >= wait) readyIds.push(c.id);
          }
        }

        const allIds = Array.from(new Set([...dueIds, ...readyIds]));
        const results = [];
        for (const id of allIds) {
          try {
            const r = await sendCampaignBatch(id);
            results.push({ id, ...r });
          } catch (e: any) {
            results.push({ id, error: e?.message });
          }
        }
        return Response.json({ processed: results.length, results });
      },
    },
  },
});
