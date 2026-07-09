import { useCallback, useEffect, useState } from "react";
import { VendorLayout } from "@/components/layouts/VendorLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Image as ImageIcon, Zap, ChevronLeft } from "lucide-react";
import { useRoute, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

export default function VendorJobDetail() {
  const [, params] = useRoute("/vendor/jobs/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const jobId = params?.id;
  const [job, setJob] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [eta, setEta] = useState("30");
  const [warranty, setWarranty] = useState("7");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!jobId) return;
    try { setJob(await api.getJob(jobId)); } catch { /**/ }
  }, [jobId]);
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!jobId) return;
    const bidAmount = parseFloat(amount);
    if (!bidAmount) { toast({ title: "Enter your labor price" }); return; }
    setBusy(true);
    try {
      const warrantyDays = parseInt(warranty, 10) || 0;
      const etaMins = parseInt(eta, 10) || 0;
      await api.submitBid({
        jobId, bidAmount,
        // Payment schedule must sum to 100. Warranty/ETA ride along in the labels.
        proposedMilestones: [
          { label: `On start · ETA ${etaMins} min`, pct: 40 },
          { label: `On completion · ${warrantyDays}-day warranty`, pct: 60 },
        ],
      });
      toast({ title: "Bid placed!", description: "You'll be notified if the client selects you." });
      navigate("/vendor/jobs");
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      toast({ title: "Couldn't place bid", description: m.toLowerCase().includes("token") ? "Out of bid tokens -upgrade to Pro for unlimited bids." : m });
    } finally { setBusy(false); }
  };

  const urgent = String(job?.urgency).toUpperCase() === "EMERGENCY";
  const media: string[] = job?.media_urls ?? job?.photos ?? [];

  return (
    <VendorLayout>
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 text-foreground px-4 pt-5 pb-6 rounded-b-[32px] shadow-sm">
        <button onClick={() => navigate("/vendor/jobs")} className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-3 transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Feed
        </button>
        <div className="flex items-center gap-2 mb-2">
          {urgent && <span className="bg-destructive/10 text-destructive text-[10px] font-bold px-2 py-1 rounded uppercase">Urgent</span>}
          <span className="text-muted-foreground text-xs font-medium">Job #{String(jobId).slice(0, 6)}</span>
        </div>
        <h1 className="text-xl font-extrabold text-foreground">{job?.category_id ? String(job.category_id).replace(/_/g, " ") : "Job"} request</h1>
      </div>

      <div className="p-4 space-y-6 pb-36">
        <p className="text-muted-foreground leading-relaxed bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm rounded-[24px] p-5">
          {job?.description || "Loading job details…"}
        </p>

        <div className="flex items-center gap-3 text-sm font-medium bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm rounded-[24px] p-5">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <span className="text-foreground">Muscat{job?.distance_km ? ` · ~${Number(job.distance_km).toFixed(1)} km away` : ""}</span>
        </div>

        {media.length > 0 && (
          <div>
            <h3 className="font-bold mb-3">Client media</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {media.map((url, i) => (
                <img key={i} src={url} alt="" className="w-24 h-24 rounded-[16px] border border-border object-cover shrink-0" />
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-border pt-6">
          <h2 className="text-lg font-extrabold mb-4">Submit your bid</h2>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Labor (OMR)</Label>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="15" className="h-14 text-lg bg-muted/50 border-0 rounded-[16px]" />
              </div>
              <div className="space-y-2">
                <Label>ETA (mins)</Label>
                <Input type="number" value={eta} onChange={(e) => setEta(e.target.value)} placeholder="30" className="h-14 text-lg bg-muted/50 border-0 rounded-[16px]" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Warranty offer (days)</Label>
              <select value={warranty} onChange={(e) => setWarranty(e.target.value)} className="w-full h-14 px-3 rounded-[16px] border-0 bg-muted/50 text-foreground focus:ring-2 focus:ring-primary outline-none">
                <option value="7">7 Days</option>
                <option value="14">14 Days</option>
                <option value="30">30 Days</option>
                <option value="90">3 Months</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-[68px] left-0 right-0 p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-800/50 z-40">
        <Button onClick={submit} disabled={busy} className="w-full h-14 rounded-full text-lg font-bold">
          <Zap className="w-5 h-5 mr-2" /> {busy ? "Placing bid…" : "Place Bid (1 Token)"}
        </Button>
      </div>
    </VendorLayout>
  );
}
