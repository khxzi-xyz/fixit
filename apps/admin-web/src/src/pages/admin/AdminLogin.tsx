import { useState } from "react";
import { useLocation } from "wouter";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { api, setToken } from "@/lib/api";

export default function AdminLogin() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  const login = async () => {
    setBusy(true);
    try {
      const res = await api.adminLogin(pw);
      setToken(res.accessToken);
      navigate("/admin");
    } catch (e) {
      toast({ title: "Login failed", description: e instanceof Error ? e.message : String(e) });
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-lg p-6">
        <div className="w-14 h-14 rounded-2xl hero-blue flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-xl font-extrabold text-center">FixIt Now Admin</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">Command Center access</p>
        <form onSubmit={(e) => { e.preventDefault(); login(); }} className="space-y-4">
          <div className="space-y-2">
            <Label>Admin password</Label>
            <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" className="h-12 rounded-xl bg-muted border-border" />
          </div>
          <Button type="submit" disabled={busy} className="w-full h-12 rounded-xl font-bold">{busy ? "Signing in…" : "Enter Command Center"}</Button>
        </form>
        <p className="text-[11px] text-muted-foreground text-center mt-4">Default dev password: <code>FixIt Now-admin</code></p>
      </div>
    </div>
  );
}
