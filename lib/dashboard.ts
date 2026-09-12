import { createClient } from "@/lib/supabase/server";

export type Landing = { id: string; title: string; slug: string; status: "draft" | "pending_review" | "published" | "rejected" | "archived"; price_cents: number; currency: string; cover_image_url: string | null; sales_count: number; view_count: number; created_at: string };
type OrderItem = { unit_price_cents: number; created_at: string; orders: { status: string }[] };

export async function getCreatorDashboard() {
  const supabase = await createClient();
  if (!supabase) return { user: null, profile: null, landings: [] as Landing[], stats: null, error: "Supabase no está configurado todavía." };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null, landings: [] as Landing[], stats: null, error: null };

  const [profileResult, landingsResult, salesResult] = await Promise.all([
    supabase.from("profiles").select("full_name, username, avatar_url").eq("id", user.id).maybeSingle(),
    supabase.from("landings").select("id, title, slug, status, price_cents, currency, cover_image_url, sales_count, view_count, created_at").eq("creator_id", user.id).order("created_at", { ascending: false }),
    supabase.from("order_items").select("unit_price_cents, created_at, orders!inner(status)").eq("creator_id", user.id).eq("orders.status", "paid"),
  ]);

  const landings = (landingsResult.data ?? []) as Landing[];
  const paidItems = (salesResult.data ?? []) as OrderItem[];
  const now = Date.now();
  const month = 30 * 24 * 60 * 60 * 1000;
  const currentItems = paidItems.filter((item) => now - new Date(item.created_at).getTime() < month);
  const previousItems = paidItems.filter((item) => { const age = now - new Date(item.created_at).getTime(); return age >= month && age < month * 2; });
  const sum = (items: OrderItem[]) => items.reduce((total, item) => total + item.unit_price_cents, 0);

  return {
    user,
    profile: profileResult.data,
    landings,
    error: profileResult.error?.message ?? landingsResult.error?.message ?? salesResult.error?.message ?? null,
    stats: {
      totalSales: paidItems.length,
      revenueCents: sum(paidItems),
      totalViews: landings.reduce((total, landing) => total + landing.view_count, 0),
      currentSales: currentItems.length,
      currentRevenueCents: sum(currentItems),
      previousSales: previousItems.length,
      previousRevenueCents: sum(previousItems),
    },
  };
}

export function euros(cents: number, currency = "EUR") {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency, maximumFractionDigits: 0 }).format(cents / 100);
}
