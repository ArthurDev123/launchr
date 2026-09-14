"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type UploadState = { error?: string; success?: string };
export type SettingsState = { error?: string; success?: string };

const toSlug = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);
const optionalUrl = (value: FormDataEntryValue | null) => { const url = String(value ?? "").trim(); return url || null; };

export async function updateProfile(_: SettingsState, formData: FormData): Promise<SettingsState> {
  const supabase = await createClient();
  const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!supabase || !user) return { error: "Tu sesión ha caducado. Vuelve a iniciar sesión." };
  const fullName = String(formData.get("full_name") ?? "").trim();
  const usernameInput = String(formData.get("username") ?? "").trim().toLowerCase();
  const username = usernameInput || null;
  const bio = String(formData.get("bio") ?? "").trim() || null;
  const avatarUrl = optionalUrl(formData.get("avatar_url"));
  const contactEmail = String(formData.get("contact_email") ?? "").trim() || null;
  const websiteUrl = optionalUrl(formData.get("website_url"));
  if (fullName.length < 2 || fullName.length > 80) return { error: "El nombre debe tener entre 2 y 80 caracteres." };
  if (username && !/^[a-z0-9-]{3,30}$/.test(username)) return { error: "El nombre de usuario debe tener entre 3 y 30 caracteres: minúsculas, números y guiones." };
  if (bio && bio.length > 400) return { error: "La biografía no puede superar 400 caracteres." };
  const { error } = await supabase.from("profiles").update({ full_name: fullName, username, bio, avatar_url: avatarUrl, contact_email: contactEmail, website_url: websiteUrl }).eq("id", user.id);
  if (error) return { error: error.code === "23505" ? "Ese nombre de usuario ya está en uso." : `No se pudieron guardar los cambios: ${error.message}` };
  await supabase.auth.updateUser({ data: { full_name: fullName } });
  revalidatePath("/mylaunchr");
  revalidatePath("/mylaunchr/ajustes");
  return { success: "Cambios guardados correctamente." };
}

export async function uploadLanding(_: UploadState, formData: FormData): Promise<UploadState> {
  const supabase = await createClient();
  const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!supabase || !user) return { error: "Tu sesión ha caducado. Vuelve a iniciar sesión." };
  const title = String(formData.get("title") ?? "").trim();
  const slug = toSlug(String(formData.get("slug") ?? title));
  const price = Number(String(formData.get("price") ?? "").replace(",", "."));
  const cover = formData.get("cover");
  const source = formData.get("source");
  const desktopScreenshots = formData.getAll("screenshots_desktop").filter((file): file is File => file instanceof File && file.size > 0);
  const mobileScreenshots = formData.getAll("screenshots_mobile").filter((file): file is File => file instanceof File && file.size > 0);
  if (title.length < 2 || !slug || !Number.isFinite(price) || price < 0) return { error: "Revisa el título, slug y precio de tu landing." };
  if (!String(formData.get("tagline") ?? "").trim() || !String(formData.get("description") ?? "").trim() || !String(formData.get("technologies") ?? "").trim()) return { error: "Completa el tagline, la descripción y las tecnologías." };
  if (!(cover instanceof File) || cover.size === 0 || !cover.type.startsWith("image/") || cover.size > 5 * 1024 * 1024) return { error: "Añade una portada de imagen (máximo 5 MB)." };
  if (!(source instanceof File) || source.size === 0 || source.size > 25 * 1024 * 1024 || (!source.type && !source.name.toLowerCase().endsWith(".zip"))) return { error: "Añade un archivo ZIP de la landing (máximo 25 MB)." };
  const allScreenshots = [...desktopScreenshots, ...mobileScreenshots];
  if (desktopScreenshots.length > 5 || mobileScreenshots.length > 5) return { error: "Puedes añadir como máximo 5 capturas por dispositivo." };
  if (allScreenshots.some((file) => !file.type.startsWith("image/") || file.size > 5 * 1024 * 1024)) return { error: "Cada captura debe ser una imagen de máximo 5 MB." };

  const landingId = crypto.randomUUID();
  const basePath = `${user.id}/${landingId}`;
  const coverExtension = cover.name.split(".").pop()?.toLowerCase() || "jpg";
  const sourceExtension = source.name.split(".").pop()?.toLowerCase() || "zip";
  const coverPath = `${basePath}/cover.${coverExtension}`;
  const sourcePath = `${basePath}/source.${sourceExtension}`;
  const uploadedPreviewPaths: string[] = [];
  const uploadedSourcePaths: string[] = [];
  const removeUploads = async () => {
    if (uploadedPreviewPaths.length) await supabase.storage.from("landing-previews").remove(uploadedPreviewPaths);
    if (uploadedSourcePaths.length) await supabase.storage.from("landing-files").remove(uploadedSourcePaths);
  };
  const { error: coverError } = await supabase.storage.from("landing-previews").upload(coverPath, cover, { contentType: cover.type, upsert: false });
  if (coverError) return { error: `No se pudo subir la portada: ${coverError.message}` };
  uploadedPreviewPaths.push(coverPath);
  const { error: sourceError } = await supabase.storage.from("landing-files").upload(sourcePath, source, { contentType: source.type || "application/octet-stream", upsert: false });
  if (sourceError) { await removeUploads(); return { error: `No se pudo subir el archivo fuente: ${sourceError.message}` }; }
  uploadedSourcePaths.push(sourcePath);
  const screenshotAssets: { landing_id: string; path: string; kind: "screenshot"; device: "desktop" | "mobile"; position: number }[] = [];
  for (const [device, files] of [["desktop", desktopScreenshots], ["mobile", mobileScreenshots]] as const) {
    for (const [index, file] of files.entries()) {
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${basePath}/screenshots/${device}/${String(index + 1).padStart(2, "0")}.${extension}`;
      const { error } = await supabase.storage.from("landing-previews").upload(path, file, { contentType: file.type, upsert: false });
      if (error) { await removeUploads(); return { error: `No se pudo subir una captura: ${error.message}` }; }
      uploadedPreviewPaths.push(path);
      screenshotAssets.push({ landing_id: landingId, path, kind: "screenshot", device, position: index });
    }
  }
  const { data: coverUrl } = supabase.storage.from("landing-previews").getPublicUrl(coverPath);
  const { error: landingError } = await supabase.from("landings").insert({ id: landingId, creator_id: user.id, slug, title, tagline: String(formData.get("tagline") ?? "").trim() || null, description: String(formData.get("description") ?? "").trim() || null, category: String(formData.get("category") ?? "other"), technologies: String(formData.get("technologies") ?? "").split(",").map((value) => value.trim()).filter(Boolean), price_cents: Math.round(price * 100), currency: "EUR", cover_image_url: coverUrl.publicUrl, demo_url: optionalUrl(formData.get("demo_url")), repository_url: optionalUrl(formData.get("repository_url")), status: "pending_review" });
  if (landingError) { await removeUploads(); return { error: landingError.code === "23505" ? "Ese slug ya está en uso. Elige otro diferente." : `No se pudo crear la landing: ${landingError.message}` }; }
  const { error: assetError } = await supabase.from("landing_assets").insert([{ landing_id: landingId, path: coverPath, kind: "cover", position: 0 }, { landing_id: landingId, path: sourcePath, kind: "source", position: 0 }, ...screenshotAssets]);
  if (assetError) { await supabase.from("landings").delete().eq("id", landingId); await removeUploads(); return { error: "La landing se creó, pero faltó registrar uno de los archivos. Contacta con soporte." }; }
  revalidatePath("/mylaunchr");
  redirect("/mylaunchr?uploaded=1");
}
