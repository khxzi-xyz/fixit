import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { I18nProvider } from "@/lib/i18n";
import { OnboardingGate } from "@/components/OnboardingGate";
import { NetworkGuard } from "@/components/NetworkGuard";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { setToken, getToken } from "@/lib/api";
import { loginWithFingerprint } from "@/lib/biometrics";

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

const Splash = () => (
  <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at center, #1B6EF3 2px, transparent 2px)', backgroundSize: '40px 40px' }}></div>
    <div className="text-center w-full max-w-sm relative z-10">
      <img src={import.meta.env.BASE_URL + "logo.png"} className="w-32 h-32 mx-auto mb-6 animate-pulse drop-shadow-[0_0_30px_rgba(27,110,243,0.5)]" />
      <h1 className="text-4xl font-bold tracking-tight text-white mb-2">FixIt Now Suite</h1>
      <p className="text-muted-foreground mb-8 text-sm">Select an app to continue</p>

      <div className="space-y-3">
        <a href="/auth/user/login" className="block px-6 py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-full w-full shadow-[0_0_20px_rgba(27,110,243,0.3)] transition-all transform hover:scale-[1.02] active:scale-95 text-base">
          Consumer App
        </a>
        <a href="/auth/vendor/login" className="block px-6 py-4 bg-warning hover:bg-warning/90 text-white font-bold rounded-full w-full shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-all transform hover:scale-[1.02] active:scale-95 text-base">
          Vendor App
        </a>
        <a href="/admin/login" className="block px-6 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-full w-full shadow-[0_0_20px_rgba(39,39,42,0.3)] transition-all transform hover:scale-[1.02] active:scale-95 text-base">
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
        {getToken() ? <Redirect to="/vendor/home" /> : <Redirect to="/auth/vendor/login" />}
      </Route>


      
      <Route path="/auth/vendor/login" component={VendorLogin} />
      <Route path="/auth/vendor/register" component={VendorRegister} />
      <Route path="/auth/vendor/kyc-biz" component={VendorKycBiz} />
      <Route path="/auth/vendor/kyc-id" component={VendorKycId} />
      <Route path="/auth/vendor/pending" component={VendorPending} />
      <Route path="/auth/user/otp" component={UserOTP} />



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



      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let sessionChecked = false;
    let bioChecked = false;

    const checkDone = () => {
      if (sessionChecked && bioChecked) {
        setIsInitializing(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) {
        setToken(session.access_token);
        if (window.location.pathname === "/" || window.location.pathname.includes("/auth/")) {
           window.location.replace("/vendor/home");
        }
        sessionChecked = true;
        bioChecked = true; // Skip bio if already have session
        checkDone();
      } else {
        sessionChecked = true;
        
        // Only prompt for biometrics if enabled and on auth screen
        const path = window.location.pathname;
        if (localStorage.getItem("fixit_bio_enabled") === "true" && (path.includes("/auth/") || path === "/")) {
          loginWithFingerprint().then(async (result) => {
            if (result?.token) {
              setToken(result.token);
              window.location.replace("/vendor/home");
            }
            bioChecked = true;
            checkDone();
          });
        } else {
          bioChecked = true;
          checkDone();
        }
      }
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        setToken(session.access_token);
      } else {
        setToken(null);
      }
    });
    
    // Initialize Capacitor Push Notifications
    import("@capacitor/push-notifications").then(({ PushNotifications }) => {
      PushNotifications.requestPermissions().then(result => {
        if (result.receive === 'granted') {
          PushNotifications.register();
        }
      });
      PushNotifications.addListener('registration', (token) => {
        console.log('Push registration success, token: ' + token.value);
        import("@/lib/api").then(({ api }) => {
          api.updateFcmToken(token.value).catch(() => {});
        });
      });
      PushNotifications.addListener('registrationError', (error: any) => {
        console.error('Error on push registration: ' + JSON.stringify(error));
      });
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push received: ' + JSON.stringify(notification));
        import("@/hooks/use-toast").then(({ toast }) => {
          toast({ title: notification.title, description: notification.body });
        });
      });
      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Push action performed: ' + JSON.stringify(notification));
      });
    }).catch(e => console.warn('PushNotifications plugin not available', e));

    // Hardware Back Button + Deep Link Interception
    import("@capacitor/app").then(({ App: CapApp }) => {
      CapApp.addListener("backButton", ({ canGoBack }) => {
        const path = window.location.pathname;
        if (path === "/vendor/home" || path === "/" || (!canGoBack && path !== "/auth/vendor/login")) {
          if (window.confirm("Are you sure you want to exit the app?")) {
            CapApp.exitApp();
          }
        } else if (path.includes("/auth/")) {
           window.history.back();
        } else {
          window.history.back();
        }
      });

      // Deep link handler
      CapApp.addListener("appUrlOpen", ({ url }) => {
        try {
          let path: string | null = null;
          if (url.startsWith("fixit://")) {
            path = "/" + url.replace("fixit://", "");
          } else if (url.includes("fixit-now.xyz")) {
            const u = new URL(url);
            path = u.pathname + u.search;
          }
          if (path) window.location.replace(path);
        } catch (err) {
          console.warn("[DeepLink] Failed to parse URL:", url, err);
        }
      });
    }).catch(() => {});

    return () => subscription.unsubscribe();
  }, []);

  if (isInitializing) {
    return <Splash />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <TooltipProvider>
          <NetworkGuard />
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
