import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, lazy, Suspense, useState } from "react";
import { supabase } from "@/lib/supabase";
import { setToken, getToken } from "@/lib/api";
import { setTranslationLang } from "@/lib/realtime-translate";
import { I18nProvider } from "@/lib/i18n";
import { OnboardingGate } from "@/components/OnboardingGate";
import { PermissionsPrompt } from "@/components/PermissionsPrompt";
import { NotificationManager } from "@/components/NotificationManager";
import { NetworkGuard } from "@/components/NetworkGuard";
import NotFound from "@/pages/not-found";
import { loginWithFingerprint } from "@/lib/biometrics";
import { Splash } from "@/components/Splash";

// ── Auth ──────────────────────────────────────────────────────────────────────
import UserRegister from "./pages/auth/UserRegister";
import { UserLogin, UserOTP } from "./pages/auth/UserAuth";
import VendorLogin from "./pages/auth/VendorLogin";
import VendorRegister from "./pages/auth/VendorRegister";
import VendorKycId from "./pages/auth/VendorKycId";
import VendorKycBiz from "./pages/auth/VendorKycBiz";
import VendorPending from "./pages/auth/VendorPending";

// ── Consumer ──────────────────────────────────────────────────────────────────
import ConsumerHome from "./pages/consumer/ConsumerHome";
import ConsumerSearch from "./pages/consumer/ConsumerSearch";
import ConsumerCategories from "./pages/consumer/ConsumerCategories";
import ConsumerPostJob from "./pages/consumer/ConsumerPostJob";
import ConsumerProfile from "./pages/consumer/ConsumerProfile";
import ConsumerMyAccount from "./pages/consumer/ConsumerMyAccount";
import ConsumerRewards from "./pages/consumer/ConsumerRewards";
import ConsumerNotifications from "./pages/consumer/ConsumerNotifications";
import ConsumerSupport from "./pages/consumer/ConsumerSupport";
import ConsumerMyJobs from "./pages/consumer/ConsumerMyJobs";
import ConsumerChats from "./pages/consumer/ConsumerChats";
import ConsumerUpgrade from "./pages/consumer/ConsumerUpgrade";
import ConsumerEditProfile from "./pages/consumer/ConsumerEditProfile";
import ConsumerAddresses from "./pages/consumer/ConsumerAddresses";
import ConsumerRequestService from "./pages/consumer/ConsumerRequestService";
import ConsumerInvite from "./pages/consumer/ConsumerInvite";
import ConsumerPayments from "./pages/consumer/ConsumerPayments";
import SupportChat from "./pages/consumer/SupportChat";
import ConsumerMarketplace from "./pages/consumer/ConsumerMarketplace";
import PublicVendorProfile from "./pages/consumer/PublicVendorProfile";
import JobBids from "./pages/consumer/JobBids";
import JobPayment from "./pages/consumer/JobPayment";
import OrderTracking from "./pages/consumer/OrderTracking";
import OrderWarranty from "./pages/consumer/OrderWarranty";
import OrderReview from "./pages/consumer/OrderReview";
import AboutUs from "./pages/consumer/AboutUs";
import AdvertiseWithUs from "./pages/consumer/AdvertiseWithUs";
import ConsumerStore from "./pages/consumer/ConsumerStore";
import ConsumerEmergency from "./pages/consumer/ConsumerEmergency";
import ConsumerMaintenance from "./pages/consumer/ConsumerMaintenance";
import ConsumerFeed from "./pages/consumer/ConsumerFeed";
const ConsumerSettings = lazy(() => import("@/pages/consumer/ConsumerSettings"));
const ConsumerWallet = lazy(() => import("@/pages/consumer/ConsumerWallet"));
const ConsumerFavorites = lazy(() => import("@/pages/consumer/ConsumerFavorites"));
const SavedAddresses = lazy(() => import("@/pages/consumer/SavedAddresses"));
const PaymentSettings = lazy(() => import("@/pages/consumer/PaymentSettings"));
const AccountSecurity = lazy(() => import("@/pages/consumer/AccountSecurity"));
const DisputeWarrantyManager = lazy(() => import("@/pages/consumer/DisputeWarrantyManager"));

// ── Legal ─────────────────────────────────────────────────────────────────────
import TermsOfService from "./pages/legal/TermsOfService";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";

// ── Query client ──────────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: { 
    queries: { 
      retry: 1, 
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days (offline cache)
    } 
  },
});

