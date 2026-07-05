import { NativeBiometric } from "@capgo/capacitor-native-biometric";

const CREDENTIAL_SERVER = "com.khxzi.fixit";

/**
 * Checks if biometric hardware is available and enrolled on the device.
 */
export async function isFingerprintAvailable(): Promise<boolean> {
  try {
    const result = await NativeBiometric.isAvailable();
    return result.isAvailable;
  } catch (error) {
    console.error("Biometric availability check failed:", error);
    return false;
  }
}

/**
 * Saves the user's secret session string into Android's native hardware keystore.
 */
export async function saveSecureToken(userId: string, token: string): Promise<boolean> {
  try {
    await NativeBiometric.setCredentials({
      username: userId,
      password: token,
      server: CREDENTIAL_SERVER,
    });
    return true;
  } catch (error) {
    console.error("Failed to save secure token:", error);
    return false;
  }
}

/**
 * Triggers the native Android fingerprint overlay. On match, retrieves and returns 
 * the decrypted secret token string. Returns null if failed or canceled.
 */
export async function loginWithFingerprint(): Promise<{ userId: string; token: string } | null> {
  try {
    const isAvailable = await isFingerprintAvailable();
    if (!isAvailable) return null;

    const credentials = await NativeBiometric.getCredentials({
      server: CREDENTIAL_SERVER,
    });

    return {
      userId: credentials.username,
      token: credentials.password,
    };
  } catch (error) {
    console.error("Biometric login failed or was canceled:", error);
    return null;
  }
}

/**
 * Removes the secure token from the hardware keystore.
 */
export async function removeSecureToken(): Promise<boolean> {
  try {
    await NativeBiometric.deleteCredentials({
      server: CREDENTIAL_SERVER,
    });
    return true;
  } catch (error) {
    console.error("Failed to remove secure token:", error);
    return false;
  }
}
