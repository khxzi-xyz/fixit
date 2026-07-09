import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ChevronLeft, Search } from "lucide-react";
import { Link } from "wouter";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";

export default function NotFound() {
  return (
    <ConsumerLayout>
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 pb-24 text-center">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <Search className="w-12 h-12 text-primary" />
        </div>
        
        <h1 className="text-4xl font-black text-foreground mb-2">Oops! 404</h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-[250px]">
          We couldn't find the page or service you're looking for.
        </p>

        <Link href="/home">
          <button className="flex items-center gap-2 bg-primary text-primary-foreground font-bold px-8 py-3.5 rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95">
            <ChevronLeft className="w-5 h-5" />
            Back to Home
          </button>
        </Link>
      </div>
    </ConsumerLayout>
  );
}
