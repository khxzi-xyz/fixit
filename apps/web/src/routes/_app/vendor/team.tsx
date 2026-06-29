import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { api } from "@/lib/api";
import { Users, Plus, Trash2, Loader2, Car } from "lucide-react";

export const Route = createFileRoute("/_app/vendor/team")({
  head: () => ({ meta: [{ title: "Team — FixIt Vendor" }] }),
  component: Team,
});

function Team() {
  const [rows, setRows] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => { try { setRows(await api.team()); } catch { setRows([]); } }, []);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try { await api.addStaff(name, phone || undefined, vehicle || undefined); setName(""); setPhone(""); setVehicle(""); await load(); }
    catch (e) { alert(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); }
  };
  const del = async (id: string) => { try { await api.removeStaff(id); await load(); } catch { /**/ } };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="Zone 6 · Multi-staff shop" title="Team & fleet"
        subtitle="Add operators/vehicles. Multi-staff shops are exempt from the single-job Busy lock (per spec)." />

      <div className="rounded-2xl border border-border bg-white p-5 shadow-[var(--shadow-soft)]">
        <div className="grid gap-2 sm:grid-cols-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Operator name" className="rounded-lg border border-input bg-[var(--offwhite)] px-3 py-2.5 text-sm" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="rounded-lg border border-input bg-[var(--offwhite)] px-3 py-2.5 text-sm" />
          <input value={vehicle} onChange={(e) => setVehicle(e.target.value)} placeholder="Vehicle plate" className="rounded-lg border border-input bg-[var(--offwhite)] px-3 py-2.5 text-sm" />
        </div>
        <button onClick={add} disabled={busy || !name.trim()} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[var(--azure)] px-4 py-2.5 text-sm font-bold text-white hover:bg-[var(--navy)] disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add staff member
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {rows.length === 0 ? (
          <div className="grid place-items-center rounded-2xl border border-dashed border-border py-10 text-sm text-muted-foreground">
            <Users className="mb-2 h-7 w-7 opacity-40" /> Solo trader — add staff to run multiple jobs at once.
          </div>
        ) : rows.map((s) => (
          <div key={s.staff_id} className="flex items-center justify-between rounded-2xl border border-border bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--offwhite)] font-black text-[var(--azure)]">{s.name?.[0]?.toUpperCase()}</div>
              <div>
                <div className="text-sm font-bold text-[var(--navy)]">{s.name}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">{s.phone}{s.vehicle_plate && <><Car className="h-3 w-3" /> {s.vehicle_plate}</>}</div>
              </div>
            </div>
            <button onClick={() => del(s.staff_id)} className="grid h-9 w-9 place-items-center rounded-lg border border-border text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
