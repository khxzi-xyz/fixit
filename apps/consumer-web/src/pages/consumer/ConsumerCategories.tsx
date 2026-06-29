import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { ChevronRight, Wrench, Truck, Zap } from "lucide-react";
import { Link } from "wouter";

const CATEGORIES = [
  {
    title: "Framework A: Repair & Installation",
    icon: Wrench,
    items: ["Plumbing", "Electrical", "AC Repair & Servicing", "Carpentry", "Appliance Repair"]
  },
  {
    title: "Framework B: Transit & Delivery",
    icon: Truck,
    items: ["Furniture Moving", "Water Tanker", "Gas Cylinder Delivery", "Tow Truck Recovery"]
  },
  {
    title: "Framework C: Instant & Gig",
    icon: Zap,
    items: ["Deep Cleaning", "Car Washing", "Pest Control", "Hourly Labor"]
  }
];

export default function ConsumerCategories() {
  return (
    <ConsumerLayout>
      <div className="p-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Full Catalog</h1>
          <p className="text-muted-foreground text-sm">Browse all available services</p>
        </div>

        <div className="space-y-6">
          {CATEGORIES.map((section, idx) => {
            const Icon = section.icon;
            return (
              <div key={idx}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-primary/20 rounded-lg text-primary">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h2 className="font-bold text-foreground">{section.title}</h2>
                </div>
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  {section.items.map((item, itemIdx) => (
                    <Link key={itemIdx} href="/search">
                      <div className="flex items-center justify-between p-4 border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer transition-colors">
                        <span className="font-medium">{item}</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ConsumerLayout>
  );
}
