import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Eye, MousePointer, ToggleLeft, ToggleRight, Loader2, Edit2, X, Check } from "lucide-react";

const EMPTY_AD = {
  title: "", subtitle: "", image_url: "", background_color: "#1B6EF3",
  cta_label: "Learn More", cta_url: "", ad_type: "BANNER", target_screen: "HOME",
  is_active: true,
};

export default function AdminAdsManager() {
  const { toast } = useToast();
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_AD });
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const load = () => {
    api.adminGetAds().then(setAds).catch(() => setAds([])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.title.trim()) { toast({ title: "Title required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      if (editId) {
        await api.adminUpdateAd(editId, form);
        toast({ title: "Ad updated ✅" });
      } else {
        await api.adminCreateAd(form);
        toast({ title: "Ad created ✅" });
      }
      setForm({ ...EMPTY_AD }); setShowForm(false); setEditId(null); load();
    } catch (e: any) {
      toast({ title: e.message || "Failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (ad: any) => {
    try {
      await api.adminUpdateAd(ad.ad_id, { ...ad, is_active: !ad.is_active });
      setAds((prev) => prev.map((a) => a.ad_id === ad.ad_id ? { ...a, is_active: !a.is_active } : a));
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this ad?")) return;
    try { await api.adminDeleteAd(id); load(); toast({ title: "Deleted" }); } catch { /**/ }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black">Ads Manager</h2>
          <p className="text-muted-foreground text-sm mt-1">Create and publish in-app advertisements</p>
        </div>
        <button onClick={() => { setForm({ ...EMPTY_AD }); setEditId(null); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> New Ad
        </button>
      </div>

      {/* Create/Edit form */}
      {showForm && (
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">{editId ? "Edit Ad" : "Create New Ad"}</h3>
            <button onClick={() => { setShowForm(false); setEditId(null); }}><X className="w-5 h-5 text-muted-foreground" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "title", label: "Title *", placeholder: "Ad headline" },
              { key: "subtitle", label: "Subtitle", placeholder: "Supporting text" },
              { key: "cta_label", label: "Button Text", placeholder: "e.g. Learn More" },
              { key: "cta_url", label: "Button URL", placeholder: "/upgrade or https://..." },
              { key: "image_url", label: "Image URL", placeholder: "https://..." },
              { key: "background_color", label: "Background Color", placeholder: "#1B6EF3" },
            ].map(({ key, label, placeholder }) => (
              <div key={key} className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">{label}</label>
                <input
                  value={(form as any)[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full h-10 bg-muted/60 border border-border rounded-xl px-3 text-sm outline-none focus:border-primary"
                />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">Ad Type</label>
              <select value={form.ad_type} onChange={(e) => setForm((f) => ({ ...f, ad_type: e.target.value }))} className="w-full h-10 bg-muted/60 border border-border rounded-xl px-3 text-sm outline-none">
                {["BANNER", "CARD", "POPUP", "CATEGORY"].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">Target Screen</label>
              <select value={form.target_screen} onChange={(e) => setForm((f) => ({ ...f, target_screen: e.target.value }))} className="w-full h-10 bg-muted/60 border border-border rounded-xl px-3 text-sm outline-none">
                {["HOME", "POST_JOB", "WALLET", "PROFILE", "ALL"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
              className={`flex items-center gap-2 px-3 py-1.5 border rounded-xl text-sm font-bold ${form.is_active ? "border-green-500/30 text-green-400" : "border-border text-muted-foreground"}`}
            >
              {form.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              {form.is_active ? "Active" : "Inactive"}
            </button>
            <div className="ml-auto flex gap-2">
              <button onClick={() => { setShowForm(false); setEditId(null); }} className="px-4 py-2 border border-border rounded-xl text-sm text-muted-foreground">Cancel</button>
              <button onClick={save} disabled={saving} className="px-4 py-2 bg-primary text-white font-bold rounded-xl text-sm flex items-center gap-2">
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                {editId ? "Update" : "Publish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ads list */}
      {loading ? (
        <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : ads.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="font-bold">No ads yet</p>
          <p className="text-sm mt-1">Create your first ad to display in the consumer app</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ads.map((ad: any) => (
            <div key={ad.ad_id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: ad.background_color || "#1B6EF3" }}>
                <span className="text-white font-black text-xs">{ad.ad_type?.slice(0, 2)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm">{ad.title}</p>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${ad.is_active ? "bg-green-500/15 text-green-400" : "bg-muted text-muted-foreground"}`}>
                    {ad.is_active ? "Live" : "Paused"}
                  </span>
                </div>
                {ad.subtitle && <p className="text-xs text-muted-foreground truncate">{ad.subtitle}</p>}
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><Eye className="w-3 h-3" />{ad.impressions || 0}</span>
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><MousePointer className="w-3 h-3" />{ad.clicks || 0}</span>
                  <span className="text-[10px] text-muted-foreground">{ad.target_screen}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => toggle(ad)} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-primary rounded-lg hover:bg-primary/10">
                  {ad.is_active ? <ToggleRight className="w-4 h-4 text-green-400" /> : <ToggleLeft className="w-4 h-4" />}
                </button>
                <button onClick={() => { setForm({ ...ad }); setEditId(ad.ad_id); setShowForm(true); }} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-primary rounded-lg hover:bg-primary/10">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => remove(ad.ad_id)} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-red-400 rounded-lg hover:bg-red-500/10">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
