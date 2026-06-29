import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// Layouts
import { ConsumerLayout } from "./components/layouts/ConsumerLayout";
import { VendorLayout } from "./components/layouts/VendorLayout";
import { AdminLayout } from "./components/layouts/AdminLayout";
import { AuthLayout } from "./components/layouts/AuthLayout";

// Auth
import UserRegister from "./pages/auth/UserRegister";
import VendorLogin from "./pages/auth/VendorLogin";
import VendorRegister from "./pages/auth/VendorRegister";
import VendorKycId from "./pages/auth/VendorKycId";
import VendorKycBiz from "./pages/auth/VendorKycBiz";
import VendorPending from "./pages/auth/VendorPending";

// Consumer
import ConsumerHome from "./pages/consumer/ConsumerHome";
import ConsumerSearch from "./pages/consumer/ConsumerSearch";
import ConsumerCategories from "./pages/consumer/ConsumerCategories";
import ConsumerPostJob from "./pages/consumer/ConsumerPostJob";
import ConsumerWallet from "./pages/consumer/ConsumerWallet";
import ConsumerProfile from "./pages/consumer/ConsumerProfile";
import ConsumerUpgrade from "./pages/consumer/ConsumerUpgrade";
import JobBids from "./pages/consumer/JobBids";
import JobPayment from "./pages/consumer/JobPayment";
import OrderTracking from "./pages/consumer/OrderTracking";
import OrderWarranty from "./pages/consumer/OrderWarranty";
import OrderReview from "./pages/consumer/OrderReview";

// Vendor
import VendorHome from "./pages/vendor/VendorHome";
import VendorJobs from "./pages/vendor/VendorJobs";
import VendorJobDetail from "./pages/vendor/VendorJobDetail";
import VendorOrder from "./pages/vendor/VendorOrder";
import VendorWallet from "./pages/vendor/VendorWallet";
import VendorProfile from "./pages/vendor/VendorProfile";
import VendorUpgrade from "./pages/vendor/VendorUpgrade";

// Admin
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminVendors from "./pages/admin/AdminVendors";
import AdminDisputes from "./pages/admin/AdminDisputes";
import AdminCatalog from "./pages/admin/AdminCatalog";
import AdminUsers from "./pages/admin/AdminUsers";

