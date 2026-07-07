import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, CreditCard, Users, ShieldAlert, List, PlayCircle, LogOut, UserCog } from "lucide-react";
import { getToken, tokenClaims } from "@/lib/api";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();

  useEffect(() => {
    const claims = tokenClaims();
    if (!claims || claims.role !== 'ADMIN') {
      navigate("/admin/login");
    }
  }, [navigate]);

  const navItems = [
    { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/payments", icon: CreditCard, label: "Payments" },
    { href: "/admin/vendors", icon: Users, label: "KYC Queue" },
    { href: "/admin/disputes", icon: ShieldAlert, label: "Disputes" },
    { href: "/admin/catalog", icon: List, label: "Catalog" },
    { href: "/admin/users", icon: UserCog, label: "Users" },
    { href: "/admin/videos", icon: PlayCircle, label: "Videos" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex md:flex-row flex-col">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-card border-b border-border sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <img src={import.meta.env.BASE_URL + "logo.png"} alt="Logo" className="w-8 h-8 object-contain" />
          <span className="font-bold text-lg tracking-tight">FixIt Now Admin</span>
        </div>
      </header>

      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border h-screen sticky top-0">
        <div className="p-6 flex items-center gap-3 border-b border-border">
          <img src={import.meta.env.BASE_URL + "logo.png"} alt="Logo" className="w-10 h-10 object-contain" />
          <span className="font-bold text-xl tracking-tight">FixIt Now Admin</span>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-3 rounded-full transition-colors ${isActive ? "bg-primary text-primary-foreground font-medium shadow-md" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border">
          <button onClick={() => { localStorage.removeItem("FixIt One_token"); window.location.href = "/admin/login"; }}
            className="flex items-center gap-3 px-3 py-3 rounded-full text-destructive hover:bg-destructive/10 transition-colors w-full">
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Nav (Bottom) */}
      <nav className="md:hidden fixed bottom-0 w-full bg-card border-t border-border flex overflow-x-auto no-scrollbar z-50">
        {navItems.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={`flex-shrink-0 flex flex-col items-center gap-1 min-w-[72px] p-3 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}>
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
