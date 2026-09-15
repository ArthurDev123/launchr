import { createClient } from "@/lib/supabase/server";

export type PublicCreator = { id: string; full_name: string; username: string | null; avatar_url: string | null; bio: string | null; contact_email: string | null; website_url: string | null; role: string };
export type PublicLanding = { id: string; creator_id: string; slug: string; title: string; tagline: string | null; description: string | null; category: string; technologies: string[]; price_cents: number; currency: string; cover_image_url: string | null; preview_url: string | null; demo_url: string | null; sales_count: number; view_count: number; published_at: string | null; profiles: PublicCreator | null };

const landingFields = "id, creator_id, slug, title, tagline, description, category, technologies, price_cents, currency, cover_image_url, preview_url, demo_url, sales_count, view_count, published_at, profiles(id, full_name, username, avatar_url, bio, contact_email, website_url, role)";

export async function getFeaturedLandings() {
  const supabase = await createClient();
  if (!supabase) return { landings: [] as PublicLanding[], error: null };
  const { data, error } = await supabase.from("landings").select(landingFields).eq("status", "published").order("featured", { ascending: false }).order("published_at", { ascending: false }).limit(3);
  return { landings: (data ?? []) as unknown as PublicLanding[], error: error?.message ?? null };
}

export async function getPublicLandings(category?: string) {
  const supabase = await createClient();
  if (!supabase) return { landings: [] as PublicLanding[], error: null };
  let query = supabase.from("landings").select(landingFields).eq("status", "published").order("published_at", { ascending: false });
  if (category) query = query.eq("category", category);
  const { data, error } = await query;
  return { landings: (data ?? []) as unknown as PublicLanding[], error: error?.message ?? null };
}

export async function getPublicLanding(slug: string) {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase.from("landings").select(`${landingFields}, landing_assets(path, kind, device, position)`).eq("status", "published").eq("slug", slug).maybeSingle();
  return data as unknown as (PublicLanding & { landing_assets: { path: string; kind: string; device: "desktop" | "mobile" | null; position: number }[] }) | null;
}

export async function getPublicCreator(username: string) {
  const supabase = await createClient();
  if (!supabase) return null;
  const profileFields = "id, full_name, username, avatar_url, bio, contact_email, website_url, role";
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(username);
  const { data: profile } = isUuid
    ? await supabase.from("profiles").select(profileFields).eq("id", username).maybeSingle()
    : await supabase.from("profiles").select(profileFields).eq("username", username).maybeSingle();
  if (!profile) return null;
  const { data: landings } = await supabase.from("landings").select("id, slug, title, tagline, category, price_cents, currency, cover_image_url, status").eq("creator_id", profile.id).eq("status", "published").order("published_at", { ascending: false });
  return { ...profile, landings: landings ?? [] } as { id: string; full_name: string; username: string | null; avatar_url: string | null; bio: string | null; contact_email: string | null; website_url: string | null; role: string; landings: { id: string; slug: string; title: string; tagline: string | null; category: string; price_cents: number; currency: string; cover_image_url: string | null; status: string }[] };
}
