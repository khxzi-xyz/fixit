/**
 * Google Identity Services (GIS) helper. Loads the GSI script once and triggers
 * the One-Tap / popup credential flow, resolving with the Google ID token.
 * Requires VITE_GOOGLE_CLIENT_ID (an OAuth 2.0 Web client id). When unset,
 * isGoogleConfigured() is false and the UI shows a "needs config" message.
 */
const CLIENT_ID = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID as string | undefined;

export const isGoogleConfigured = () => Boolean(CLIENT_ID);

let scriptPromise: Promise<void> | null = null;
function loadScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    if ((window as any).google?.accounts?.id) return resolve();
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true; s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Google Sign-In"));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

/** Opens the Google credential flow and resolves with the ID token. */
export async function googleSignIn(): Promise<string> {
  if (!CLIENT_ID) throw new Error("Google sign-in is not configured (set VITE_GOOGLE_CLIENT_ID).");
  await loadScript();
  const google = (window as any).google;
  return new Promise<string>((resolve, reject) => {
    google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: (resp: { credential?: string }) => {
        if (resp.credential) resolve(resp.credential);
        else reject(new Error("No credential returned"));
      },
    });
    google.accounts.id.prompt((notif: any) => {
      if (notif.isNotDisplayed?.() || notif.isSkippedMoment?.()) {
        reject(new Error("Google prompt dismissed or blocked by browser"));
      }
    });
  });
}

export async function renderGoogleButton(containerId: string, onToken: (token: string) => void) {
  if (!CLIENT_ID) return;
  await loadScript();
  const google = (window as any).google;
  google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: (resp: { credential?: string }) => {
      if (resp.credential) onToken(resp.credential);
    },
  });
  const el = document.getElementById(containerId);
  if (el) {
    google.accounts.id.renderButton(el, { theme: "outline", size: "large", width: el.offsetWidth });
  }
}
