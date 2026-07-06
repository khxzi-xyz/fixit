import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Send, Headset, Sparkles, Ticket } from "lucide-react";

const QUICK = [
  "How does FixIt Work?",
  "Where is my refund?",
  "My vendor didn't show up",
];

/** Permanent FixIt Support conversation — AI answers instantly, with human escalation. */
export default function SupportChat() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.supportChatHistory().then(setMessages).catch(() => setMessages([]));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || sending) return;
    setInput("");
    setSending(true);
    // optimistic user bubble
    setMessages((m) => [...m, { msg_id: `tmp-${Date.now()}`, sender: "USER", content, created_at: new Date().toISOString() }]);
    try {
      const res = await api.supportChatSend(content);
      setMessages((m) => [...m.filter((x) => !String(x.msg_id).startsWith("tmp-")), res.user, res.reply]);
    } catch (e: any) {
      toast({ title: "Couldn't send", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const escalate = async () => {
    if (escalating) return;
    setEscalating(true);
    try {
      const res = await api.supportChatEscalate();
      setMessages((m) => [...m, res.message]);
      toast({ title: "Ticket created 🎫", description: "A human agent will follow up." });
    } catch (e: any) {
      toast({ title: "Couldn't create ticket", description: e.message, variant: "destructive" });
    } finally {
      setEscalating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-r from-[#0d1b2a] to-[#1b3d6e] px-4 py-3 flex items-center gap-3 shadow-md">
        <button onClick={() => navigate("/chats")} className="text-white/80 hover:text-white">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="relative">
          <img src="/logo.png" alt="" className="w-10 h-10 rounded-xl" />
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-[#0d1b2a] rounded-full" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-black text-sm flex items-center gap-1.5">
            FixIt Support <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
          </p>
          <p className="text-primary-foreground/70 text-[11px]">AI assistant · replies instantly · agents available</p>
        </div>
        <button
          onClick={escalate}
          disabled={escalating}
          className="flex items-center gap-1.5 px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-xs font-bold hover:bg-white/20 transition-colors disabled:opacity-50"
        >
          <Headset className="w-3.5 h-3.5" /> {escalating ? "…" : "Talk to an agent"}
        </button>
      </div>

      {/* Thread */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-36">
        {messages.map((m) => {
          const mine = m.sender === "USER";
          const agent = m.sender === "AGENT";
          return (
            <div key={m.msg_id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              {!mine && (
                <img src="/logo.png" alt="" className="w-7 h-7 rounded-lg mr-2 mt-1 shrink-0" />
              )}
              <div
                className={`max-w-[78%] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap rounded-2xl ${
                  mine
                    ? "bg-primary text-white rounded-br-md"
                    : agent
                      ? "bg-amber-500/10 border border-amber-500/30 rounded-bl-md"
                      : "bg-card border border-border rounded-bl-md"
                }`}
              >
                {agent && (
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <Ticket className="w-3 h-3" /> Support team
                  </p>
                )}
                {m.content}
                <p className={`text-[9px] mt-1 ${mine ? "text-white/60" : "text-muted-foreground/60"}`}>
                  {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        {sending && (
          <div className="flex justify-start items-center gap-2">
            <img src="/logo.png" alt="" className="w-7 h-7 rounded-lg" />
            <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3 flex gap-1">
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick replies + input */}
      <div className="fixed bottom-0 inset-x-0 bg-background border-t border-border">
        {messages.length <= 2 && (
          <div className="flex gap-2 px-4 pt-3 overflow-x-auto no-scrollbar">
            {QUICK.map((q) => (
              <button key={q} onClick={() => send(q)}
                className="shrink-0 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-primary/20 text-primary text-xs font-bold rounded-full">
                {q}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 p-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Type your message…"
            className="flex-1 h-12 bg-muted/60 border border-border rounded-xl px-4 text-sm font-medium outline-none focus:border-primary"
          />
          <button onClick={() => send()} disabled={sending || !input.trim()}
            className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center disabled:opacity-40">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
