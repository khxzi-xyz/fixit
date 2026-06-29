import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { api } from "@/lib/api";
import { LifeBuoy, Send, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_app/support")({
  head: () => ({ meta: [{ title: "Support — FixIt" }] }),
  component: Support,
});

function Support() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => { try { setTickets(await api.myTickets()); } catch { setTickets([]); } }, []);
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!subject.trim()) return;
    setBusy(true);
    try { await api.createTicket(subject, body || undefined); setSubject(""); setBody(""); await load(); }
    catch (e) { alert(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow="Zone 8 · Help desk" title="Support" subtitle="Open a ticket — our team replies in the app." />
      <div className="rounded-2xl border border-border bg-white p-5 shadow-[var(--shadow-soft)]">
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject"
          className="w-full rounded-lg border border-input bg-[var(--offwhite)] px-3 py-2.5 text-sm" />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Describe your issue…" rows={4}
          className="mt-2 w-full rounded-lg border border-input bg-[var(--offwhite)] px-3 py-2.5 text-sm" />
        <button onClick={submit} disabled={busy || !subject.trim()}
          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[var(--azure)] px-4 py-2.5 text-sm font-bold text-white hover:bg-[var(--navy)] disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Open ticket
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {tickets.length === 0 ? (
          <div className="grid place-items-center rounded-2xl border border-dashed border-border py-10 text-sm text-muted-foreground">
            <LifeBuoy className="mb-2 h-7 w-7 opacity-40" /> No tickets yet.
          </div>
        ) : tickets.map((t) => (
          <div key={t.ticket_id} className="rounded-2xl border border-border bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[var(--navy)]">{t.subject}</span>
              <span className="rounded-full bg-[var(--offwhite)] px-2 py-0.5 text-[11px] font-bold text-[var(--azure)]">{t.status}</span>
            </div>
            {t.body && <p className="mt-1 text-xs text-muted-foreground">{t.body}</p>}
            {t.admin_reply && <p className="mt-2 rounded-lg bg-emerald-50 p-2 text-xs text-emerald-800"><b>Support:</b> {t.admin_reply}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
