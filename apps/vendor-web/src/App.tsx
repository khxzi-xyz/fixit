import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { I18nProvider } from "@/lib/i18n";
import { OnboardingGate } from "@/components/OnboardingGate";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { setToken } from "@/lib/api";

// Layouts
import { VendorLayout } from "./components/layouts/VendorLayout";
import { AuthLayout } from "./components/layouts/AuthLayout";

// Auth
import UserRegister from "./pages/auth/UserRegister";
import { UserLogin, UserOTP } from "./pages/auth/UserAuth";

// Removed Consumer and Admin imports

// Vendor Flow
import VendorLogin from "./pages/auth/VendorLogin";
import VendorRegister from "./pages/auth/VendorRegister";
import VendorHome from "./pages/vendor/VendorHome";
import VendorJobs from "./pages/vendor/VendorJobs";
import VendorJobDetail from "./pages/vendor/VendorJobDetail";
import VendorOrder from "./pages/vendor/VendorOrder";
import VendorChats from "./pages/vendor/VendorChats";
import VendorWallet from "./pages/vendor/VendorWallet";
import VendorProfile from "./pages/vendor/VendorProfile";
import VendorSettings from "./pages/vendor/VendorSettings";
import VendorUpgrade from "./pages/vendor/VendorUpgrade";
import VendorKycBiz from "./pages/auth/VendorKycBiz";
import VendorKycId from "./pages/auth/VendorKycId";
import VendorPending from "./pages/auth/VendorPending";
import VendorTripleVerify from "./pages/vendor/VendorTripleVerify";

const Splash = () => (
  <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at center, #1B6EF3 2px, transparent 2px)', backgroundSize: '40px 40px' }}></div>
    <div className="text-center w-full max-w-sm relative z-10">
      <img src={import.meta.env.BASE_URL + "logo.png"} className="w-32 h-32 mx-auto mb-6 animate-pulse drop-shadow-[0_0_30px_rgba(27,110,243,0.5)]" />
      <h1 className="text-4xl font-bold tracking-tight text-white mb-2">FixIt Now Suite</h1>
      <p className="text-muted-foreground mb-8 text-sm">Select an app to continue</p>

      <div className="space-y-3">
        <a href="/auth/user/login" className="block px-6 py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl w-full shadow-[0_0_20px_rgba(27,110,243,0.3)] transition-all transform hover:scale-[1.02] active:scale-95 text-base">
          Consumer App
        </a>
        <a href="/auth/vendor/login" className="block px-6 py-4 bg-warning hover:bg-warning/90 text-white font-bold rounded-xl w-full shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-all transform hover:scale-[1.02] active:scale-95 text-base">
          Vendor App
        </a>
        <a href="/admin/login" className="block px-6 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl w-full shadow-[0_0_20px_rgba(39,39,42,0.3)] transition-all transform hover:scale-[1.02] active:scale-95 text-base">
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
      <Route path="/">
        <Redirect to="/auth/vendor/login" />
      </Route>


      
      <Route path="/auth/vendor/login" component={VendorLogin} />
      <Route path="/auth/vendor/register" component={VendorRegister} />
      <Route path="/auth/vendor/kyc-biz" component={VendorKycBiz} />
      <Route path="/auth/vendor/kyc-id" component={VendorKycId} />
      <Route path="/auth/vendor/pending" component={VendorPending} />



      {/* Vendor Flow */}
      <Route path="/vendor/home" component={VendorHome} />
      <Route path="/vendor/jobs" component={VendorJobs} />
      <Route path="/vendor/job/:id" component={VendorJobDetail} />
      <Route path="/vendor/order/:id" component={VendorOrder} />
      <Route path="/vendor/chats" component={VendorChats} />
      <Route path="/vendor/wallet" component={VendorWallet} />
      <Route path="/vendor/profile" component={VendorProfile} />
      <Route path="/vendor/settings" component={VendorSettings} />
      <Route path="/vendor/settings/triple-verify" component={VendorTripleVerify} />
      <Route path="/vendor/upgrade" component={VendorUpgrade} />



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
