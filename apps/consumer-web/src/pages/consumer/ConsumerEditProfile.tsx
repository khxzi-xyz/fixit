import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, User, Edit2, Loader2, Phone } from "lucide-react";
import { api, tokenClaims } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export default function ConsumerEditProfile() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [editName, setEditName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setSessionUser(data.user);
        setEditName(data.user.user_metadata?.full_name || tokenClaims()?.full_name || "");
      }
    });
  }, []);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    if (file.size > 2 * 1024 * 1024) { toast({ title: "File too big", description: "Max 2MB" }); return; }
    
    setAvatarUploading(true);
    try {
      const { avatarUrl } = await api.uploadAvatar(file);
      setSessionUser((prev: any) => ({ ...prev, user_metadata: { ...prev?.user_metadata, avatar_url: avatarUrl } }));
      toast({ title: "Avatar updated!" });
    } catch (err: any) {
      toast({ title: "Failed to upload avatar", description: err.message, variant: "destructive" });
    } finally {
      setAvatarUploading(false);
    }
  };

  const saveProfile = async () => {
    if (!editName.trim()) return;
    setAvatarUploading(true);
    try {
      const { error } = await supabase.auth.updateUser({ data: { full_name: editName } });
      if (error) throw error;
      setSessionUser((prev: any) => ({ ...prev, user_metadata: { ...prev?.user_metadata, full_name: editName } }));
      toast({ title: "Profile updated successfully!" });
      navigate("/profile");
    } catch (err: any) {
      toast({ title: "Failed to update profile", description: err.message, variant: "destructive" });
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <ConsumerLayout>
      <div className="bg-primary text-primary-foreground border-b border-border text-white px-4 pt-5 pb-8 rounded-b-3xl shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/profile")} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
          <h1 className="text-xl font-extrabold">Edit Profile</h1>
        </div>
      </div>

      <div className="px-4 py-5 space-y-6 -mt-6">
        <Card className="bg-card border-none shadow-lg rounded-2xl overflow-hidden">
          <CardContent className="p-6 space-y-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="relative group">
                <div className="w-28 h-28 rounded-full border-4 border-primary/20 bg-muted flex items-center justify-center overflow-hidden">
                  {sessionUser?.user_metadata?.avatar_url ? (
                    <img src={sessionUser.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-muted-foreground" />
                  )}
                </div>
                <button onClick={() => fileRef.current?.click()} disabled={avatarUploading} className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                  {avatarUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Edit2 className="w-5 h-5" />}
                </button>
                <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleAvatarChange} disabled={avatarUploading} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-12 bg-muted/20 border-border rounded-xl font-bold" />
              </div>

              <div className="space-y-2">
                <Label>Contact Details</Label>
                <div className="flex items-center gap-2 p-3 bg-muted/30 border border-border/50 rounded-xl text-muted-foreground text-sm font-semibold">
                  <Phone className="w-4 h-4 text-primary" />
                  {sessionUser?.phone || sessionUser?.email || "No contact info registered"}
                </div>
              </div>

              <Button onClick={saveProfile} disabled={avatarUploading} className="w-full h-12 rounded-xl font-extrabold shadow-md mt-4">
                {avatarUploading ? "Saving..." : "Save Profile Details"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ConsumerLayout>
  );
}
