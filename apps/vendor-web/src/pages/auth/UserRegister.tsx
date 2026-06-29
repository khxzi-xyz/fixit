import { AuthLayout } from "@/components/layouts/AuthLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function UserRegister() {
  return (
    <AuthLayout title="Create Consumer Account" subtitle="Join FixIt to find local professionals" backTo="/auth/choice">
      <form className="space-y-5">
        <div className="space-y-2">
          <Label>Full Name</Label>
          <Input placeholder="John Doe" className="h-12 bg-muted/50 border-border rounded-xl" required />
        </div>
        
        <div className="space-y-2">
          <Label>Email (Optional)</Label>
          <Input type="email" placeholder="john@example.com" className="h-12 bg-muted/50 border-border rounded-xl" />
        </div>

        <div className="space-y-2">
          <Label>Select Avatar</Label>
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className={`aspect-square rounded-full flex items-center justify-center cursor-pointer border-2 transition-all ${i === 1 ? 'border-primary bg-primary/20' : 'border-transparent bg-muted hover:bg-muted/80'}`}>
                <span className="font-bold text-foreground">AV{i}</span>
              </div>
            ))}
          </div>
        </div>

        <Link href="/home" className="block pt-4">
          <Button type="button" className="w-full h-14 rounded-xl text-lg font-bold shadow-[0_0_20px_rgba(27,110,243,0.3)]">
            Create Account
          </Button>
        </Link>
      </form>
    </AuthLayout>
  );
}
