import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sendCampaignBatch } from "./email-engine.server";

const SPAM_WORDS = [
  "free", "winner", "guarantee", "risk-free", "act now", "click here",
  "limited time", "urgent", "100% free", "cash", "credit", "no cost",
  "buy now", "order now", "make money", "earn $", "double your", "no obligation",
];

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: campaigns } = await supabase
      .from("campaigns")
      .select("sent_count, failed_count, open_count, click_count")
      .eq("user_id", userId);
    return (campaigns ?? []).reduce(
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
  });

export const checkSpamWords = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ text: z.string().max(200000) }).parse(d))
  .handler(async ({ data }) => {
    const lower = data.text.toLowerCase();
    const hits = SPAM_WORDS.filter((w) => lower.includes(w));
    return { hits, score: hits.length };
  });

const attachmentSchema = z.object({
  path: z.string().min(1).max(500),
  filename: z.string().min(1).max(255),
  size: z.number().int().min(0).max(25 * 1024 * 1024),
  contentType: z.string().max(120).optional().nullable(),
});

const createSchema = z.object({
  name: z.string().min(1).max(160),
  subject: z.string().min(1).max(255),
  html: z.string().min(1).max(200000),
  from_name: z.string().max(120).optional().nullable(),
  reply_to: z.string().email().optional().nullable(),
  list_id: z.string().uuid(),
  batch_size: z.number().int().min(1).max(500).default(20),
  batch_delay_seconds: z.number().int().min(0).max(3600).default(60),
  scheduled_at: z.string().optional().nullable(),
  timezone: z.string().max(60).optional().nullable(),
  send_now: z.boolean().default(false),
  attachments: z.array(attachmentSchema).max(20).default([]),
});

export const createCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => createSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: recipients, error: rErr } = await supabase
      .from("recipients").select("email, name, company")
      .eq("list_id", data.list_id).eq("user_id", userId);
    if (rErr) throw new Error(rErr.message);
    if (!recipients || recipients.length === 0) throw new Error("List has no recipients");

    const status = data.send_now ? "sending" : data.scheduled_at ? "scheduled" : "draft";

    const { data: c, error } = await supabase.from("campaigns").insert({
      user_id: userId,
      name: data.name,
      subject: data.subject,
      html: data.html,
      from_name: data.from_name || null,
      reply_to: data.reply_to || null,
      list_id: data.list_id,
      batch_size: data.batch_size,
      batch_delay_seconds: data.batch_delay_seconds,
      scheduled_at: data.scheduled_at || null,
      timezone: data.timezone || "UTC",
      status,
      total_recipients: recipients.length,
    }).select("id").single();
    if (error || !c) throw new Error(error?.message || "Failed");

    const crRows = recipients.map((r) => ({
      user_id: userId, campaign_id: c.id,
      email: r.email, name: r.name, company: r.company,
    }));
    for (let i = 0; i < crRows.length; i += 500) {
      await supabase.from("campaign_recipients").insert(crRows.slice(i, i + 500));
    }

    if (data.send_now) {
      // Kick off first batch immediately (fire & forget; cron will continue)
      sendCampaignBatch(c.id).catch((e) => console.error("send error", e));
    }

    return { id: c.id, status };
  });

export const listCampaigns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("campaigns")
      .select("id, name, subject, status, scheduled_at, sent_count, total_recipients, open_count, click_count, failed_count, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return data ?? [];
  });

export const cancelCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("campaigns").update({ status: "paused" })
      .eq("id", data.id).eq("user_id", userId).in("status", ["scheduled", "sending"]);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getCampaignAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: campaign } = await supabase.from("campaigns")
      .select("id, name, subject, status, sent_count, total_recipients, open_count, click_count, failed_count, created_at")
      .eq("id", data.id).eq("user_id", userId).maybeSingle();
    if (!campaign) throw new Error("Campaign not found");
    const { data: recipients } = await supabase.from("campaign_recipients")
      .select("id, email, name, status, opens, clicks, sent_at, error_message")
      .eq("campaign_id", data.id).eq("user_id", userId)
      .order("sent_at", { ascending: false, nullsFirst: false }).limit(2000);
    const { data: events } = await supabase.from("email_events")
      .select("campaign_recipient_id, event_type, url, created_at")
      .eq("campaign_id", data.id).eq("user_id", userId)
      .order("created_at", { ascending: false }).limit(5000);
    return { campaign, recipients: recipients ?? [], events: events ?? [] };
  });
