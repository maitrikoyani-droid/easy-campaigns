import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const listLists = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: lists } = await supabase
      .from("recipient_lists")
      .select("id, name, description, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (!lists) return [];
    const ids = lists.map((l) => l.id);
    if (ids.length === 0) return lists.map((l) => ({ ...l, count: 0 }));
    const { data: counts } = await supabase
      .from("recipients")
      .select("list_id")
      .in("list_id", ids);
    const tally: Record<string, number> = {};
    (counts ?? []).forEach((r) => { tally[r.list_id] = (tally[r.list_id] || 0) + 1; });
    return lists.map((l) => ({ ...l, count: tally[l.id] || 0 }));
  });

export const getList = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: list } = await supabase
      .from("recipient_lists").select("*").eq("id", data.id).eq("user_id", userId).maybeSingle();
    if (!list) throw new Error("List not found");
    const { data: recipients } = await supabase
      .from("recipients").select("id, email, name, company, custom_fields, created_at")
      .eq("list_id", data.id).order("created_at", { ascending: true }).limit(2000);
    return { list, recipients: recipients ?? [] };
  });

const recipientSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().max(255).optional().nullable(),
  company: z.string().max(255).optional().nullable(),
  custom_fields: z.record(z.string(), z.any()).optional(),
});

export const createList = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    name: z.string().min(1).max(120),
    description: z.string().max(500).optional().nullable(),
    recipients: z.array(recipientSchema).max(50000).default([]),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: list, error } = await supabase
      .from("recipient_lists")
      .insert({ user_id: userId, name: data.name, description: data.description || null })
      .select("id").single();
    if (error || !list) throw new Error(error?.message || "Failed");
    if (data.recipients.length) {
      const seen = new Set<string>();
      const rows = data.recipients
        .filter((r) => {
          const e = r.email.toLowerCase();
          if (seen.has(e)) return false;
          seen.add(e); return true;
        })
        .map((r) => ({
          user_id: userId, list_id: list.id,
          email: r.email.toLowerCase(), name: r.name || null, company: r.company || null,
          custom_fields: r.custom_fields || {},
        }));
      for (let i = 0; i < rows.length; i += 500) {
        const { error: insErr } = await supabase.from("recipients").insert(rows.slice(i, i + 500));
        if (insErr) throw new Error(insErr.message);
      }
    }
    return { id: list.id };
  });

export const deleteList = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase.from("recipients").delete().eq("list_id", data.id).eq("user_id", userId);
    const { error } = await supabase.from("recipient_lists").delete().eq("id", data.id).eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addRecipient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    list_id: z.string().uuid(),
    email: z.string().email().max(255),
    name: z.string().max(255).optional().nullable(),
    company: z.string().max(255).optional().nullable(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: list } = await supabase.from("recipient_lists")
      .select("id").eq("id", data.list_id).eq("user_id", userId).maybeSingle();
    if (!list) throw new Error("List not found");
    const { data: row, error } = await supabase.from("recipients").insert({
      user_id: userId, list_id: data.list_id,
      email: data.email.toLowerCase(), name: data.name || null, company: data.company || null,
    }).select("id").single();
    if (error || !row) throw new Error(error?.message || "Failed");
    return { id: row.id };
  });

export const updateRecipient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid(),
    email: z.string().email().max(255),
    name: z.string().max(255).optional().nullable(),
    company: z.string().max(255).optional().nullable(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("recipients").update({
      email: data.email.toLowerCase(), name: data.name || null, company: data.company || null,
    }).eq("id", data.id).eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteRecipient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("recipients").delete().eq("id", data.id).eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export { EMAIL_RE };
