import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Cpu, Zap, Check, Loader2, RefreshCw, FlaskConical, BarChart3,
  ToggleLeft, ToggleRight, Bot, ChevronDown, ChevronUp,
} from "lucide-react";

const PROVIDERS = [
  {
    id: "groq",
    name: "Groq",
    model: "llama-3.3-70b-versatile",
    desc: "Ultra-fast inference. Best for real-time AI replies and ticket rewriting.",
    badge: "Fastest",
    badgeColor: "bg-yellow-500/20 text-yellow-400",
    icon: "⚡",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    model: "gemini-1.5-flash",
    desc: "Google's multimodal AI. Best for complex reasoning and translation.",
    badge: "Versatile",
    badgeColor: "bg-blue-500/20 text-blue-400",
    icon: "🔮",
  },
];

export default function AdminAISettings() {
  const { toast } = useToast();
  const [currentProvider, setCurrentProvider] = useState<string>("groq");
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [appSettings, setAppSettings] = useState<any[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.adminGetAiProvider().catch(() => ({ provider: "groq" })),
      api.adminGetSettings().catch(() => []),
    ]).then(([providerRes, settings]) => {
      setCurrentProvider(providerRes.provider || "groq");
      setAppSettings(Array.isArray(settings) ? settings : []);
    }).finally(() => setLoading(false));
  }, []);

  const switchProvider = async (provider: string) => {
    if (provider === currentProvider) return;
    setSwitching(true);
    try {
      await api.adminSetAiProvider(provider as "gemini" | "groq");
      setCurrentProvider(provider);
      setTestResult(null);
      toast({ title: `Switched to ${PROVIDERS.find(p => p.id === provider)?.name} ✅` });
    } catch (e: any) {
      toast({ title: e.message || "Switch failed", variant: "destructive" });
    } finally {
      setSwitching(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.adminTestAi();
      setTestResult(res);
      toast({ title: res.ok ? `✅ ${res.provider} is responding (${res.latencyMs}ms)` : "❌ Test failed" });
    } catch (e: any) {
      setTestResult({ ok: false, error: e.message });
    } finally {
      setTesting(false);
    }
  };

  const saveSetting = async (key: string) => {
    setSaving(true);
    try {
      await api.adminUpdateSetting(key, editValue);
      setAppSettings((prev) => prev.map((s) => s.key === key ? { ...s, value: editValue } : s));
      setEditingKey(null);
      toast({ title: "Setting saved ✅" });
    } catch (e: any) {
      toast({ title: e.message || "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-black text-foreground">AI Settings</h2>
        <p className="text-muted-foreground text-sm mt-1">Switch between AI providers and configure platform settings</p>
      </div>

      {/* Current status bar */}
      <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-2xl px-4 py-3">
        <Bot className="w-5 h-5 text-primary" />
        <div className="flex-1">
          <p className="text-sm font-bold">Active Provider: <span className="text-primary">{PROVIDERS.find(p => p.id === currentProvider)?.name}</span></p>
          <p className="text-xs text-muted-foreground">Model: {PROVIDERS.find(p => p.id === currentProvider)?.model}</p>
        </div>
        <button
          onClick={testConnection}
          disabled={testing}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/20 text-primary text-xs font-bold rounded-xl hover:bg-primary/30 transition-colors"
        >
          {testing ? <Loader2 className="w-3 h-3 animate-spin" /> : <FlaskConical className="w-3 h-3" />}
          Test
        </button>
      </div>

      {/* Test result */}
      {testResult && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${testResult.ok ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"}`}>
          {testResult.ok ? <Check className="w-4 h-4 text-green-400" /> : <Zap className="w-4 h-4 text-red-400" />}
          <div>
            <p className={`text-sm font-bold ${testResult.ok ? "text-green-400" : "text-red-400"}`}>
              {testResult.ok ? `Connected! Response in ${testResult.latencyMs}ms` : "Connection failed"}
            </p>
            {testResult.error && <p className="text-xs text-muted-foreground">{testResult.error}</p>}
          </div>
        </div>
      )}

      {/* Provider cards */}
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Choose AI Provider</p>
        <div className="grid grid-cols-1 gap-3">
          {PROVIDERS.map((p) => {
            const isActive = currentProvider === p.id;
            return (
              <button
                key={p.id}
                onClick={() => switchProvider(p.id)}
                disabled={switching}
                className={`flex items-start gap-4 p-4 border-2 rounded-2xl transition-all text-left ${isActive ? "border-primary bg-primary/8" : "border-border bg-card hover:border-primary/40"}`}
              >
                <div className="text-3xl mt-0.5">{p.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-black text-base">{p.name}</p>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${p.badgeColor}`}>{p.badge}</span>
                    {isActive && <span className="px-2 py-0.5 bg-primary/20 text-primary rounded-lg text-[10px] font-bold">Active</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.model}</p>
                  <p className="text-sm text-muted-foreground mt-1">{p.desc}</p>
                </div>
                {switching && !isActive ? (
                  <Loader2 className="w-5 h-5 animate-spin text-primary mt-1 shrink-0" />
                ) : isActive ? (
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center shrink-0 mt-1">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* App Settings */}
      {appSettings.length > 0 && (
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Platform Settings</p>
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            {appSettings.map((s: any, i: number) => (
              <div key={s.key} className={`${i !== appSettings.length - 1 ? "border-b border-border" : ""}`}>
                {editingKey === s.key ? (
                  <div className="p-4 space-y-2">
                    <p className="text-xs font-bold text-muted-foreground">{s.description || s.key}</p>
                    <div className="flex gap-2">
                      <input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 h-10 bg-muted/60 border border-border rounded-xl px-3 text-sm font-medium outline-none focus:border-primary"
                      />
                      <button onClick={() => saveSetting(s.key)} disabled={saving} className="px-3 h-10 bg-primary text-white font-bold rounded-xl text-sm">
                        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                      </button>
                      <button onClick={() => setEditingKey(null)} className="px-3 h-10 border border-border rounded-xl text-sm text-muted-foreground">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditingKey(s.key); setEditValue(s.value); }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors text-left"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{s.description || s.key}</p>
                      <p className="text-xs text-muted-foreground">{s.value}</p>
                    </div>
                    <span className="text-xs font-bold text-primary">Edit</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
