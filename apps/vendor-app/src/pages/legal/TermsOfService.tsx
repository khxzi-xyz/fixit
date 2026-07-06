import { useLocation } from "wouter";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { ChevronLeft } from "lucide-react";

export default function TermsOfService() {
  const [, navigate] = useLocation();
  return (
    <ConsumerLayout>
      <div className="bg-primary text-primary-foreground border-b border-border px-4 pt-10 pb-14">
        <button onClick={() => navigate("/settings")} className="flex items-center gap-2 text-white/80 hover:text-white mb-4">
          <ChevronLeft className="w-5 h-5" /> Back
        </button>
        <h1 className="text-2xl font-black text-white">Terms of Service</h1>
        <p className="text-primary-foreground/70 text-sm mt-1">Last updated: July 2026</p>
      </div>
      <div className="px-4 -mt-6 pb-10">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-5 text-sm leading-relaxed text-muted-foreground">
          {[
            ["1. Acceptance of Terms", "By using FixIt Now, you agree to be bound by these Terms. If you do not agree, do not use the platform."],
            ["2. Services", "FixIt Now is a marketplace connecting consumers with verified service providers. We do not directly provide any services and are not responsible for the work quality of vendors."],
            ["3. Account Registration", "You must provide accurate information when registering. You are responsible for maintaining the confidentiality of your account."],
            ["4. Payments & Escrow", "All payments are held in escrow and released upon job completion confirmation. Disputes are handled by our support team within 48 hours."],
            ["5. Prohibited Conduct", "You may not use FixIt Now for illegal activities, harassment, fraud, or any activity that violates applicable law."],
            ["6. Vendor Verification", "While we screen vendors through KYC, FixIt Now does not guarantee the quality of work. Reviews and ratings are the primary quality signal."],
            ["7. Limitation of Liability", "FixIt Now's liability is limited to the amount paid for the specific service in question. We are not liable for indirect damages."],
            ["8. Dispute Resolution", "Disputes should first be submitted through the in-app support system. Unresolved disputes will be settled under Omani law."],
            ["9. Termination", "We reserve the right to suspend accounts that violate these terms without prior notice."],
            ["10. Changes", "We may update these terms periodically. Continued use of the app constitutes acceptance of the updated terms."],
          ].map(([title, content]) => (
            <div key={title as string}>
              <h3 className="font-bold text-foreground mb-1">{title}</h3>
              <p>{content}</p>
            </div>
          ))}
          <div className="pt-4 border-t border-border text-center text-xs">
            Questions? Contact <a href="mailto:legal@fixit-now.xyz" className="text-primary font-bold">legal@fixit-now.xyz</a>
          </div>
        </div>
      </div>
    </ConsumerLayout>
  );
}
