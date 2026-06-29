import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { api } from "@/lib/api";
import { ShieldCheck, Upload, CheckCircle2, Loader2, Clock, XCircle } from "lucide-react";

export const Route = createFileRoute("/_app/vendor/kyc")({
  head: () => ({ meta: [{ title: "Verification — FixIt Vendor" }] }),
  component: Kyc,
});

const DOCS = [
  { type: "NATIONAL_ID", label: "National ID / Passport" },
  { type: "COMMERCIAL_REGISTRATION", label: "Commercial Registration" },
  { type: "TRADE_LICENSE", label: "Trade License" },
  { type: "INSURANCE", label: "Insurance (optional)" },
] as const;

function Kyc() {
  const [docs, setDocs] = useState<any[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const load = useCallback(async () => { try { setDocs(await api.kycDocuments()); } catch { setDocs([]); } }, []);
  useEffect(() => { load(); }, [load]);

  const upload = (type: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      setBusy(type);
      try { await api.kycUpload(type, reader.result as string); await load(); }
      catch (err) { alert(err instanceof Error ? err.message : String(err)); }
      finally { setBusy(null); }
    };
    reader.readAsDataURL(file);
  };

  const statusOf = (type: string) => docs.find((d) => d.document_type === type)?.status as string | undefined;

  const submit = async () => {
    try { await api.kycSubmit(); setSubmitted(true); } catch (e) { alert(e instanceof Error ? e.message : String(e)); }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow="Zone 1 · Vendor verification" title="Identity & trade verification"
        subtitle="Upload your documents. An admin reviews them before your account can bid — fraud-gate per spec." />

      <div className="grid gap-3">
        {DOCS.map((d) => {
          const st = statusOf(d.type);
          return (
            <div key={d.type} className="flex items-center justify-between rounded-2xl border border-border bg-white p-4 shadow-[var(--shadow-soft)]">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--offwhite)] text-[var(--azure)]"><ShieldCheck className="h-5 w-5" /></div>
                <div>
                  <div className="text-sm font-bold text-[var(--navy)]">{d.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {st === "APPROVED" ? "Approved" : st === "REJECTED" ? "Rejected — re-upload" : st ? "Under review" : "Not uploaded"}
                  </div>
                </div>
              </div>
              {st === "APPROVED" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : st === "UNDER_REVIEW" ? (
                <Clock className="h-5 w-5 text-amber-500" />
              ) : st === "REJECTED" ? (
                <XCircle className="h-5 w-5 text-red-600" />
              ) : (
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[var(--azure)] px-3 py-2 text-xs font-bold text-white hover:bg-[var(--navy)]">
                  {busy === d.type ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={upload(d.type)} />
                </label>
              )}
            </div>
          );
        })}
      </div>

      <button onClick={submit} disabled={docs.length === 0 || submitted}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--navy)] px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
        {submitted ? "Submitted — pending admin review" : "Submit for verification"}
      </button>
    </div>
  );
}
