import { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { ChevronLeft, LifeBuoy, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

export default function ConsumerSupport() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try { setTickets(await api.supportTickets()); } catch { setTickets([]); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!subject.trim()) { toast({ title: "Add a subject" }); return; }
    setBusy(true);
    try {
      await api.createSupportTicket(subject.trim(), body.trim());
      toast({ title: "Ticket submitted", description: "Our team will get back to you." });
      setSubject(""); setBody(""); await load();
    } catch (e) {
      toast({ title: "Couldn't submit", description: e instanceof Error ? e.message : String(e) });
    } finally { setBusy(false); }
  };

  return (
    <ConsumerLayout>
      <div className="hero-blue text-white px-4 pt-5 pb-5 rounded-b-3xl shadow-md flex items-center gap-3">
        <button onClick={() => navigate("/profile")}><ChevronLeft className="w-6 h-6" /></button>
        <h1 className="text-xl font-extrabold">Help & Support</h1>
      </div>

      <div className="px-4 py-5 space-y-6">
        <div className="bg-card border border-border rounded-2xl shadow-sm p-4 space-y-3">
          <div className="flex items-center gap-2"><LifeBuoy className="w-5 h-5 text-primary" /><h2 className="font-extrabold">Contact support</h2></div>
          <p className="text-sm text-muted-foreground">For urgent matters, email us at <a href="mailto:support@fixit-now.xyz" className="text-primary font-bold">support@fixit-now.xyz</a></p>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="h-12 rounded-xl bg-muted border-border" />
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Describe your issue…" className="min-h-[100px] rounded-xl bg-muted border-border resize-none" />
          <Button onClick={submit} disabled={busy} className="w-full h-12 rounded-xl font-bold"><Send className="w-4 h-4 mr-2" /> {busy ? "Sending…" : "Submit ticket"}</Button>
        </div>

        <div>
          <h3 className="font-extrabold text-base mb-3">Your tickets</h3>
          {tickets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tickets yet.</p>
          ) : (
            <div className="space-y-3">
              {tickets.map((t, i) => (
                <div key={t.ticket_id ?? i} className="bg-card border border-border rounded-2xl shadow-sm p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-sm truncate">{t.subject}</p>
                    <Badge className="bg-primary/10 text-primary border-0 shrink-0">{String(t.status ?? "OPEN").replace(/_/g, " ")}</Badge>
                  </div>
                  {t.body && <p className="text-sm text-muted-foreground mt-1">{t.body}</p>}
                  {t.created_at && <p className="text-[11px] text-muted-foreground mt-2">{new Date(t.created_at).toLocaleString()}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ConsumerLayout>
  );
}
