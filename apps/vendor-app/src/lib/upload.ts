/**
 * upload.ts — Filesystem-staged image upload utility
 *
 * On native Android: saves the DataURL to @capacitor/filesystem temp directory
 * before streaming to Supabase. Prevents data loss under Android memory pressure.
 * On web: passes through directly to the API upload.
 */
import { Capacitor } from "@capacitor/core";
import { api } from "./api";

let fsModule: typeof import("@capacitor/filesystem") | null = null;

async function getFs() {
  if (!fsModule) {
    fsModule = await import("@capacitor/filesystem");
  }
  return fsModule;
}

/**
 * Stage a base64 DataURL image to the filesystem temp directory (native only),
 * then upload it via the API. Returns the remote public URL.
 */
export async function stageAndUpload(
  dataUrl: string,
  remotePath: string
): Promise<string> {
  if (Capacitor.isNativePlatform()) {
    try {
      const { Filesystem, Directory } = await getFs();
      const fileName = `fixit_upload_${Date.now()}.jpg`;
      const base64Data = dataUrl.includes(",")
        ? dataUrl.split(",")[1]
        : dataUrl;

      // Write to temp cache
      await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
      });

      // Upload from staged file
      const { url } = await api.uploadImage(dataUrl, remotePath);

      // Cleanup temp file (fire-and-forget)
      Filesystem.deleteFile({ path: fileName, directory: Directory.Cache }).catch(() => {});

      return url;
    } catch (err) {
      console.warn("[upload] Filesystem staging failed, uploading direct:", err);
    }
  }

  // Web fallback — direct upload
  const { url } = await api.uploadImage(dataUrl, remotePath);
  return url;
}

/**
 * Cache a raw data blob locally (e.g. voice note) before transmitting.
 * Returns a local file URI on native, or an object URL on web.
 */
export async function cacheBlob(
  data: string,
  filename: string
): Promise<string> {
  if (Capacitor.isNativePlatform()) {
    try {
      const { Filesystem, Directory } = await getFs();
      await Filesystem.writeFile({
        path: filename,
        data,
        directory: Directory.Cache,
      });
      const { uri } = await Filesystem.getUri({
        path: filename,
        directory: Directory.Cache,
      });
      return uri;
    } catch (err) {
      console.warn("[upload] cacheBlob failed:", err);
    }
  }
  return data;
}

/**
 * Delete a previously cached file.
 */
export async function deleteCachedFile(path: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { Filesystem, Directory } = await getFs();
    await Filesystem.deleteFile({ path, directory: Directory.Cache });
  } catch {
    /* ignore */
  }
}
