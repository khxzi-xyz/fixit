import { AuthLayout } from "@/components/layouts/AuthLayout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function VendorPending() {
  return (
    <AuthLayout>
      <div className="flex flex-col items-center justify-center py-8 text-center">
        
        {/* Animated Rings */}
        <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-[ping_3s_ease-in-out_infinite]"></div>
          <div className="absolute inset-4 rounded-full border-4 border-primary/40 animate-[ping_2s_ease-in-out_infinite]"></div>
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(27,110,243,0.5)] z-10">
            <svg className="w-8 h-8 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold tracking-tight mb-2">Under Review</h1>
        <p className="text-muted-foreground mb-8 max-w-[250px]">
          Your documents have been submitted securely. Our team is verifying your profile.
        </p>

        <div className="w-full bg-muted p-4 rounded-xl text-left space-y-3 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-success"></div>
            <span className="text-sm font-medium">Identity verified</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-success"></div>
            <span className="text-sm font-medium">Phone verified</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-warning animate-pulse"></div>
            <span className="text-sm font-medium text-warning">Trade license pending</span>
          </div>
        </div>

        <Link href="/vendor/home" className="w-full">
          <Button variant="outline" className="w-full h-12 rounded-xl border-border">
            Skip for Demo
          </Button>
        </Link>
      </div>
    </AuthLayout>
  );
}