const persister = createSyncStoragePersister({
  storage: typeof window !== "undefined" ? window.localStorage : undefined,
});

function Router() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>}>
      <Switch>
      {/* Root */}
      <Route path="/">
        {getToken() ? <Redirect to="/home" /> : <Redirect to="/auth/user/login" />}
      </Route>

      {/* Auth */}
      <Route path="/auth/login" component={() => { 
        if (typeof window !== "undefined") {
          window.location.replace('/auth/user/login' + window.location.hash);
        }
        return null;
      }} />
      <Route path="/auth/user/login" component={UserLogin} />
      <Route path="/auth/user/otp" component={UserOTP} />
      <Route path="/auth/user/register" component={UserRegister} />

      {/* Vendor auth */}
      <Route path="/auth/vendor/login" component={VendorLogin} />
      <Route path="/auth/vendor/otp" component={UserOTP} />
      <Route path="/auth/vendor/register" component={VendorRegister} />
      <Route path="/auth/vendor/kyc-id" component={VendorKycId} />
      <Route path="/auth/vendor/kyc-biz" component={VendorKycBiz} />
      <Route path="/auth/vendor/pending" component={VendorPending} />

      {/* Main consumer screens */}
      <Route path="/home" component={ConsumerHome} />
      <Route path="/search" component={ConsumerSearch} />
      <Route path="/my-jobs" component={ConsumerMyJobs} />
      <Route path="/chats" component={ConsumerChats} />
      <Route path="/account" component={AccountSecurity} />
      <Route path="/settings" component={ConsumerSettings} />
      <Route path="/settings/payments" component={PaymentSettings} />
      <Route path="/wallet" component={ConsumerWallet} />
      <Route path="/support/warranties" component={DisputeWarrantyManager} />
      
      <Route path="/profile" component={ConsumerProfile} />
      <Route path="/profile/edit" component={ConsumerEditProfile} />
      <Route path="/profile/addresses" component={ConsumerAddresses} />
      <Route path="/profile/rewards" component={ConsumerRewards} />
      <Route path="/profile/:id" component={PublicVendorProfile} />
      
      <Route path="/marketplace" component={ConsumerMarketplace} />
      <Route path="/categories" component={ConsumerCategories} />

      {/* Job flow */}
      <Route path="/post-job" component={ConsumerPostJob} />
      <Route path="/request-service" component={ConsumerRequestService} />
      <Route path="/job/:id/bids" component={JobBids} />
      <Route path="/job/:id/payment" component={JobPayment} />
      <Route path="/job/:id/tracking" component={OrderTracking} />
      <Route path="/order/:id" component={OrderTracking} />
      <Route path="/order/:id/warranty" component={OrderWarranty} />
      <Route path="/order/:id/review" component={OrderReview} />

      {/* Wallet */}
      <Route path="/wallet" component={ConsumerWallet} />

      {/* Account management */}
      <Route path="/account" component={ConsumerMyAccount} />

      {/* Rewards */}
      <Route path="/rewards" component={ConsumerRewards} />

      {/* Notifications */}
      <Route path="/notifications" component={ConsumerNotifications} />

      {/* Settings */}
      <Route path="/settings" component={ConsumerSettings} />
      <Route path="/settings/payments" component={ConsumerPayments} />

      {/* Upgrade */}
      <Route path="/upgrade" component={ConsumerUpgrade} />

      {/* Support */}
      <Route path="/support" component={ConsumerSupport} />
      <Route path="/support/chat" component={SupportChat} />

      {/* Referral invite landing */}
      <Route path="/invite/:code" component={ConsumerInvite} />
      <Route path="/r/:code" component={ConsumerInvite} />

      {/* New pages */}
      <Route path="/about" component={AboutUs} />
      <Route path="/advertise" component={AdvertiseWithUs} />
      <Route path="/store" component={ConsumerStore} />
      <Route path="/emergency" component={ConsumerEmergency} />
      <Route path="/maintenance" component={ConsumerMaintenance} />
      <Route path="/feed" component={ConsumerFeed} />
      <Route path="/favorites" component={ConsumerFavorites} />

      {/* Legal */}
      <Route path="/tos" component={TermsOfService} />
      <Route path="/privacy" component={PrivacyPolicy} />

      {/* Vendor public profile */}
      <Route path="/vendor/:id" component={PublicVendorProfile} />

      {/* 404 */}
      <Route component={NotFound} />
      </Switch>
    </Suspense>
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

    // Restore auth token
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) {
        setToken(session.access_token);
        const refCode = localStorage.getItem("fixit_referral_code");
        if (refCode) {
          import("@/lib/api").then(({ api }) => {
            api.claimReferral(refCode).finally(() => localStorage.removeItem("fixit_referral_code"));
          });
        }
        if (window.location.pathname.includes("/auth/")) {
           const search = window.location.search;
           const hash = window.location.hash;
           if (!search.includes("reset=1") && !hash.includes("type=recovery") && !search.includes("type=recovery")) {
             window.location.replace("/home");
           }
        }
        sessionChecked = true;
        bioChecked = true; // Skip bio if already have session
        checkDone();
      } else {
        sessionChecked = true;
        
        // Only prompt for biometrics if enabled and on auth screen or root
        const path = window.location.pathname;
        if (localStorage.getItem("fixit_bio_enabled") === "true" && (path.includes("/auth/") || path === "/")) {
          loginWithFingerprint().then(async (result) => {
            if (result?.token) {
              setToken(result.token);
              const rc = localStorage.getItem("fixit_referral_code");
              if (rc) {
                const { api } = await import("@/lib/api");
                await api.claimReferral(rc).catch(()=>{});
                localStorage.removeItem("fixit_referral_code");
              }
              window.location.replace("/home");
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setToken(session?.access_token ?? null);
      if (session?.access_token && window.location.pathname.includes("/auth/")) {
         const search = window.location.search;
         const hash = window.location.hash;
         if (!search.includes("reset=1") && !hash.includes("type=recovery") && !search.includes("type=recovery")) {
           window.location.replace("/home");
         }
      }
    });

    // Restore language + translation
    const savedLang = localStorage.getItem("fixit_lang") || "en";
    setTranslationLang(savedLang);
    document.documentElement.setAttribute("dir", savedLang === "ar" || savedLang === "ur" ? "rtl" : "ltr");

    // Restore theme
    const savedTheme = localStorage.getItem("fixit_theme") || "dark";
    document.documentElement.classList.toggle("dark", savedTheme === "dark");

    // Permissions are handled by PermissionsPrompt on startup
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
        import("@/hooks/use-toast").then(({ toast }) => {
          toast({ title: notification.title, description: notification.body });
        });
      });
      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        import("@/hooks/use-toast").then(({ toast }) => {
          toast({ title: "Notification opened", description: notification.notification.title });
        });
      });
    }).catch(e => console.warn('PushNotifications plugin not available', e));

    // Hardware Back Button + Deep Link Interception
    import("@capacitor/app").then(({ App: CapApp }) => {
      // Back button handler
      CapApp.addListener("backButton", ({ canGoBack }) => {
        const path = window.location.pathname;
        if (path === "/home" || path === "/" || (!canGoBack && path !== "/auth/user/login")) {
          if (window.confirm("Are you sure you want to exit the app?")) {
            CapApp.exitApp();
          }
        } else if (path.includes("/auth/")) {
          if (sessionStorage.getItem("fixit_guest") || localStorage.getItem("fixit_bio_enabled")) {
             window.location.replace("/home");
          } else {
             window.history.back();
          }
        } else {
          window.history.back();
        }
      });

      // Deep link handler — processes fixit:// and https://fixit-now.xyz/ links
      CapApp.addListener("appUrlOpen", ({ url }) => {
        try {
          // Parse path from both custom scheme and universal links
          let path: string | null = null;
          if (url.startsWith("fixit://")) {
            path = "/" + url.replace("fixit://", "");
          } else if (url.includes("fixit-now.xyz")) {
            const u = new URL(url);
            path = u.pathname + u.search;
          }
          if (path) {
            // Map known deep link paths
            // fixit://order/123 → /order/123
            // fixit://vendor/abc → /vendor/abc
            // fixit://invite/CODE → /invite/CODE
            // fixit://job/123/bids → /job/123/bids
            window.location.replace(path);
          }
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
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
      <I18nProvider>
        <TooltipProvider>
          <NetworkGuard />
          <OnboardingGate>
            <PermissionsPrompt onComplete={() => {}} />
            <NotificationManager />
            <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") ?? ""}>
              <Router />
            </WouterRouter>
          </OnboardingGate>
          <Toaster />
        </TooltipProvider>
      </I18nProvider>
    </PersistQueryClientProvider>
  );
}

export default App;
