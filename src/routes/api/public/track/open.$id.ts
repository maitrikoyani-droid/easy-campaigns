import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

export const Route = createFileRoute("/api/public/track/open/$id")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        try {
          const id = params.id.replace(/\.gif$/, "");
          const { data: cr } = await supabaseAdmin
            .from("campaign_recipients")
            .select("id, user_id, campaign_id, opens")
            .eq("tracking_id", id)
            .maybeSingle();
          if (cr) {
            await supabaseAdmin
              .from("campaign_recipients")
              .update({ opens: (cr.opens || 0) + 1 })
              .eq("id", cr.id);
            const { data: camp } = await supabaseAdmin
              .from("campaigns").select("open_count").eq("id", cr.campaign_id).maybeSingle();
            await supabaseAdmin
              .from("campaigns")
              .update({ open_count: (camp?.open_count || 0) + 1 })
              .eq("id", cr.campaign_id);
            await supabaseAdmin.from("email_events").insert({
              user_id: cr.user_id, campaign_id: cr.campaign_id, campaign_recipient_id: cr.id,
              event_type: "open",
              user_agent: request.headers.get("user-agent")?.slice(0, 300) || null,
            });
          }
        } catch (e) { console.error("open tracking", e); }
        return new Response(PIXEL, {
          headers: {
            "content-type": "image/gif",
            "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
            "pragma": "no-cache",
          },
        });
      },
    },
  },
});
