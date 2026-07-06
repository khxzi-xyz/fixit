import { Link, useLocation } from "wouter";
import { Home, Search, Plus, Wallet, User, MessageCircle, Briefcase } from "lucide-react";

export function ConsumerLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const left = [
    { href: "/home", icon: Home, label: "Home" },
    { href: "/my-jobs", icon: Briefcase, label: "Jobs" },
  ];
  const right = [
    { href: "/chats", icon: MessageCircle, label: "Chats" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  const isGuest = sessionStorage.getItem("fixit_guest") === "true";

  const Item = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => {
    const active = location === href;
    const restricted = isGuest && href !== "/home";
    const targetHref = restricted ? "/auth/user/login" : href;
    
    return (
      <Link href={targetHref} className="flex flex-col items-center gap-0.5 flex-1 min-w-0 cursor-pointer">
        <Icon className={`w-6 h-6 transition-colors ${active ? "text-primary" : "text-muted-foreground"}`} strokeWidth={active ? 2.5 : 2} />
        <span className={`text-[10px] font-semibold ${active ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <main className="flex-1 overflow-y-auto pb-24">{children}</main>

      <nav className="fixed bottom-0 inset-x-0 z-50 bg-card border-t border-border safe-area-bottom">
        <div className="relative flex items-center px-2 py-2">
          {left.map((i) => <Item key={i.href} {...i} />)}

          {/* Center floating Post action */}
          <div className="flex-1 flex justify-center">
            <Link href={isGuest ? "/auth/user/login" : "/post-job"} className="relative -mt-8">
              <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xl ring-4 ring-background transform transition-transform hover:scale-105 active:scale-95">
                <Plus className="w-7 h-7" strokeWidth={2.5} />
              </div>
            </Link>
          </div>

          {right.map((i) => <Item key={i.href} {...i} />)}
        </div>
      </nav>
    </div>
  );
}
