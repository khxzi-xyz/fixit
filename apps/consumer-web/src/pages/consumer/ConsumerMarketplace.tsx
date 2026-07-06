import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Plus, Tag } from "lucide-react";
import { api } from "@/lib/api";

export default function ConsumerMarketplace() {
  const [, setLocation] = useLocation();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.marketListings()
      .then(setListings)
      .catch(() => setListings([])) // fallback empty state
      .finally(() => setLoading(false));
  }, []);

  return (
    <ConsumerLayout>
      <div className="bg-primary text-primary-foreground border-b border-border text-white px-4 pt-5 pb-8 rounded-b-3xl shadow-md">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-extrabold flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" /> Open Marketplace
            </h1>
            <p className="text-white/75 mt-1 text-sm">Peer-to-peer goods & materials.</p>
          </div>
          <Button variant="secondary" size="sm" className="rounded-xl font-bold bg-white/20 hover:bg-white/30 border-0 text-white" onClick={() => alert('Post listing coming soon!')}>
            <Plus className="w-4 h-4 mr-1" /> Sell
          </Button>
        </div>
      </div>

      <div className="p-4 -mt-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">Loading listings...</div>
        ) : listings.length === 0 ? (
          <Card className="bg-card border-border shadow-sm rounded-2xl">
            <CardContent className="p-8 text-center space-y-3 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
                <Tag className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg">Marketplace is Empty</h3>
              <p className="text-sm text-muted-foreground">Be the first to list spare parts, tools, or upcycled goods for sale.</p>
              <Button className="mt-2 rounded-xl font-bold shadow-[0_0_20px_rgba(27,110,243,0.3)]">Post an Item</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {listings.map((item, i) => (
              <Card key={i} className="bg-card border-border shadow-sm rounded-2xl overflow-hidden cursor-pointer hover:border-primary/50 transition-colors">
                <div className="aspect-square bg-muted relative">
                  {item.images?.[0] ? (
                    <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                  )}
                  <Badge className="absolute top-2 right-2 bg-black/70 backdrop-blur border-0 text-white font-bold">
                    {item.price} {item.currency || 'OMR'}
                  </Badge>
                </div>
                <CardContent className="p-3">
                  <h3 className="font-bold text-sm line-clamp-1">{item.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ConsumerLayout>
  );
}
