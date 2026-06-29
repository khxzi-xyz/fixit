import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Clock, ShieldCheck, X, Check } from "lucide-react";
import { Link, useRoute } from "wouter";

const MOCK_BIDS = [
  { id: 1, name: "Mohammed Al-Rashidi", rating: 4.8, jobs: 124, khidmah: 15, eta: "20 mins", warranty: "7 days" },
  { id: 2, name: "Ali's Plumbing LLC", rating: 4.9, jobs: 890, khidmah: 18, eta: "15 mins", warranty: "30 days" },
  { id: 3, name: "Abdullah Al-Balushi", rating: 4.5, jobs: 45, khidmah: 12, eta: "45 mins", warranty: "3 days" },
];

export default function JobBids() {
  const [, params] = useRoute("/job/:id/bids");

  return (
    <ConsumerLayout>
      <div className="p-4 space-y-6">
        <div>
          <Badge variant="outline" className="mb-2 bg-primary/10 text-primary border-primary/20">JOB #{params?.id || '101'}</Badge>
          <h1 className="text-2xl font-bold tracking-tight">Review Bids</h1>
          <p className="text-muted-foreground text-sm">3 vendors have bid on your Leaking Kitchen Pipe job.</p>
        </div>

        <div className="space-y-4">
          {MOCK_BIDS.map(bid => (
            <Card key={bid.id} className="bg-card border-border relative overflow-hidden group">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{bid.name}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1 text-accent">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="font-medium">{bid.rating}</span>
                      </div>
                      <span>{bid.jobs} jobs</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{bid.khidmah} <span className="text-sm font-medium">OMR</span></p>
                    <p className="text-[10px] text-muted-foreground uppercase">Labor Only</p>
                  </div>
                </div>

                <div className="flex gap-4 mb-5 p-3 bg-muted/50 rounded-xl">
                  <div className="flex-1 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">ETA</p>
                      <p className="font-semibold text-sm">{bid.eta}</p>
                    </div>
                  </div>
                  <div className="w-px bg-border"></div>
                  <div className="flex-1 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-success" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Warranty</p>
                      <p className="font-semibold text-sm">{bid.warranty}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link href={`/job/${params?.id || '101'}/payment`} className="flex-1">
                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl h-12 shadow-[0_0_15px_rgba(27,110,243,0.3)]">
                      <Check className="w-5 h-5 mr-2" /> Accept Bid
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-14 rounded-xl border-border h-12">
                    <X className="w-5 h-5 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </ConsumerLayout>
  );
}
