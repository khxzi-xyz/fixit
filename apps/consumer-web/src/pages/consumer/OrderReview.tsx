import { useState } from "react";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, CheckCircle } from "lucide-react";
import { useRoute, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

export default function OrderReview() {
  const [, params] = useRoute("/order/:id/review");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const jobId = params?.id;
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!jobId || rating < 1) { toast({ title: "Pick a rating first" }); return; }
    setBusy(true);
    try {
      await api.submitReview(jobId, rating, body.trim() || undefined);
      toast({ title: "Thanks for your review!", description: "Funds released to the pro. Warranty timer started." });
      navigate("/home");
    } catch (e) {
      toast({ title: "Couldn't submit", description: e instanceof Error ? e.message : String(e) });
    } finally { setBusy(false); }
  };

  return (
    <ConsumerLayout>
      <div className="px-4 py-6 max-w-xl mx-auto flex flex-col items-center justify-center min-h-[80vh]">
        <div className="w-24 h-24 bg-success/15 rounded-full flex items-center justify-center mb-3">
          <CheckCircle className="w-12 h-12 text-success" />
        </div>
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black tracking-tight">Job Complete</h1>
          <p className="text-muted-foreground text-sm mt-2">Funds released to the pro. The warranty timer has started.</p>
        </div>

        <Card className="bg-card border-border w-full shadow-lg rounded-full">
          <CardContent className="p-6 text-center">
            <h2 className="text-lg font-extrabold mb-6">Rate the work</h2>
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setRating(star)} className="transition-transform hover:scale-110 active:scale-95">
                  <Star className={`w-10 h-10 ${rating >= star ? "fill-warning text-warning" : "text-muted-foreground/40"}`} />
                </button>
              ))}
            </div>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Leave a review (optional)…"
              className="bg-muted border-border rounded-full min-h-[100px] mb-6 resize-none" />
            <Button onClick={submit} disabled={busy} className="w-full h-14 rounded-full text-lg font-bold">
              {busy ? "Submitting…" : "Submit Review"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </ConsumerLayout>
  );
}
