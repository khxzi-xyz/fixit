import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  ShoppingBag, Search, ChevronLeft, Zap, Star, Clock, Plus, Check, Truck, Filter,
} from "lucide-react";
import { ServiceIcon } from "@/components/ServiceIcon";

const CATEGORIES = [
  { id: "ALL", name: "All Parts" },
  { id: "AC_REPAIR", name: "AC Spare Parts" },
  { id: "PLUMBING", name: "Pipes & Valves" },
  { id: "ELECTRICIAN", name: "Breakers & Wire" },
  { id: "MECHANIC", name: "Oils & Filters" },
  { id: "CLEANING", name: "Washing Equip." },
];

export default function ConsumerStore() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [ordering, setOrdering] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getStoreProducts(query, activeCat)
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [query, activeCat]);

  const addToCart = (id: string, name: string) => {
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    toast({ title: `Added to cart 🛒`, description: name });
  };

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartTotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const p = products.find((x) => x.product_id === id);
    return sum + (p ? p.price_omr * qty : 0);
  }, 0);

  const checkout = async () => {
    const items = Object.entries(cart).map(([product_id, quantity]) => ({ product_id, quantity }));
    if (items.length === 0) return;
    setOrdering(true);
    try {
      await api.placeStoreOrder(items, "Muscat, Oman");
      toast({ title: "Order Placed! 🚀", description: "Express 30-minute delivery dispatched." });
      setCart({});
      navigate("/wallet");
    } catch (e: any) {
      toast({ title: "Order failed", description: e.message, variant: "destructive" });
    } finally {
      setOrdering(false);
    }
  };

  return (
    <ConsumerLayout>
      {/* Hero */}
      <div className="bg-primary text-primary-foreground border-b border-border px-4 pt-10 pb-14 text-white relative">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate("/home")} className="flex items-center gap-2 text-white/80 hover:text-white">
            <ChevronLeft className="w-5 h-5" /> Home
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 backdrop-blur-md rounded-full border border-white/20">
            <Truck className="w-4 h-4 text-green-300" />
            <span className="text-xs font-bold">30-Min Express Delivery</span>
          </div>
        </div>
        <h1 className="text-2xl font-black">FixIt Hardware Store 🛠️</h1>
        <p className="text-primary-foreground/70 text-sm mt-1">Genuine spare parts & equipment delivered to your door</p>

        {/* Search */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search AC capacitors, breakers, oil..."
            className="w-full h-12 bg-white rounded-xl pl-10 pr-4 text-sm font-semibold text-foreground outline-none shadow-md"
          />
        </div>
      </div>

      <div className="px-4 -mt-6 pb-28 space-y-4 relative z-10">
        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCat(c.id)}
              className={`px-4 py-2.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${
                activeCat === c.id
                  ? "bg-primary border-primary text-white shadow-md"
                  : "bg-card border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 4].map((i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-4 h-48 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <ShoppingBag className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="font-bold text-base">No parts found</p>
            <p className="text-xs text-muted-foreground mt-1">Try searching for another spare part.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((p) => (
              <div key={p.product_id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
                <div>
                  <div className="relative h-32 bg-muted overflow-hidden">
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                    {p.badge && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-primary text-white text-[9px] font-black rounded-md shadow">
                        {p.badge}
                      </span>
                    )}
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur text-white text-[9px] font-bold rounded flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-yellow-400" /> {p.delivery_time_mins}m
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-bold line-clamp-2 leading-tight">{p.name}</p>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="font-bold text-foreground">{p.rating}</span>
                      <span>({p.in_stock} in stock)</span>
                    </div>
                  </div>
                </div>
                <div className="px-3 pb-3 flex items-center justify-between mt-2">
                  <div>
                    <p className="text-sm font-black text-primary">{p.price_omr.toFixed(3)}</p>
                    <p className="text-[9px] text-muted-foreground font-bold">OMR</p>
                  </div>
                  <button
                    onClick={() => addToCart(p.product_id, p.name)}
                    className="w-8 h-8 bg-slate-100 dark:bg-slate-800 hover:bg-primary text-primary hover:text-white rounded-xl flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Cart Drawer */}
      {cartCount > 0 && (
        <div className="fixed bottom-16 left-4 right-4 z-40 bg-card border border-border rounded-2xl p-4 shadow-2xl flex items-center justify-between animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center font-black">
              {cartCount}
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-bold">Total Cart</p>
              <p className="text-base font-black text-primary">{cartTotal.toFixed(3)} OMR</p>
            </div>
          </div>
          <button
            onClick={checkout}
            disabled={ordering}
            className="px-6 py-3 bg-primary text-white font-bold rounded-xl flex items-center gap-2 shadow-md hover:bg-primary/90 transition-colors"
          >
            {ordering ? "Dispatched…" : <><span>Checkout</span> <Truck className="w-4 h-4" /></>}
          </button>
        </div>
      )}
    </ConsumerLayout>
  );
}
