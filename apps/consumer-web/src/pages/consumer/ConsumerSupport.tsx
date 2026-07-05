import { useState } from "react";
import { useLocation } from "wouter";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft, MessageCircle, Phone, Mail, ChevronDown, ChevronUp,
  Send, AlertCircle, CheckCircle, ExternalLink, Zap,
} from "lucide-react";

import { tokenClaims } from "@/lib/api";

const FAQ = [
  { q: "How do I track my service provider?", a: "Once a vendor accepts your job and starts traveling, a live map tracking screen activates automatically. You'll see real-time location updates every 5 seconds." },
  { q: "How does the escrow payment work?", a: "Your payment is held securely in escrow and only released to the vendor after you confirm the job is complete. If you're not satisfied, you can raise a dispute." },
  { q: "Can I cancel a job after posting?", a: "Yes. You can cancel any job that hasn't been accepted yet for free. Once a vendor is assigned, a small cancellation fee may apply." },
  { q: "How do I get a refund?", a: "Refunds are processed within 2-5 business days back to your FixIt Wallet. From there you can withdraw to your bank or use it for future services." },
  { q: "What is FixIt Plus?", a: "FixIt Plus is our premium subscription giving you priority matching, zero service fees, and exclusive vendor access. Great for regular service users." },
  { q: "OTP not received?", a: "Check your SMS messages first - we send OTPs via SMS by default. If not received within 60 seconds, tap Resend. Also verify the country code is correct." },
];

export default function ConsumerSupport() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const claims = tokenClaims();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const waMessage = encodeURIComponent(`Hi FixIt Support! My name is ${claims?.full_name || "FixIt User"} (${claims?.phone || claims?.email || "No contact"}). I need help with my FixIt Now account.`);
  const waUrl = `https://wa.me/96895956361?text=${waMessage}`;

  const submitTicket = async () => {
    if (!subject.trim() || !body.trim()) {
      toast({ title: "Fill in subject and message", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await api.createSupportTicket(subject, body);
      setSubmitted(true);
      setSubject("");
      setBody("");
    } catch {
      toast({ title: "Couldn't submit -try again", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ConsumerLayout>
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0d1b2a] via-[#1b3d6e] to-[#1B6EF3] px-4 pt-10 pb-14">
        <button onClick={() => navigate("/profile")} className="flex items-center gap-2 text-white/80 hover:text-white mb-4">
          <ChevronLeft className="w-5 h-5" /> Back
        </button>
        <h1 className="text-2xl font-black text-white">Help & Support</h1>
        <p className="text-blue-200 text-sm mt-1">We're here for you 24/7</p>
      </div>

      <div className="px-4 -mt-6 pb-10 space-y-4">
        {/* Quick contact */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: MessageCircle, label: "Live WhatsApp", sub: "< 2 min", href: waUrl, color: "from-green-500 to-emerald-600" },
            { icon: Phone, label: "Call Us", sub: "+968 95956361", href: "tel:+96895956361", color: "from-blue-500 to-blue-700" },
            { icon: Mail, label: "Email", sub: "24h reply", href: "mailto:support@fixit-now.xyz", color: "from-purple-500 to-purple-700" },
          ].map((c) => (
            <a
              key={c.label}
              href={c.href}
              target="_blank"
              rel="noreferrer"
              className={`flex flex-col items-center gap-2 py-4 bg-gradient-to-br ${c.color} rounded-2xl text-white shadow-lg hover:scale-[1.03] active:scale-95 transition-transform text-center`}
            >
              <c.icon className="w-6 h-6" />
              <div>
                <p className="text-sm font-bold">{c.label}</p>
                <p className="text-[10px] opacity-80">{c.sub}</p>
              </div>
            </a>
          ))}
        </div>

        {/* Submit ticket */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1 mb-2">Submit a Ticket</p>
          <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-3">
            {submitted ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="w-14 h-14 bg-green-500/15 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="font-bold text-base">Ticket Submitted!</h3>
                <p className="text-sm text-muted-foreground">Our team will reply within 24 hours. Check your email or WhatsApp.</p>
                <button onClick={() => setSubmitted(false)} className="text-primary text-sm font-bold hover:underline mt-2">
                  Submit another →
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Subject</label>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="What's the issue?"
                    className="w-full h-11 bg-muted/60 border border-border rounded-xl px-3 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Message</label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Describe the problem in detail…"
                    rows={4}
                    className="w-full bg-muted/60 border border-border rounded-xl px-3 py-2.5 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                  />
                </div>
                <button
                  onClick={submitTicket}
                  disabled={submitting || !subject.trim() || !body.trim()}
                  className="w-full h-11 bg-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {submitting ? (
                    <Zap className="w-4 h-4 animate-pulse" />
                  ) : (
                    <><Send className="w-4 h-4" /> Send Message</>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* FAQ */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1 mb-2">Frequently Asked Questions</p>
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            {FAQ.map((faq, i) => (
              <div key={i} className={i !== FAQ.length - 1 ? "border-b border-border" : ""}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-start gap-3 px-4 py-3.5 text-left hover:bg-muted/30 transition-colors"
                >
                  <AlertCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span className="flex-1 text-sm font-semibold">{faq.q}</span>
                  {openFaq === i ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 pt-0">
                    <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 rounded-xl p-3">
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Legal links */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          {[
            { label: "Terms of Service", href: "/tos" },
            { label: "Privacy Policy", href: "/privacy" },
          ].map((l, i) => (
            <button
              key={l.label}
              onClick={() => navigate(l.href)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors text-left ${i !== 1 ? "border-b border-border" : ""}`}
            >
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
              <span className="flex-1 text-sm font-medium">{l.label}</span>
              <ChevronLeft className="w-4 h-4 text-muted-foreground rotate-180" />
            </button>
          ))}
        </div>
      </div>
    </ConsumerLayout>
  );
}