const Splash = () => (
  <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at center, #1B6EF3 2px, transparent 2px)', backgroundSize: '40px 40px' }}></div>
    <div className="text-center w-full max-w-sm relative z-10">
      <img src={import.meta.env.BASE_URL + "logo.png"} className="w-32 h-32 mx-auto mb-8 animate-pulse drop-shadow-[0_0_30px_rgba(27,110,243,0.5)]" />
      <h1 className="text-5xl font-bold tracking-tight text-white mb-2">FixIt</h1>
      <p className="text-muted-foreground mb-12 text-lg">Hyper-local Khidmah</p>
      
      <div className="space-y-4">
        <a href="/auth/choice" className="block px-8 py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl w-full shadow-[0_0_30px_rgba(27,110,243,0.3)] transition-all transform hover:scale-[1.02] active:scale-95 text-lg">
          Get Started
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

const AuthChoice = () => (
  <AuthLayout title="Choose Your Path" subtitle="Are you looking for help, or offering it?">
    <div className="grid gap-4">
      <a href="/auth/user/login" className="p-6 border-2 border-border bg-card rounded-2xl hover:border-primary hover:bg-primary/5 transition-all text-center group">
        <h3 className="font-bold text-xl mb-1 group-hover:text-primary">I need a service</h3>
        <p className="text-sm text-muted-foreground">Post jobs, hire professionals (Consumer)</p>
      </a>
      <a href="/auth/vendor/login" className="p-6 border-2 border-border bg-card rounded-2xl hover:border-primary hover:bg-primary/5 transition-all text-center group">
        <h3 className="font-bold text-xl mb-1 group-hover:text-primary">I provide a service</h3>
        <p className="text-sm text-muted-foreground">Bid on jobs, earn money (Vendor)</p>
      </a>
      <div className="text-center mt-4">
        <a href="/admin" className="text-xs text-muted-foreground hover:text-foreground">Login as Admin</a>
      </div>
    </div>
  </AuthLayout>
);

const UserLogin = () => (
  <AuthLayout title="Welcome back" subtitle="Enter your phone number to continue" backTo="/auth/choice">
    <div className="space-y-6">
      <div className="flex gap-2">
        <div className="w-24 h-14 bg-muted/50 border border-border rounded-xl flex items-center justify-center font-bold text-foreground text-lg">
          +968
        </div>
        <input type="tel" placeholder="9123 4567" className="flex-1 h-14 bg-muted/50 border border-border rounded-xl px-4 font-bold text-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
      </div>
      <a href="/auth/user/otp" className="block text-center py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(27,110,243,0.3)] text-lg transition-colors">
        Send OTP
      </a>
      <div className="text-center pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground mb-2">New to FixIt?</p>
        <a href="/auth/user/register" className="text-primary font-bold hover:underline">Create Account</a>
      </div>
    </div>
  </AuthLayout>
);

const UserOTP = () => (
  <AuthLayout title="Enter Code" subtitle="We sent a 6-digit code to your phone" backTo="/auth/user/login">
    <div className="space-y-8">
      <div className="flex justify-between gap-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <input key={i} type="text" maxLength={1} className="w-12 h-14 text-center font-bold text-2xl bg-muted/50 border border-border rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary" defaultValue={i === 1 ? '4' : ''} />
        ))}
      </div>
      <a href="/home" className="block text-center py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(27,110,243,0.3)] text-lg transition-colors">
        Verify & Login
      </a>
      <p className="text-center text-sm text-muted-foreground">
        Resend code in <span className="font-bold text-primary">0:59</span>
      </p>
    </div>
  </AuthLayout>
);

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Splash} />
      
      {/* Auth Flow */}
      <Route path="/auth/choice" component={AuthChoice} />
      <Route path="/auth/user/login" component={UserLogin} />
      <Route path="/auth/user/otp" component={UserOTP} />
      <Route path="/auth/user/register" component={UserRegister} />
      <Route path="/auth/vendor/login" component={VendorLogin} />
      <Route path="/auth/vendor/register" component={VendorRegister} />
      <Route path="/auth/vendor/kyc-id" component={VendorKycId} />
      <Route path="/auth/vendor/kyc-biz" component={VendorKycBiz} />
      <Route path="/auth/vendor/pending" component={VendorPending} />
      
      {/* Consumer Flow */}
      <Route path="/home" component={ConsumerHome} />
      <Route path="/search" component={ConsumerSearch} />
      <Route path="/categories" component={ConsumerCategories} />
      <Route path="/post-job" component={ConsumerPostJob} />
      <Route path="/job/:id/bids" component={JobBids} />
      <Route path="/job/:id/payment" component={JobPayment} />
      <Route path="/order/:id" component={OrderTracking} />
      <Route path="/order/:id/warranty" component={OrderWarranty} />
      <Route path="/order/:id/review" component={OrderReview} />
      <Route path="/wallet" component={ConsumerWallet} />
      <Route path="/profile" component={ConsumerProfile} />
      <Route path="/upgrade" component={ConsumerUpgrade} />

      {/* Vendor Flow */}
      <Route path="/vendor/home" component={VendorHome} />
      <Route path="/vendor/jobs" component={VendorJobs} />
      <Route path="/vendor/jobs/:id" component={VendorJobDetail} />
      <Route path="/vendor/order/:id" component={VendorOrder} />
      <Route path="/vendor/wallet" component={VendorWallet} />
      <Route path="/vendor/profile" component={VendorProfile} />
      <Route path="/vendor/upgrade" component={VendorUpgrade} />

      {/* Admin Engine */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/payments" component={AdminPayments} />
      <Route path="/admin/vendors" component={AdminVendors} />
      <Route path="/admin/disputes" component={AdminDisputes} />
      <Route path="/admin/catalog" component={AdminCatalog} />
      <Route path="/admin/users" component={AdminUsers} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
