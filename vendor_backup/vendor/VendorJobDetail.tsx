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
      <div className="hero-blue text-white px-4 pt-5 pb-6 rounded-b-3xl shadow-md">
        <button onClick={() => navigate("/vendor/jobs")} className="inline-flex items-center text-sm font-medium text-white/80 mb-3">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Feed
        </button>
        <div className="flex items-center gap-2 mb-2">
          {urgent && <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-1 rounded uppercase">Urgent</span>}
          <span className="text-white/70 text-xs">Job #{String(jobId).slice(0, 6)}</span>
        </div>
        <h1 className="text-xl font-extrabold">{job?.category_id ? String(job.category_id).replace(/_/g, " ") : "Job"} request</h1>
      </div>

      <div className="p-4 space-y-6 pb-36">
        <p className="text-muted-foreground leading-relaxed bg-card p-4 rounded-2xl border border-border shadow-sm">
          {job?.description || "Loading job details…"}
        </p>

        <div className="flex items-center gap-2 text-sm font-medium bg-card border border-border p-3 rounded-2xl shadow-sm">
          <MapPin className="w-5 h-5 text-primary" />
          <span>Muscat{job?.distance_km ? ` · ~${Number(job.distance_km).toFixed(1)} km away` : ""}</span>
        </div>

        {media.length > 0 && (
          <div>
            <h3 className="font-bold mb-3">Client media</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {media.map((url, i) => (
                <img key={i} src={url} alt="" className="w-24 h-24 rounded-xl border border-border object-cover shrink-0" />
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
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="15" className="h-14 text-lg bg-card border-border rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>ETA (mins)</Label>
                <Input type="number" value={eta} onChange={(e) => setEta(e.target.value)} placeholder="30" className="h-14 text-lg bg-card border-border rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Warranty offer (days)</Label>
              <select value={warranty} onChange={(e) => setWarranty(e.target.value)} className="w-full h-14 px-3 rounded-xl border border-border bg-card text-foreground focus:ring-2 focus:ring-primary outline-none">
                <option value="7">7 Days</option>
                <option value="14">14 Days</option>
                <option value="30">30 Days</option>
                <option value="90">3 Months</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-[68px] left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border z-40">
        <Button onClick={submit} disabled={busy} className="w-full h-14 rounded-xl text-lg font-bold">
          <Zap className="w-5 h-5 mr-2" /> {busy ? "Placing bid…" : "Place Bid (1 Token)"}
        </Button>
      </div>
    </VendorLayout>
  );
}
