import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { VendorLayout } from "@/components/layouts/VendorLayout";
import { MessageCircle, Send, ChevronLeft, Image } from "lucide-react";
import { api, tokenClaims } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function VendorChats() {
  const [, navigate] = useLocation();
  const [jobs, setJobs] = useState<any[]>([]);
  const [activeJob, setActiveJob] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const claims = tokenClaims();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    import("@/lib/api").then(({ swr }) => {
      swr("vendor_mine", api.vendorMine, (j) => {
        const active = (Array.isArray(j) ? j : []).filter(
          (x) => x.status === "IN_PROGRESS" || x.status === "ASSIGNED"
        );
        setJobs(active);
      }).catch(() => {});
    });
  }, []);

  useEffect(() => {
    if (!activeJob) return;
    const load = () => {
      import("@/lib/api").then(({ swr }) => {
        swr(`messages_${activeJob.job_id}`, () => api.getMessages(activeJob.job_id), setMessages).catch(() => {});
      });
    };
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [activeJob]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!text.trim() || !activeJob) return;
    setSending(true);
    try {
      await api.sendMessage(activeJob.job_id, text.trim());
      setText("");
      const msgs = await api.getMessages(activeJob.job_id);
      setMessages(msgs);
    } catch { } finally { setSending(false); }
  };

  if (activeJob) {
    return (
      <VendorLayout>
        <div className="flex flex-col h-screen pb-20">
          <div className="hero-blue text-white px-4 pt-5 pb-4 flex items-center gap-3 shrink-0">
            <button onClick={() => setActiveJob(null)}><ChevronLeft className="w-6 h-6" /></button>
            <div>
              <h1 className="font-extrabold text-base truncate max-w-[220px]">
                {activeJob.description?.slice(0, 40) || "Job Chat"}
              </h1>
              <p className="text-white/70 text-xs">Consumer</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <p className="text-center text-muted-foreground text-sm mt-10">No messages yet. Say hello!</p>
            )}
            {messages.map((m, i) => {
              const mine = m.sender_id === claims?.sub;
              return (
                <div key={m.message_id ?? i} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${mine ? "bg-primary text-white rounded-br-sm" : "bg-card border border-border text-foreground rounded-bl-sm"}`}>
                    {m.media_url && <img src={m.media_url} className="rounded-lg mb-2 max-h-40 object-cover" alt="" />}
                    <p>{m.content}</p>
                    <p className={`text-[10px] mt-1 ${mine ? "text-white/60" : "text-muted-foreground"}`}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          <div className="px-4 pb-3 flex gap-2 shrink-0 border-t border-border pt-3 bg-background">
            <input
              value={text} onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="Type a message…"
              className="flex-1 h-11 rounded-xl border border-border bg-card px-4 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
            <Button onClick={send} disabled={sending || !text.trim()} size="icon" className="h-11 w-11 rounded-xl">
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </VendorLayout>
    );
  }

  return (
    <VendorLayout>
      <div className="hero-blue text-white px-4 pt-5 pb-6 rounded-b-3xl shadow-md">
        <h1 className="text-xl font-extrabold flex items-center gap-2">
          <MessageCircle className="w-5 h-5" /> Chats
        </h1>
        <p className="text-white/75 mt-1 text-sm">Conversations with your customers</p>
      </div>

      <div className="p-4 space-y-3">
        {jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-20 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <MessageCircle className="w-10 h-10" />
            </div>
            <div>
              <h2 className="font-bold text-lg mb-1">No Active Chats</h2>
              <p className="text-sm text-muted-foreground max-w-[250px]">
                When you are assigned to a job, your chats appear here.
              </p>
            </div>
          </div>
        ) : jobs.map((j) => (
          <button key={j.job_id} onClick={() => setActiveJob(j)}
            className="w-full text-left bg-card border border-border rounded-2xl p-4 flex items-center gap-3 hover:bg-muted/40 transition-colors active:scale-[0.98]">
            <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm truncate">{j.description?.slice(0, 45) || "Service Job"}</p>
              <p className="text-xs text-muted-foreground mt-0.5 capitalize">{j.status?.toLowerCase().replace("_", " ")}</p>
            </div>
          </button>
        ))}
      </div>
    </VendorLayout>
  );
}
