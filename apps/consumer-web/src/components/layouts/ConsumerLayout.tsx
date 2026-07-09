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
      <Link href={targetHref} className="flex flex-col items-center gap-1 flex-1 min-w-0 cursor-pointer active:scale-95 transition-transform">
        <Icon className={`w-7 h-7 transition-colors ${active ? "text-primary drop-shadow-sm" : "text-slate-400 dark:text-slate-500"}`} strokeWidth={active ? 2.5 : 2} />
        <span className={`text-[10px] font-bold ${active ? "text-primary" : "text-slate-400 dark:text-slate-500"}`}>{label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <main className="flex-1 overflow-y-auto pb-24">{children}</main>

      <nav className="fixed bottom-0 inset-x-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl border-t border-slate-200/50 dark:border-slate-800/50 safe-area-bottom pb-2">
        <div className="relative flex items-center px-4 py-3">
          {left.map((i) => <Item key={i.href} {...i} />)}

          {/* Center floating Post action */}
          <div className="flex-1 flex justify-center">
            <Link href={isGuest ? "/auth/user/login" : "/post-job"} className="relative -mt-10">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-blue-500/30 shadow-2xl ring-[6px] ring-background transform transition-all hover:scale-105 active:scale-95">
                <Plus className="w-8 h-8" strokeWidth={2.5} />
              </div>
            </Link>
          </div>

          {right.map((i) => <Item key={i.href} {...i} />)}
        </div>
      </nav>
    </div>
  );
}
