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

// Layouts
import { ConsumerLayout } from "./components/layouts/ConsumerLayout";
import { VendorLayout } from "./components/layouts/VendorLayout";
import { AdminLayout } from "./components/layouts/AdminLayout";
import { AuthLayout } from "./components/layouts/AuthLayout";

// Auth
import UserRegister from "./pages/auth/UserRegister";
import { UserLogin, UserOTP } from "./pages/auth/UserAuth";

// Consumer
import ConsumerHome from "./pages/consumer/ConsumerHome";
import ConsumerSearch from "./pages/consumer/ConsumerSearch";
import ConsumerCategories from "./pages/consumer/ConsumerCategories";
import ConsumerPostJob from "./pages/consumer/ConsumerPostJob";
import ConsumerWallet from "./pages/consumer/ConsumerWallet";
import ConsumerProfile from "./pages/consumer/ConsumerProfile";
import PublicVendorProfile from "./pages/consumer/PublicVendorProfile";
import ConsumerMyJobs from "./pages/consumer/ConsumerMyJobs";
import ConsumerChats from "./pages/consumer/ConsumerChats";
import ConsumerUpgrade from "./pages/consumer/ConsumerUpgrade";
import ConsumerSettings from "./pages/consumer/ConsumerSettings";
import ConsumerNotifications from "./pages/consumer/ConsumerNotifications";
import ConsumerSupport from "./pages/consumer/ConsumerSupport";
import JobBids from "./pages/consumer/JobBids";
import JobPayment from "./pages/consumer/JobPayment";
import OrderTracking from "./pages/consumer/OrderTracking";
import OrderWarranty from "./pages/consumer/OrderWarranty";
import OrderReview from "./pages/consumer/OrderReview";

// Admin
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminVendors from "./pages/admin/AdminVendors";
import AdminDisputes from "./pages/admin/AdminDisputes";
import AdminCatalog from "./pages/admin/AdminCatalog";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminVideos from "./pages/admin/AdminVideos";

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
      <Route path="/" component={Splash} />

      {/* Auth Flow */}
      <Route path="/auth/user/login" component={UserLogin} />
      <Route path="/auth/user/otp" component={UserOTP} />
      <Route path="/auth/user/register" component={UserRegister} />
      
      <Route path="/auth/vendor/login" component={VendorLogin} />
      <Route path="/auth/vendor/register" component={VendorRegister} />
      <Route path="/auth/vendor/kyc-biz" component={VendorKycBiz} />
      <Route path="/auth/vendor/kyc-id" component={VendorKycId} />
      <Route path="/auth/vendor/pending" component={VendorPending} />

      {/* Consumer Flow */}
      <Route path="/home"><ConsumerHome /></Route>
      <Route path="/search"><ConsumerSearch /></Route>
      <Route path="/my-jobs"><ConsumerMyJobs /></Route>
      <Route path="/chats"><ConsumerChats /></Route>
      <Route path="/categories"><ConsumerCategories /></Route>
      <Route path="/post-job" component={ConsumerPostJob} />
      <Route path="/job/:id/bids" component={JobBids} />
      <Route path="/job/:id/payment" component={JobPayment} />
      <Route path="/order/:id" component={OrderTracking} />
      <Route path="/job/:id/tracking" component={OrderTracking} />
      <Route path="/order/:id/warranty" component={OrderWarranty} />
      <Route path="/order/:id/review" component={OrderReview} />
      <Route path="/wallet" component={ConsumerWallet} />
      <Route path="/profile" component={ConsumerProfile} />
      <Route path="/vendor/:id" component={PublicVendorProfile} />
      <Route path="/upgrade" component={ConsumerUpgrade} />
      <Route path="/settings" component={ConsumerSettings} />
      <Route path="/notifications" component={ConsumerNotifications} />
      <Route path="/support" component={ConsumerSupport} />

      {/* Vendor Flow */}
      <Route path="/vendor/home" component={VendorHome} />
      <Route path="/vendor/jobs" component={VendorJobs} />
      <Route path="/vendor/job/:id" component={VendorJobDetail} />
      <Route path="/vendor/order/:id" component={VendorOrder} />
      <Route path="/vendor/chats" component={VendorChats} />
      <Route path="/vendor/wallet" component={VendorWallet} />
      <Route path="/vendor/profile" component={VendorProfile} />
      <Route path="/vendor/settings" component={VendorSettings} />
      <Route path="/vendor/upgrade" component={VendorUpgrade} />

      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/payments" component={AdminPayments} />
      <Route path="/admin/vendors" component={AdminVendors} />
      <Route path="/admin/disputes" component={AdminDisputes} />
      <Route path="/admin/catalog" component={AdminCatalog} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/videos" component={AdminVideos} />

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
