import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export function AuthLayout({ children, backTo, title, subtitle }: { children: React.ReactNode, backTo?: string, title?: string, subtitle?: string }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {backTo && (
          <Link href={backTo} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </Link>
        )}

        <div className="bg-card border border-border p-6 sm:p-8 rounded-full shadow-xl">
          <div className="flex flex-col items-center mb-8">
            <img src={import.meta.env.BASE_URL + "logo.png"} alt="FixIt Now" className="w-16 h-16 object-contain mb-4" />
            {title && <h1 className="text-2xl font-bold tracking-tight text-foreground text-center">{title}</h1>}
            {subtitle && <p className="text-muted-foreground text-center mt-2 text-sm">{subtitle}</p>}
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
