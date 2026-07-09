import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, CheckCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface RatingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  vendorName?: string;
  onSuccess: () => void;
}

export function RatingModal({ open, onOpenChange, jobId, vendorName, onSuccess }: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setRating(0);
      setComment("");
      setProcessing(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({ title: "Please select a rating" });
      return;
    }
    
    setProcessing(true);
    try {
      await api.submitReview(jobId, rating, comment.trim() || undefined);
      toast({ title: "Review submitted!", description: "Thank you for your feedback." });
      onSuccess();
      onOpenChange(false);
    } catch (e) {
      toast({ title: "Error submitting review", description: e instanceof Error ? e.message : String(e) });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={!processing ? onOpenChange : undefined}>
      <DialogContent className="sm:max-w-md bg-card border-border rounded-3xl p-6 shadow-2xl">
        <DialogHeader className="text-center mb-2">
          <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-3">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <DialogTitle className="text-2xl font-black">Job Completed!</DialogTitle>
          <DialogDescription className="text-muted-foreground mt-1">
            How was your experience{vendorName ? ` with ${vendorName}` : ""}?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 flex flex-col items-center">
          <div className="flex gap-2 mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <button 
                key={star} 
                onClick={() => setRating(star)}
                disabled={processing}
                className="transition-transform hover:scale-110 active:scale-95"
              >
                <Star className={`w-10 h-10 ${rating >= star ? "fill-warning text-warning" : "text-muted-foreground/30"}`} />
              </button>
            ))}
          </div>

          <Textarea 
            value={comment} 
            onChange={(e) => setComment(e.target.value)} 
            placeholder="Tell us what you liked (optional)"
            disabled={processing}
            className="bg-muted border-border rounded-2xl min-h-[100px] mb-6 resize-none w-full p-4" 
          />

          <Button 
            onClick={handleSubmit} 
            disabled={processing || rating === 0}
            className="w-full h-14 rounded-full text-lg font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30 transition-all active:scale-[0.98]"
          >
            {processing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Review"
            )}
          </Button>
          
          <button 
            onClick={() => onOpenChange(false)}
            disabled={processing}
            className="mt-4 text-sm text-muted-foreground font-semibold hover:text-foreground"
          >
            Skip for now
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
