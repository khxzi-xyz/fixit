/**
 * Searchable single-select dropdown (custom combobox). Type to filter options,
 * click to choose. Closes on outside click / Escape. No external popover dep.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Check, ChevronDown } from "lucide-react";

export interface Option { value: string; label: string; hint?: string }

export function SearchSelect({
  options,
  value,
  onChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyText = "No matches",
  onRequestService,
}: {
  options: Option[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  onRequestService?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => String(o.label || "").toLowerCase().includes(q) || String(o.value || "").toLowerCase().includes(q) || String(o.hint || "").toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    setTimeout(() => inputRef.current?.focus(), 0);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="w-full h-12 px-3 rounded-xl border border-border bg-card text-start flex items-center justify-between gap-2 focus:ring-2 focus:ring-primary outline-none">
        <span className={selected ? "text-foreground font-medium" : "text-muted-foreground"}>{selected ? selected.label : placeholder}</span>
        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full bg-popover border border-border rounded-xl shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 h-11 border-b border-border">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder={searchPlaceholder}
              className="flex-1 bg-transparent outline-none text-sm" />
          </div>
          <div className="max-h-60 overflow-y-auto no-scrollbar py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center space-y-3">
                <p className="text-sm text-muted-foreground">{emptyText}</p>
                {onRequestService && (
                  <button type="button" onClick={() => { onRequestService(); setOpen(false); setQuery(""); }}
                    className="h-10 px-4 rounded-xl bg-primary/10 text-primary font-bold text-sm hover:bg-primary/20 transition-colors">
                    Request a new service
                  </button>
                )}
              </div>
            ) : filtered.map((o) => (
              <button key={o.value} type="button"
                onClick={() => { onChange(o.value); setOpen(false); setQuery(""); }}
                className={`w-full px-3 py-2.5 flex items-center justify-between gap-2 text-start hover:bg-muted transition-colors ${o.value === value ? "bg-slate-50 dark:bg-slate-900" : ""}`}>
                <span className="min-w-0">
                  <span className="block text-sm font-medium truncate">{o.label}</span>
                  {o.hint && <span className="block text-[11px] text-muted-foreground truncate">{o.hint}</span>}
                </span>
                {o.value === value && <Check className="w-4 h-4 text-primary shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
