import { useState } from "react";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const MOCK_RESULTS = [
  { id: 1, title: "AC Cleaning & Gas Top-up", category: "AC Repair", price: "Starts at 15 OMR" },
  { id: 2, title: "Water Heater Installation", category: "Plumbing", price: "Starts at 10 OMR" },
  { id: 3, title: "Washing Machine Repair", category: "Appliance", price: "Starts at 12 OMR" },
  { id: 4, title: "Deep Cleaning Studio", category: "Cleaning", price: "Starts at 25 OMR" },
];

export default function ConsumerSearch() {
  const [query, setQuery] = useState("");

  return (
    <ConsumerLayout>
      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-bold tracking-tight mb-2">Search Services</h1>
        
        <div className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for any service..." 
              className="pl-10 h-12 bg-card border-border rounded-xl"
            />
          </div>
          <button className="w-12 h-12 bg-card border border-border rounded-xl flex items-center justify-center text-foreground hover:bg-muted transition-colors">
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {["All", "Plumbing", "Electrical", "AC", "Cleaning", "Auto"].map(tag => (
            <Badge key={tag} variant="outline" className="px-4 py-2 rounded-full cursor-pointer hover:bg-primary hover:text-primary-foreground border-border whitespace-nowrap text-sm">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="space-y-3 mt-4">
          <p className="text-sm font-medium text-muted-foreground mb-2">Popular Results</p>
          {MOCK_RESULTS.map(item => (
            <div key={item.id} className="p-4 bg-card border border-border rounded-xl flex justify-between items-center hover:border-primary/50 cursor-pointer transition-colors">
              <div>
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.category}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-1 rounded-md">{item.price}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ConsumerLayout>
  );
}
