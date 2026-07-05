import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { I18nProvider } from "@/lib/i18n";
import { OnboardingGate } from "@/components/OnboardingGate";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { setToken } from "@/lib/api";

const Splash = () => (
  <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at center, #1B6EF3 2px, transparent 2px)', backgroundSize: '40px 40px' }}></div>
    <div className="text-center w-full max-w-sm relative z-10">
      <img src={import.meta.env.BASE_URL + "logo.png"} className="w-32 h-32 mx-auto mb-6 animate-pulse drop-shadow-[0_0_30px_rgba(27,110,243,0.5)]" />
      <h1 className="text-4xl font-bold tracking-tight text-white mb-2">FixIt Now Suite</h1>
      <p className="text-muted-foreground mb-8 text-sm">Select an app to continue</p>

      <div className="space-y-3">
        <a href="http://localhost:8082/" className="block px-6 py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl w-full shadow-[0_0_20px_rgba(27,110,243,0.3)] transition-all transform hover:scale-[1.02] active:scale-95 text-base">
          Consumer App
        </a>
        <a href="http://localhost:8084/" className="block px-6 py-4 bg-warning hover:bg-warning/90 text-white font-bold rounded-xl w-full shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-all transform hover:scale-[1.02] active:scale-95 text-base">
          Vendor App
        </a>
        <a href="http://localhost:8083/" className="block px-6 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl w-full shadow-[0_0_20px_rgba(39,39,42,0.3)] transition-all transform hover:scale-[1.02] active:scale-95 text-base">
          Admin Dashboard
        </a>
      </div>
      <div className="mt-8 flex justify-center gap-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
        <span>AR</span>
        <span className="text-primary border-b border-primary pb-1">EN</span>
        <span>UR</span>
        <span>HI</span>
      </div>
    </div>
  </div>
);

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Splash} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) setToken(session.access_token);
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        setToken(session.access_token);
      } else {
        setToken(null);
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <TooltipProvider>
          <OnboardingGate>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
          </OnboardingGate>
          <Toaster />
        </TooltipProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

export default App;
