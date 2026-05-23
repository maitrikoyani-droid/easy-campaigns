import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/track/click")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const t = url.searchParams.get("t");
        const target = url.searchParams.get("u");
        if (!target) return new Response("Missing url", { status: 400 });
        try {
          if (t) {
            const { data: cr } = await supabaseAdmin
              .from("campaign_recipients")
              .select("id, user_id, campaign_id, clicks")
              .eq("tracking_id", t)
              .maybeSingle();
            if (cr) {
              await supabaseAdmin
                .from("campaign_recipients")
                .update({ clicks: (cr.clicks || 0) + 1 })
                .eq("id", cr.id);
              const { data: camp } = await supabaseAdmin
                .from("campaigns").select("click_count").eq("id", cr.campaign_id).maybeSingle();
              await supabaseAdmin
                .from("campaigns")
                .update({ click_count: (camp?.click_count || 0) + 1 })
                .eq("id", cr.campaign_id);
              await supabaseAdmin.from("email_events").insert({
                user_id: cr.user_id, campaign_id: cr.campaign_id, campaign_recipient_id: cr.id,
                event_type: "click", url: target,
                user_agent: request.headers.get("user-agent")?.slice(0, 300) || null,
              });
            }
          }
        } catch (e) { console.error("click tracking", e); }
        return Response.redirect(target, 302);
      },
    },
  },
});
