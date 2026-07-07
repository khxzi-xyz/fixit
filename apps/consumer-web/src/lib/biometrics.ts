import { NativeBiometric } from "capacitor-native-biometric";
import { Preferences } from "@capacitor/preferences";
import { api, setToken } from "./api";

const BIO_CRED_KEY = "fixit_bio_cred";

export async function isFingerprintAvailable(): Promise<boolean> {
  try {
    const result = await NativeBiometric.isAvailable();
    return result.isAvailable;
  } catch (e) {
    return false;
  }
}

export async function saveSecureToken(userId: string, token: string): Promise<boolean> {
  try {
    // Actually the token is usually stored in KeyStore with NativeBiometric
    await NativeBiometric.setCredentials({
      username: userId,
      password: token,
      server: "fixit.now",
    });
    // Mark that we have bio credentials enabled
    await Preferences.set({ key: BIO_CRED_KEY, value: userId });
    return true;
  } catch (e) {
    console.error("Biometric save failed", e);
    return false;
  }
}

export async function loginWithFingerprint(): Promise<{ userId: string; token: string } | null> {
  try {
    const { value: userId } = await Preferences.get({ key: BIO_CRED_KEY });
    if (!userId) return null;

    // Prompt user for fingerprint/face
    await NativeBiometric.verifyIdentity({
      reason: "Authenticate to login",
      title: "Biometric Login",
    });

    const credentials = await NativeBiometric.getCredentials({
      server: "fixit.now",
    });
    
    if (credentials.username === userId && credentials.password) {
      setToken(credentials.password);
      return { userId: credentials.username, token: credentials.password };
    }
    return null;
  } catch (e) {
    console.error("Biometric login failed", e);
    return null;
  }
}

export async function removeSecureToken(): Promise<boolean> {
  try {
    await NativeBiometric.deleteCredentials({ server: "fixit.now" });
    await Preferences.remove({ key: BIO_CRED_KEY });
    return true;
  } catch (e) {
    return false;
  }
}
