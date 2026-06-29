import { useState } from "react";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, CheckCircle } from "lucide-react";
import { Link } from "wouter";

export default function OrderReview() {
  const [rating, setRating] = useState(0);

  return (
    <ConsumerLayout>
      <div className="p-4 space-y-6 max-w-xl mx-auto flex flex-col items-center justify-center min-h-[80vh]">
        <div className="w-24 h-24 bg-success/20 rounded-full flex items-center justify-center mb-2">
          <CheckCircle className="w-12 h-12 text-success" />
        </div>
        
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Job Complete</h1>
          <p className="text-muted-foreground text-sm mt-2">Funds have been released to the vendor. The warranty timer has started.</p>
        </div>

        <Card className="bg-card border-border w-full shadow-lg">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-6">Rate Mohammed's Work</h2>
            
            <div className="flex justify-center gap-2 mb-8">
              {[1, 2, 3, 4, 5].map((star) => (
                <button 
                  key={star} 
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110 active:scale-95"
                >
                  <Star className={`w-10 h-10 ${rating >= star ? 'fill-accent text-accent' : 'text-muted-foreground'}`} />
                </button>
              ))}
            </div>

            <Textarea 
              placeholder="Leave a review (optional)..."
              className="bg-muted border-border rounded-xl min-h-[100px] mb-6 resize-none"
            />

            <Link href="/home" className="block">
              <Button className="w-full h-14 rounded-xl text-lg font-bold shadow-[0_0_15px_rgba(27,110,243,0.3)]">
                Submit Review
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </ConsumerLayout>
  );
}
