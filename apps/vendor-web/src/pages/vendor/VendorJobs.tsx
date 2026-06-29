import { VendorLayout } from "@/components/layouts/VendorLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Clock, Zap, SlidersHorizontal } from "lucide-react";
import { Link } from "wouter";

const MOCK_FEED = [
  { id: 105, title: "Install Water Heater", area: "Bousher", urgency: "High", type: "Auction", time: "5 mins ago", distance: "2.4 km" },
  { id: 106, title: "Blocked Drain in Bathroom", area: "Al Khuwair", urgency: "Medium", type: "Bounty", bounty: "12 OMR", time: "12 mins ago", distance: "5.1 km" },
  { id: 107, title: "Fix Leaking Toilet", area: "Azaiba", urgency: "Low", type: "Auction", time: "1 hour ago", distance: "8.0 km" },
];

export default function VendorJobs() {
  return (
    <VendorLayout>
      <div className="p-4 space-y-4">
        
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-bold tracking-tight">Job Feed</h1>
          <button className="w-10 h-10 bg-card border border-border rounded-xl flex items-center justify-center text-foreground hover:bg-muted transition-colors">
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          <Badge className="bg-primary hover:bg-primary text-primary-foreground px-4 py-2 rounded-full cursor-pointer whitespace-nowrap text-sm">
            All Matches
          </Badge>
          <Badge variant="outline" className="px-4 py-2 rounded-full cursor-pointer hover:bg-muted border-border whitespace-nowrap text-sm">
            Plumbing
          </Badge>
          <Badge variant="outline" className="px-4 py-2 rounded-full cursor-pointer hover:bg-muted border-border whitespace-nowrap text-sm">
            High Urgency
          </Badge>
        </div>

        <div className="space-y-4 mt-2">
          {MOCK_FEED.map(job => (
            <Link key={job.id} href={`/vendor/jobs/${job.id}`}>
              <Card className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer rounded-xl relative overflow-hidden group">
                {job.type === 'Bounty' && (
                  <div className="absolute top-0 right-0 bg-accent text-accent-foreground text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                    BOUNTY: {job.bounty}
                  </div>
                )}
                <CardContent className="p-5">
                  <div className="flex items-start gap-2 mb-2">
                    {job.urgency === 'High' && <Zap className="w-4 h-4 text-destructive shrink-0 mt-1" />}
                    <h3 className="font-bold text-lg leading-tight text-foreground group-hover:text-primary transition-colors">{job.title}</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-y-2 text-sm mt-4">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{job.area} ({job.distance})</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground justify-end">
                      <Clock className="w-4 h-4" />
                      <span>{job.time}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

      </div>
    </VendorLayout>
  );
}
