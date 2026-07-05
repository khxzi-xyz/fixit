import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles, Heart, ChevronLeft, ArrowRight, Star, ShieldCheck, Flame, MessageSquare,
} from "lucide-react";

export default function ConsumerFeed() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getFeed()
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  const toggleLike = async (postId: string) => {
    try {
      const updated = await api.toggleFeedLike(postId);
      setPosts((prev) => prev.map((p) => (p.post_id === postId ? updated : p)));
    } catch { /**/ }
  };

  return (
    <ConsumerLayout>
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0d1b2a] via-[#1b3d6e] to-[#1B6EF3] px-4 pt-10 pb-14 text-white">
        <button onClick={() => navigate("/home")} className="flex items-center gap-2 text-white/80 hover:text-white mb-3">
          <ChevronLeft className="w-5 h-5" /> Home
        </button>
        <div className="flex items-center gap-2 mb-1">
          <Flame className="w-7 h-7 text-orange-400" />
          <h1 className="text-2xl font-black">Pro Transformations Feed</h1>
        </div>
        <p className="text-blue-200 text-sm">Real before & after proof of work from verified FixIt pros</p>
      </div>

      <div className="px-4 -mt-6 pb-28 space-y-5 relative z-10 max-w-lg mx-auto">
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-card border border-border rounded-3xl h-96 animate-pulse" />
            ))}
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.post_id} className="bg-card border border-border rounded-3xl overflow-hidden shadow-lg space-y-3">
              {/* Vendor Header */}
              <div className="p-4 flex items-center justify-between border-b border-border">
                <div className="flex items-center gap-3">
                  <img src={post.vendor_avatar} alt={post.vendor_name} className="w-11 h-11 rounded-2xl object-cover border border-border" />
                  <div>
                    <h3 className="font-bold text-sm flex items-center gap-1">
                      {post.vendor_name} <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-semibold">{post.category_id.replace(/_/g, " ")}</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/post-job?category=${post.category_id}`)}
                  className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-xl shadow hover:bg-primary/90"
                >
                  Book Pro
                </button>
              </div>

              {/* Photos Comparison */}
              <div className="grid grid-cols-2 gap-1 px-4">
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
                  <img src={post.before_image} alt="Before" className="w-full h-full object-cover" />
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/70 text-white text-[9px] font-black rounded backdrop-blur">
                    BEFORE
                  </span>
                </div>
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted border-2 border-primary/40">
                  <img src={post.after_image} alt="After" className="w-full h-full object-cover" />
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-primary text-white text-[9px] font-black rounded shadow">
                    AFTER ✨
                  </span>
                </div>
              </div>

              {/* Post Details */}
              <div className="px-4 pb-4 space-y-3">
                <h4 className="font-extrabold text-base leading-tight">{post.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{post.description}</p>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <button
                    onClick={() => toggleLike(post.post_id)}
                    className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-red-500"
                  >
                    <Heart className={`w-5 h-5 ${post.is_liked ? "fill-red-500 text-red-500" : ""}`} />
                    <span>{post.likes_count} Likes</span>
                  </button>

                  <div className="text-right">
                    <span className="text-xs text-muted-foreground font-bold">Job Cost: </span>
                    <span className="text-sm font-black text-primary">{post.job_price_omr.toFixed(3)} OMR</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </ConsumerLayout>
  );
}
