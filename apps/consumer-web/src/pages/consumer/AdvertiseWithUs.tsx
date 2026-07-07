import { useState } from "react";
import { useLocation } from "wouter";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { api, tokenClaims } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft, Store, Package, Wrench, Send, CheckCircle, Loader2,
  TrendingUp, Users, Eye, BarChart3,
} from "lucide-react";

const AD_TYPES = [
  { id: "SHOP", label: "Shop / Business", icon: Store, desc: "Promote your retail shop or local business" },
  { id: "PRODUCT", label: "Product", icon: Package, desc: "Advertise a specific product to our users" },
  { id: "SERVICE", label: "Service", icon: Wrench, desc: "List your professional service to local customers" },
  { id: "OTHER", label: "Other", icon: TrendingUp, desc: "Something else? Tell us about it" },
];

const REACH_STATS = [
  { value: "15K+", label: "Monthly active users", icon: Users },
  { value: "50K+", label: "Ad impressions/month", icon: Eye },
  { value: "4.8%", label: "Avg click-through rate", icon: BarChart3 },
];

export default function AdvertiseWithUs() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const claims = tokenClaims();

  const [adType, setAdType] = useState("SHOP");
  const [businessName, setBusinessName] = useState("");
  const [contactName, setContactName] = useState(claims?.full_name || "");
  const [phone, setPhone] = useState(claims?.phone || "");
  const [email, setEmail] = useState(claims?.email || "");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!businessName.trim() || !contactName.trim() || !phone.trim()) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await api.submitAdvertiseLead({
        business_name: businessName,
        contact_name: contactName,
        phone,
        email: email || undefined,
        ad_type: adType,
        description: description || undefined,
        budget_omr: budget ? parseFloat(budget) : undefined,
      });
      setDone(true);
    } catch (e: any) {
      toast({ title: e.message || "Submission failed -try again", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <ConsumerLayout>
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center gap-6">
          <div className="w-24 h-24 bg-green-500/15 rounded-full flex items-center justify-center">
            <CheckCircle className="w-14 h-14 text-green-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black">Request Submitted!</h2>
            <p className="text-muted-foreground mt-2 text-sm max-w-xs mx-auto">Our advertising team will review your request and reach out within 24-48 hours.</p>
          </div>
          <button onClick={() => navigate("/home")} className="px-8 py-3 bg-primary text-white font-bold rounded-full">
            Back to Home
          </button>
        </div>
      </ConsumerLayout>
    );
  }

  return (
    <ConsumerLayout>
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-900 via-orange-800 to-yellow-700 px-4 pt-10 pb-14 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <button onClick={() => navigate("/settings")} className="flex items-center gap-2 text-white/80 hover:text-white mb-4 relative z-10">
          <ChevronLeft className="w-5 h-5" /> Back
        </button>
        <div className="relative z-10">
          <TrendingUp className="w-8 h-8 text-yellow-300 mb-2" />
          <h1 className="text-2xl font-black text-white">Advertise with Us</h1>
          <p className="text-yellow-200 text-sm mt-1">Reach thousands of customers in Oman</p>
        </div>
      </div>

      <div className="px-4 -mt-6 pb-10 space-y-4">
        {/* Reach stats */}
        <div className="grid grid-cols-3 gap-2">
          {REACH_STATS.map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-full p-3 text-center shadow-sm">
              <s.icon className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="text-base font-black text-primary">{s.value}</p>
              <p className="text-[9px] text-muted-foreground leading-tight">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Ad type selection */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide px-1 mb-2">I want to advertise a…</p>
          <div className="grid grid-cols-2 gap-2">
            {AD_TYPES.map(({ id, label, icon: Icon, desc }) => (
              <button
                key={id}
                onClick={() => setAdType(id)}
                className={`flex flex-col items-start gap-2 p-4 border-2 rounded-full transition-all text-left ${adType === id ? "border-primary bg-primary/8" : "border-border bg-card"}`}
              >
                <Icon className={`w-6 h-6 ${adType === id ? "text-primary" : "text-muted-foreground"}`} />
                <div>
                  <p className="text-sm font-bold">{label}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="bg-card border border-border rounded-full p-4 shadow-sm space-y-3">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Your Details</p>

          {[
            { label: "Business / Brand Name *", value: businessName, onChange: setBusinessName, placeholder: "e.g. Ali's Electronics" },
            { label: "Contact Name *", value: contactName, onChange: setContactName, placeholder: "Your name" },
            { label: "Phone Number *", value: phone, onChange: setPhone, placeholder: "+968 XXXX XXXX" },
            { label: "Email (optional)", value: email, onChange: setEmail, placeholder: "contact@business.com" },
          ].map(({ label, value, onChange, placeholder }) => (
            <div key={label} className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">{label}</label>
              <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full h-11 bg-muted/60 border border-border rounded-full px-3 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          ))}

          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground">About Your Ad (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us about what you're advertising, your target audience, and campaign goals..."
              rows={3}
              className="w-full bg-muted/60 border border-border rounded-full px-3 py-2.5 text-sm font-medium outline-none focus:border-primary resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground">Monthly Budget (OMR, optional)</label>
            <div className="relative">
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="0.000"
                className="w-full h-11 bg-muted/60 border border-border rounded-full pl-3 pr-12 text-sm font-medium outline-none focus:border-primary"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">OMR/mo</span>
            </div>
          </div>
        </div>

        <button
          onClick={submit}
          disabled={submitting || !businessName.trim() || !contactName.trim() || !phone.trim()}
          className="w-full h-14 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-black rounded-full flex items-center justify-center gap-2 disabled:opacity-40 shadow-lg hover:shadow-xl transition-all"
        >
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-5 h-5" /> Submit Request</>}
        </button>

        <p className="text-center text-xs text-muted-foreground">Our team will contact you within 24-48 hours via WhatsApp or email.</p>
      </div>
    </ConsumerLayout>
  );
}
