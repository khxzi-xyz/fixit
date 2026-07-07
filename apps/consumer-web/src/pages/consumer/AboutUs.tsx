import { useLocation } from "wouter";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { ChevronLeft, ExternalLink, MessageCircle, Globe, Heart } from "lucide-react";

const TEAM = [
  { name: "Operations Team", role: "Muscat, Oman 🇴🇲", emoji: "🏢" },
  { name: "Tech Team", role: "Building the future", emoji: "💻" },
  { name: "Support Team", role: "24/7 customer care", emoji: "💬" },
];

const STATS = [
  { value: "5,000+", label: "Jobs Completed" },
  { value: "500+", label: "Verified Pros" },
  { value: "4.8★", label: "Average Rating" },
  { value: "8 min", label: "Avg Match Time" },
];

export default function AboutUs() {
  const [, navigate] = useLocation();

  return (
    <ConsumerLayout>
      {/* Hero */}
      <div className="bg-primary text-primary-foreground border-b border-border px-4 pt-10 pb-16 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 50% 50%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <button onClick={() => navigate("/settings")} className="flex items-center gap-2 text-white/70 hover:text-white mb-6 relative z-10">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="relative z-10">
          <img src="/logo.png" alt="FixIt Now" className="w-20 h-20 rounded-full mx-auto mb-4 shadow-xl" />
          <h1 className="text-3xl font-black text-white">FixIt Now</h1>
          <p className="text-primary-foreground/70 mt-2 text-sm max-w-xs mx-auto leading-relaxed">
            Oman's most trusted platform for home services, vehicle care, and professional help -on demand.
          </p>
        </div>
      </div>

      <div className="px-4 -mt-6 pb-10 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          {STATS.map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-full p-4 text-center shadow-sm">
              <p className="text-2xl font-black text-primary">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Mission */}
        <div className="bg-card border border-border rounded-full p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="w-5 h-5 text-red-400" />
            <h3 className="font-black text-base">Our Mission</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            FixIt Now was built to solve a simple problem -finding reliable home service professionals in Oman is hard.
            We connect homeowners with verified, trusted pros using smart matching, real-time tracking, and secure escrow payments.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mt-3">
            Every vendor goes through ID verification and skill assessment. Every payment is protected.
            Every job is backed by our quality guarantee.
          </p>
        </div>

        {/* Team */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1 mb-2">The Team</p>
          <div className="bg-card border border-border rounded-full overflow-hidden shadow-sm">
            {TEAM.map((m, i) => (
              <div key={m.name} className={`flex items-center gap-3 px-4 py-3.5 ${i !== TEAM.length - 1 ? "border-b border-border" : ""}`}>
                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-xl shrink-0">{m.emoji}</div>
                <div>
                  <p className="text-sm font-bold">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact / Links */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1 mb-2">Get in Touch</p>
          <div className="bg-card border border-border rounded-full overflow-hidden shadow-sm">
            {[
              { icon: MessageCircle, label: "WhatsApp Support", sub: "+968 95956361", action: () => window.open("https://wa.me/96895956361", "_blank") },
              { icon: Globe, label: "Website", sub: "fixit-now.xyz", action: () => window.open("https://fixit-now.xyz", "_blank") },
              { icon: ExternalLink, label: "Advertise with Us", sub: "Reach thousands of users", action: () => navigate("/advertise") },
            ].map(({ icon: Icon, label, sub, action }, i) => (
              <button key={label} onClick={action} className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors text-left ${i !== 2 ? "border-b border-border" : ""}`}>
                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>

        {/* Footer links */}
        <div className="flex items-center justify-center gap-4 pt-2">
          <button onClick={() => navigate("/tos")} className="text-xs text-muted-foreground hover:text-primary transition-colors">Terms of Service</button>
          <span className="text-muted-foreground/40">•</span>
          <button onClick={() => navigate("/privacy")} className="text-xs text-muted-foreground hover:text-primary transition-colors">Privacy Policy</button>
        </div>

        <p className="text-center text-[10px] text-muted-foreground/50">FixIt Now v1.0.0 · Made with ❤️ in Oman</p>
      </div>
    </ConsumerLayout>
  );
}
