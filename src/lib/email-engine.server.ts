import nodemailer from "nodemailer";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getAppUrl } from "./app-url.server";

function personalize(template: string, vars: Record<string, any>) {
  return template.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, key) => {
    const v = vars[key];
    return v == null ? "" : String(v);
  });
}

function injectTracking(html: string, trackingId: string, campaignId: string) {
  const base = getAppUrl();
  // Rewrite anchors
  let out = html.replace(/<a\s+([^>]*?)href=["']([^"']+)["']([^>]*)>/gi, (m, pre, href, post) => {
    if (href.startsWith("mailto:") || href.startsWith("#")) return m;
    const wrapped = `${base}/api/public/track/click?t=${trackingId}&c=${campaignId}&u=${encodeURIComponent(href)}`;
    return `<a ${pre}href="${wrapped}"${post}>`;
  });
  // Pixel
  const pixel = `<img src="${base}/api/public/track/open/${trackingId}.gif" width="1" height="1" alt="" style="display:none" />`;
  if (/<\/body>/i.test(out)) out = out.replace(/<\/body>/i, `${pixel}</body>`);
  else out += pixel;
  return out;
}

export async function sendCampaignBatch(campaignId: string) {
  const { data: campaign, error: cErr } = await supabaseAdmin
    .from("campaigns")
    .select("*")
    .eq("id", campaignId)
    .maybeSingle();
  if (cErr || !campaign) return { sent: 0, error: cErr?.message || "Campaign not found" };
  if (!["sending", "scheduled"].includes(campaign.status)) return { sent: 0 };

  const { data: smtp } = await supabaseAdmin
    .from("smtp_settings")
    .select("*")
    .eq("user_id", campaign.user_id)
    .maybeSingle();
  if (!smtp) {
    await supabaseAdmin.from("campaigns").update({ status: "failed" }).eq("id", campaignId);
    return { sent: 0, error: "SMTP not configured" };
  }

  // Promote scheduled -> sending
  if (campaign.status === "scheduled") {
    await supabaseAdmin.from("campaigns").update({ status: "sending" }).eq("id", campaignId);
  }

  const { data: batch } = await supabaseAdmin
    .from("campaign_recipients")
    .select("*")
    .eq("campaign_id", campaignId)
    .eq("status", "queued")
    .limit(campaign.batch_size || 20);

  if (!batch || batch.length === 0) {
    // Mark complete if no queued left
    const { count } = await supabaseAdmin
      .from("campaign_recipients")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", campaignId)
      .eq("status", "queued");
    if ((count ?? 0) === 0) {
      await supabaseAdmin.from("campaigns").update({ status: "sent" }).eq("id", campaignId);
    }
    return { sent: 0 };
  }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: { user: smtp.username, pass: smtp.password },
  });

  const fromName = campaign.from_name || smtp.from_name || smtp.from_email;
  const from = `"${fromName}" <${smtp.from_email}>`;
  const replyTo = campaign.reply_to || smtp.from_email;

  // Pre-load attachments once per batch
  const attachmentMeta = Array.isArray(campaign.attachments) ? campaign.attachments : [];
  const attachments: Array<{ filename: string; content: Buffer; contentType?: string }> = [];
  for (const a of attachmentMeta) {
    try {
      const { data: file } = await supabaseAdmin.storage.from("attachments").download(a.path);
      if (file) {
        const buf = Buffer.from(await file.arrayBuffer());
        attachments.push({ filename: a.filename, content: buf, contentType: a.contentType || undefined });
      }
    } catch (e) {
      console.error("attachment load failed", a.path, e);
    }
  }

  let sent = 0;
  let failed = 0;
  for (const r of batch) {
    const vars = { name: r.name || "", email: r.email, company: r.company || "" };
    const subject = personalize(campaign.subject, vars);
    const html = injectTracking(personalize(campaign.html, vars), r.tracking_id, campaignId);
    try {
      await transporter.sendMail({ from, to: r.email, subject, html, replyTo, attachments });
      await supabaseAdmin
        .from("campaign_recipients")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", r.id);
      sent++;
    } catch (e: any) {
      await supabaseAdmin
        .from("campaign_recipients")
        .update({ status: "failed", error_message: e?.message?.slice(0, 500) || "send error" })
        .eq("id", r.id);
      failed++;
    }
  }

  await supabaseAdmin
    .from("campaigns")
    .update({
      sent_count: (campaign.sent_count || 0) + sent,
      failed_count: (campaign.failed_count || 0) + failed,
      last_batch_at: new Date().toISOString(),
    })
    .eq("id", campaignId);

  // If nothing queued remains, mark sent
  const { count: remaining } = await supabaseAdmin
    .from("campaign_recipients")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaignId)
    .eq("status", "queued");
  if ((remaining ?? 0) === 0) {
    await supabaseAdmin.from("campaigns").update({ status: "sent" }).eq("id", campaignId);
  }

  return { sent, failed };
}
