import { useLocation } from "wouter";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { ChevronLeft, Shield } from "lucide-react";

export default function PrivacyPolicy() {
  const [, navigate] = useLocation();
  return (
    <ConsumerLayout>
      <div className="bg-primary text-primary-foreground border-b border-border px-4 pt-10 pb-14">
        <button onClick={() => navigate("/settings")} className="flex items-center gap-2 text-white/80 hover:text-white mb-4">
          <ChevronLeft className="w-5 h-5" /> Back
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Privacy Policy</h1>
            <p className="text-primary-foreground/70 text-sm">Last updated: July 2026</p>
          </div>
        </div>
      </div>
      <div className="px-4 -mt-6 pb-10">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-5 text-sm leading-relaxed text-muted-foreground">
          {[
            ["What We Collect", "We collect your phone number or email for authentication, your name and profile picture if provided, job descriptions and location data when posting a service request, and payment-related metadata (not card numbers -handled by payment processors)."],
            ["How We Use Your Data", "Your data is used to: match you with nearby service providers, process payments through escrow, send you order updates and notifications, and improve our AI matching algorithms."],
            ["Location Data", "Location is only collected when you post a job or track a vendor in real time. We do not track your location in the background."],
            ["Data Sharing", "We share your name and phone number with the vendor assigned to your job. We never sell your personal data to third parties."],
            ["Data Retention", "Your account data is retained for 5 years after account closure for legal and dispute resolution purposes. You may request deletion of non-essential data."],
            ["Security", "All data is encrypted in transit (TLS 1.3) and at rest (AES-256). We use Supabase for authentication, which complies with SOC 2."],
            ["Your Rights", "You have the right to access, correct, or delete your personal data. Submit requests to privacy@fixit-now.xyz and we will respond within 72 hours."],
            ["Cookies", "We use essential session cookies only. No tracking or advertising cookies."],
            ["Contact", "For privacy-related inquiries, contact our Data Protection Officer at privacy@fixit-now.xyz"],
          ].map(([title, content]) => (
            <div key={title as string}>
              <h3 className="font-bold text-foreground mb-1">{title}</h3>
              <p>{content}</p>
            </div>
          ))}
          <div className="pt-4 border-t border-border text-center text-xs">
            Questions? Contact <a href="mailto:privacy@fixit-now.xyz" className="text-primary font-bold">privacy@fixit-now.xyz</a>
          </div>
        </div>
      </div>
    </ConsumerLayout>
  );
}
