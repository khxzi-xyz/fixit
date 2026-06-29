import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { api } from "@/lib/api";
import { MapPin, Plus, Trash2, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_app/consumer/addresses")({
  head: () => ({ meta: [{ title: "Address Book — FixIt" }] }),
  component: Addresses,
});

function Addresses() {
  const [rows, setRows] = useState<any[]>([]);
  const [label, setLabel] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => { try { setRows(await api.addresses()); } catch { setRows([]); } }, []);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!label.trim()) return;
    setBusy(true);
    const coords = await new Promise<{ lat?: number; lng?: number }>((res) => {
      if (!navigator.geolocation) return res({});
      navigator.geolocation.getCurrentPosition((p) => res({ lat: p.coords.latitude, lng: p.coords.longitude }), () => res({}), { timeout: 5000 });
    });
    try { await api.addAddress(label, coords.lat, coords.lng, details || undefined); setLabel(""); setDetails(""); await load(); }
    catch (e) { alert(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); }
  };
  const del = async (id: string) => { try { await api.deleteAddress(id); await load(); } catch { /**/ } };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow="Zone 4 · Saved locations" title="Address book" subtitle="Save home/work pins for faster job posting (uses your live GPS)." />
      <div className="rounded-2xl border border-border bg-white p-5 shadow-[var(--shadow-soft)]">
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label (Home, Office…)" className="w-full rounded-lg border border-input bg-[var(--offwhite)] px-3 py-2.5 text-sm" />
        <input value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Building / notes" className="mt-2 w-full rounded-lg border border-input bg-[var(--offwhite)] px-3 py-2.5 text-sm" />
        <button onClick={add} disabled={busy || !label.trim()} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[var(--azure)] px-4 py-2.5 text-sm font-bold text-white hover:bg-[var(--navy)] disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Save current location
        </button>
      </div>
      <div className="mt-5 space-y-3">
        {rows.map((a) => (
          <div key={a.address_id} className="flex items-center justify-between rounded-2xl border border-border bg-white p-4">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-[var(--azure)]" />
              <div><div className="text-sm font-bold text-[var(--navy)]">{a.label}</div>{a.details && <div className="text-xs text-muted-foreground">{a.details}</div>}</div>
            </div>
            <button onClick={() => del(a.address_id)} className="grid h-9 w-9 place-items-center rounded-lg border border-border text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
