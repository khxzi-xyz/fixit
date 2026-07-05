import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, ShieldCheck, ChevronLeft, MapPin } from "lucide-react";
import { api } from "@/lib/api";

export default function PublicVendorProfile() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/vendor/:id");
  const vendorId = params?.id;
  const [profile, setProfile] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!vendorId) return;
    Promise.all([
      api.vendorReviews(vendorId).then((r) => setReviews(Array.isArray(r) ? r : [])).catch(() => {}),
      // We will add publicProfile endpoint soon
      api.publicVendorProfile(vendorId).then(setProfile).catch(() => {})
    ]).finally(() => setLoading(false));
  }, [vendorId]);

  if (loading) {
    return (
      <ConsumerLayout>
        <div className="flex items-center justify-center h-64 text-muted-foreground">Loading vendor...</div>
      </ConsumerLayout>
    );
  }

  if (!profile) {
    return (
      <ConsumerLayout>
        <div className="hero-blue text-white px-4 pt-5 pb-5 rounded-b-3xl shadow-md flex items-center gap-3">
          <button onClick={() => window.history.back()}><ChevronLeft className="w-6 h-6" /></button>
          <h1 className="text-xl font-extrabold">Vendor Not Found</h1>
        </div>
      </ConsumerLayout>
    );
  }

  const name = profile.full_name || "FixIt Vendor";
  const initials = name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + (r.rating ?? r.rating_stars ?? 0), 0) / reviews.length) : null;
  const isVerified = profile.verification_status === 'VERIFIED';
  const pfp = profile.avatar_url;

  return (
    <ConsumerLayout>
      <div className="hero-blue text-white px-4 pt-5 pb-16 rounded-b-3xl shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => window.history.back()}><ChevronLeft className="w-6 h-6" /></button>
          <h1 className="text-xl font-extrabold">Shop Profile</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-white/15 backdrop-blur rounded-full flex items-center justify-center font-black text-2xl shrink-0 border-2 border-white/20 overflow-hidden">
            {pfp ? <img src={pfp} className="w-full h-full object-cover" /> : initials}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold truncate">{name}</h2>
              {isVerified && <ShieldCheck className="w-5 h-5 text-white shrink-0" />}
            </div>
            <div className="flex items-center gap-2 text-sm text-white/80 mt-1">
              <Star className="w-4 h-4 fill-current" /><span className="font-bold">{avgRating != null ? avgRating.toFixed(1) : "—"}</span>
              <span className="text-white/60">· {reviews.length} review{reviews.length === 1 ? "" : "s"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-10 space-y-6">
        <div>
          <h3 className="font-extrabold text-base mb-3 text-foreground">About</h3>
          <Card className="bg-card border-border shadow-sm rounded-2xl">
            <CardContent className="p-4 space-y-3">
              <p className="text-sm text-muted-foreground">{profile.bio || "No description provided."}</p>
              {profile.radius_meters > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 text-primary" />
                  Service Area: {profile.radius_meters / 1000} km
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <h3 className="font-extrabold text-base mb-3 text-foreground">Services Offered</h3>
          {profile.categories?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.categories.map((c: any) => (
                <Badge key={c.category_id} className="bg-primary/10 text-primary border-primary/20">{c.display_name || c.category_id}</Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No specific services listed.</p>
          )}
        </div>

        <div>
          <h3 className="font-extrabold text-base mb-3 text-foreground">Reviews</h3>
          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reviews yet.</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((r, i) => (
                <Card key={i} className="bg-card border-border shadow-sm rounded-2xl">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-1 mb-2 text-primary">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star key={idx} className={`w-3.5 h-3.5 ${idx < (r.rating ?? r.rating_stars ?? 0) ? "fill-current" : "opacity-30"}`} />
                      ))}
                    </div>
                    <p className="text-sm">{r.body || r.review_text || "No written review."}</p>
                    <p className="text-[11px] text-muted-foreground mt-2">{r.created_at ? new Date(r.created_at).toLocaleDateString() : "Unknown date"}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </ConsumerLayout>
  );
}
