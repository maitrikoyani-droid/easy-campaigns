import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Mail, Zap, BarChart3, Shield, Clock, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[image:var(--gradient-brand)] text-primary-foreground">
              <Mail className="h-4 w-4" />
            </span>
            Mailwave
          </Link>
          <nav className="flex items-center gap-2">
            <Link to="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
            <Link to="/signup"><Button size="sm">Get started</Button></Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 pt-20 pb-16 text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-success" /> Built for small teams
            </span>
            <h1 className="mt-6 text-5xl font-bold tracking-tight md:text-6xl">
              Personalized bulk email,<br />
              <span className="bg-[image:var(--gradient-brand)] bg-clip-text text-transparent">delivered to the inbox.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Connect your Gmail or SMTP, upload a list, write once, and send personalized emails — throttled, scheduled, and tracked.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Link to="/signup"><Button size="lg">Start sending free</Button></Link>
              <Link to="/login"><Button size="lg" variant="outline">Log in</Button></Link>
            </div>
          </motion.div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-24 md:grid-cols-3">
          {[
            { icon: Upload, title: "Excel / CSV upload", body: "Drag-and-drop your list. We extract, validate, and dedupe automatically." },
            { icon: Zap, title: "Personalized at scale", body: "Use {{name}}, {{company}} and custom fields — each recipient gets their own email." },
            { icon: Clock, title: "Smart scheduling", body: "Send now or pick a date and timezone. Throttled batches keep you out of spam." },
            { icon: BarChart3, title: "Open & click tracking", body: "Pixel tracking and link wrapping — see exactly how your campaign performed." },
            { icon: Shield, title: "Your SMTP, your sender", body: "Bring your Gmail or any SMTP. Emails come from you, not us." },
            { icon: Mail, title: "Clean templates", body: "Save and reuse beautiful templates. Spam-word warnings built in." },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]"
            >
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-accent-foreground">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </motion.div>
          ))}
        </section>
      </main>

      <footer className="border-t border-border/60 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Mailwave
      </footer>
    </div>
  );
}
