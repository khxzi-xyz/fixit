import { useState } from "react";
import { useLocation } from "wouter";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { api, tokenClaims, setToken } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft, User, Phone, Lock, Trash2, Eye, EyeOff,
  CheckCircle, AlertTriangle, Loader2, ShieldAlert,
} from "lucide-react";

export default function ConsumerMyAccount() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const claims = tokenClaims();

  // Edit name
  const [fullName, setFullName] = useState(claims?.full_name || "");
  const [savingName, setSavingName] = useState(false);

  // Change password
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  // Delete account
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  const saveName = async () => {
    if (!fullName.trim()) return;
    setSavingName(true);
    try {
      await api.updateProfile({ full_name: fullName.trim() });
      toast({ title: "Name updated ✅" });
    } catch (e: any) {
      toast({ title: e.message || "Couldn't update name", variant: "destructive" });
    } finally {
      setSavingName(false);
    }
  };

  const changePassword = async () => {
    if (!newPw || newPw !== confirmPw) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (newPw.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    setChangingPw(true);
    try {
      await api.changePassword(currentPw, newPw);
      toast({ title: "Password changed ✅" });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch (e: any) {
      toast({ title: e.message || "Couldn't change password", variant: "destructive" });
    } finally {
      setChangingPw(false);
    }
  };

  const deleteAccount = async () => {
    if (deleteConfirm !== "DELETE") {
      toast({ title: 'Type "DELETE" to confirm', variant: "destructive" });
      return;
    }
    setDeleting(true);
    try {
      await api.deleteAccount();
      setToken(null);
      toast({ title: "Account deleted. Goodbye!" });
      navigate("/auth/user/login");
    } catch (e: any) {
      toast({ title: e.message || "Couldn't delete account", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ConsumerLayout>
      {/* Header */}
      <div className="bg-primary text-primary-foreground border-b border-border px-4 pt-10 pb-14">
        <button onClick={() => navigate("/profile")} className="flex items-center gap-2 text-white/80 hover:text-white mb-4">
          <ChevronLeft className="w-5 h-5" /> Back
        </button>
        <h1 className="text-2xl font-black text-white">My Account</h1>
        <p className="text-primary-foreground/70 text-sm mt-1">Manage your account details</p>
      </div>

      <div className="px-4 -mt-6 pb-10 space-y-4">
        {/* Account info */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Account Info</p>
          </div>
          {[
            { icon: Phone, label: "Phone", value: claims?.phone || "Not set" },
            { icon: User, label: "Email", value: claims?.email || "Not set" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 px-4 py-3.5 border-b border-border last:border-0">
              <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-semibold">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Edit display name */}
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-3">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Display Name</p>
          <div className="flex gap-2">
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              className="flex-1 h-11 bg-muted/60 border border-border rounded-xl px-3 text-sm font-medium outline-none focus:border-primary"
            />
            <button
              onClick={saveName}
              disabled={savingName || !fullName.trim()}
              className="px-4 h-11 bg-primary text-white font-bold rounded-xl disabled:opacity-40 hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Save
            </button>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm font-bold">Change Password</p>
          </div>
          {[
            { label: "Current Password", value: currentPw, onChange: setCurrentPw, placeholder: "Enter current password" },
            { label: "New Password", value: newPw, onChange: setNewPw, placeholder: "At least 8 characters" },
            { label: "Confirm New Password", value: confirmPw, onChange: setConfirmPw, placeholder: "Repeat new password" },
          ].map(({ label, value, onChange, placeholder }) => (
            <div key={label} className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">{label}</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder={placeholder}
                  className="w-full h-11 bg-muted/60 border border-border rounded-xl px-3 pr-10 text-sm font-medium outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
          {newPw && confirmPw && newPw !== confirmPw && (
            <p className="text-xs text-red-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Passwords don't match</p>
          )}
          <button
            onClick={changePassword}
            disabled={changingPw || !currentPw || !newPw || !confirmPw || newPw !== confirmPw}
            className="w-full h-11 bg-primary text-white font-bold rounded-xl disabled:opacity-40 hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            {changingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            Change Password
          </button>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <p className="text-sm font-bold text-red-400">Danger Zone</p>
          </div>
          <p className="text-xs text-muted-foreground">Permanently delete your account and all associated data. This action cannot be undone.</p>
          {!showDelete ? (
            <button
              onClick={() => setShowDelete(true)}
              className="w-full h-11 border border-red-500/40 text-red-400 font-bold rounded-xl hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Delete Account
            </button>
          ) : (
            <div className="space-y-3 animate-in slide-in-from-top-2">
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                <p className="text-xs text-red-400 font-bold">⚠️ This will permanently delete your account, wallet balance, job history, and all data.</p>
              </div>
              <input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder='Type "DELETE" to confirm'
                className="w-full h-11 bg-muted/60 border border-red-500/30 rounded-xl px-3 text-sm font-bold outline-none focus:border-red-500 text-red-400 placeholder:text-red-400/40"
              />
              <div className="flex gap-2">
                <button onClick={() => setShowDelete(false)} className="flex-1 h-11 border border-border rounded-xl font-bold text-muted-foreground hover:bg-muted/40">
                  Cancel
                </button>
                <button
                  onClick={deleteAccount}
                  disabled={deleting || deleteConfirm !== "DELETE"}
                  className="flex-1 h-11 bg-red-500 text-white font-bold rounded-xl disabled:opacity-40 hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ConsumerLayout>
  );
}
