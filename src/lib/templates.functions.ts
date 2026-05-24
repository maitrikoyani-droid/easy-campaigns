import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase.from("templates").select("*").eq("user_id", userId)
      .order("created_at", { ascending: false });
    return data ?? [];
  });

const schema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(120),
  subject: z.string().max(255).optional().nullable(),
  html: z.string().max(200000).optional().nullable(),
});

export const saveTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => schema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (data.id) {
      const { error } = await supabase.from("templates").update({
        name: data.name, subject: data.subject || null, html: data.html || null,
      }).eq("id", data.id).eq("user_id", userId);
      if (error) throw new Error(error.message);
      return { id: data.id };
    } else {
      const { data: row, error } = await supabase.from("templates").insert({
        user_id: userId, name: data.name, subject: data.subject || null, html: data.html || null,
      }).select("id").single();
      if (error || !row) throw new Error(error?.message || "Failed");
      return { id: row.id };
    }
  });

export const deleteTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("templates").delete().eq("id", data.id).eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const duplicateTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: t } = await supabase.from("templates").select("name, subject, html")
      .eq("id", data.id).eq("user_id", userId).maybeSingle();
    if (!t) throw new Error("Template not found");
    const { data: row, error } = await supabase.from("templates").insert({
      user_id: userId, name: `${t.name} (copy)`, subject: t.subject, html: t.html,
    }).select("id").single();
    if (error || !row) throw new Error(error?.message || "Failed");
    return { id: row.id };
  });
