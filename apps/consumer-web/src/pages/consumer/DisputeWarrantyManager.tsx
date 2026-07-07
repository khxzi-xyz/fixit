import { useState } from "react";
import { ChevronLeft, AlertTriangle, ShieldCheck, Clock, CheckCircle2, ChevronRight, XCircle } from "lucide-react";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";

export default function DisputeWarrantyManager() {
  const [activeTab, setActiveTab] = useState<"warranties" | "disputes">("warranties");

  const warranties = [
    { id: "J-8931", category: "AC Repair", vendor: "Ali Tech", daysLeft: 12, expires: "2026-07-19", status: "active" },
    { id: "J-7842", category: "Plumbing", vendor: "Oman Services", daysLeft: 0, expires: "2026-06-30", status: "expired" },
  ];

  const disputes = [
    { id: "D-1192", job: "AC Repair (J-8931)", status: "under_review", date: "Today", text: "Vendor didn't fix the leak properly." },
    { id: "D-0922", job: "Electrical Wiring (J-6512)", status: "resolved", date: "Last month", text: "Refund processed successfully." },
  ];

  return (
    <ConsumerLayout>
      <div className="bg-background min-h-screen pb-24">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => window.history.back()} className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-black">Disputes & Warranties</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 mt-4">
          <div className="flex bg-muted rounded-full p-1 relative">
            <button
              onClick={() => setActiveTab("warranties")}
              className={`flex-1 h-10 rounded-full text-sm font-bold z-10 transition-colors ${activeTab === "warranties" ? "bg-background shadow text-primary" : "text-muted-foreground"}`}
            >
              Active Warranties
            </button>
            <button
              onClick={() => setActiveTab("disputes")}
              className={`flex-1 h-10 rounded-full text-sm font-bold z-10 transition-colors ${activeTab === "disputes" ? "bg-background shadow text-primary" : "text-muted-foreground"}`}
            >
              Dispute Logs
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {activeTab === "warranties" && (
            <div className="space-y-4">
              <div className="bg-primary/10 border border-primary/20 p-4 rounded-full flex items-start gap-3">
                <ShieldCheck className="w-6 h-6 text-primary shrink-0" />
                <p className="text-sm text-primary/90 font-medium">Funds are held safely in escrow during the warranty period. If an issue occurs, you can dispute it here before the clock runs out.</p>
              </div>

              {warranties.map(w => (
                <div key={w.id} className="bg-card border border-border rounded-full p-4 shadow-sm relative overflow-hidden">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{w.id}</p>
                      <h3 className="font-black text-lg">{w.category}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">by {w.vendor}</p>
                    </div>
                    {w.status === "active" ? (
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-500 rounded-full">
                          <Clock className="w-4 h-4" />
                          <span className="font-bold text-sm">{w.daysLeft} days left</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">Exp: {w.expires}</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 text-green-500 rounded-full">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="font-bold text-sm">Escrow Released</span>
                        </div>
                      </div>
                    )}
                  </div>
                  {w.status === "active" && (
                    <button className="w-full mt-3 h-10 border border-red-500/30 text-red-500 font-bold text-sm rounded-full hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Raise Dispute
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === "disputes" && (
            <div className="space-y-4">
              {disputes.map(d => (
                <div key={d.id} className="bg-card border border-border rounded-full p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold">{d.job}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{d.date}</p>
                    </div>
                    {d.status === "under_review" ? (
                      <span className="px-2 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-black rounded-full uppercase tracking-wider">Under Review</span>
                    ) : (
                      <span className="px-2 py-1 bg-green-500/10 text-green-500 text-[10px] font-black rounded-full uppercase tracking-wider">Resolved</span>
                    )}
                  </div>
                  <p className="text-sm border-l-2 border-muted pl-3 py-1 my-3 italic text-muted-foreground">"{d.text}"</p>
                  
                  <button className="w-full h-10 bg-muted text-foreground font-bold text-sm rounded-full flex items-center justify-between px-4 mt-2">
                    View Photos & Evidence <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {disputes.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="font-bold text-lg">No Active Disputes</h3>
                  <p className="text-muted-foreground text-sm mt-1">All your jobs are running smoothly.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ConsumerLayout>
  );
}
