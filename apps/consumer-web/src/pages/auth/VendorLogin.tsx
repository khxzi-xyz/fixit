import { AuthLayout } from "@/components/layouts/AuthLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function VendorLogin() {
  return (
    <AuthLayout title="Vendor Login" subtitle="Access your FixIt provider dashboard" backTo="/auth/choice">
      <form className="space-y-6">
        <div className="space-y-2">
          <Label>Phone Number</Label>
          <div className="flex gap-2">
            <div className="w-24 h-12 bg-muted/50 border border-border rounded-xl flex items-center justify-center font-medium text-foreground">
              +968
            </div>
            <Input type="tel" placeholder="9123 4567" className="flex-1 h-12 bg-muted/50 border-border rounded-xl font-medium" required />
          </div>
        </div>

        <Link href="/auth/user/otp" className="block">
          {/* We reuse the OTP page for both for this demo, usually it would go to VendorOTP */}
          <Button type="button" className="w-full h-14 rounded-xl text-lg font-bold shadow-[0_0_20px_rgba(27,110,243,0.3)]">
            Send OTP
          </Button>
        </Link>

        <div className="text-center pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">Don't have a vendor account?</p>
          <Link href="/auth/vendor/register" className="text-primary font-bold hover:underline mt-1 inline-block">
            Register as Provider
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
