import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import nodemailer from "nodemailer";

export const getSmtp = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase.from("smtp_settings").select("*").eq("user_id", userId).maybeSingle();
    return data;
  });

const smtpSchema = z.object({
  provider: z.string().min(1).max(40),
  host: z.string().min(1).max(255),
  port: z.number().int().min(1).max(65535),
  secure: z.boolean(),
  username: z.string().min(1).max(255),
  password: z.string().min(1).max(500),
  from_email: z.string().email(),
  from_name: z.string().max(120).optional().nullable(),
});

export const saveSmtp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => smtpSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const payload = { ...data, user_id: userId, updated_at: new Date().toISOString() };
    const { error } = await supabase.from("smtp_settings").upsert(payload, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const testSmtp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ to: z.string().email() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: smtp } = await supabase.from("smtp_settings").select("*").eq("user_id", userId).maybeSingle();
    if (!smtp) throw new Error("Configure SMTP first");
    const t = nodemailer.createTransport({
      host: smtp.host, port: smtp.port, secure: smtp.secure,
      auth: { user: smtp.username, pass: smtp.password },
    });
    await t.sendMail({
      from: `"${smtp.from_name || smtp.from_email}" <${smtp.from_email}>`,
      to: data.to,
      subject: "Mailwave SMTP test ✅",
      html: "<p>Your SMTP is working correctly.</p>",
    });
    return { ok: true };
  });
