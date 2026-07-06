export async function isFingerprintAvailable(): Promise<boolean> {
  return false;
}

export async function saveSecureToken(userId: string, token: string): Promise<boolean> {
  return false;
}

export async function loginWithFingerprint(): Promise<{ userId: string; token: string } | null> {
  return null;
}

export async function removeSecureToken(): Promise<boolean> {
  return true;
}
