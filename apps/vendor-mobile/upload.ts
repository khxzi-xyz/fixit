/**
 * Pick an image and upload it to Supabase Storage via the backend, returning a
 * public URL. Works on web (file picker → base64) and native (expo-image-picker).
 */
import * as ImagePicker from "expo-image-picker";
import { api } from "./api";

export async function pickAndUpload(folder = "misc"): Promise<string | null> {
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.6,
    base64: true,
  });
  if (res.canceled || !res.assets?.length) return null;
  const asset = res.assets[0];
  // On web, asset.uri may already be a data URL; otherwise build one from base64.
  let dataUrl = asset.uri;
  if (!dataUrl.startsWith("data:")) {
    if (!asset.base64) return null;
    const mime = asset.mimeType ?? "image/jpeg";
    dataUrl = `data:${mime};base64,${asset.base64}`;
  }
  const { url } = await api.uploadImage(dataUrl, folder);
  return url;
}
