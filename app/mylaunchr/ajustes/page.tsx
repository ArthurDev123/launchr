import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";
import SettingsForm from "./settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!user || !supabase) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("full_name, username, bio, avatar_url, contact_email, website_url").eq("id", user.id).maybeSingle();
  const fullName = profile?.full_name || user.user_metadata.full_name || user.email?.split("@")[0] || "";
  const initials = String(fullName).split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  return <main className="dashboard"><aside className="sidebar"><Link href="/" className="brand"><span>l</span>launchr</Link><div className="workspace"><div className="avatar">{initials}</div><div><b>{fullName}</b><small>Creator workspace</small></div><span>⌄</span></div><nav className="side-nav"><Link href="/mylaunchr"><i>◫</i> Resumen</Link><Link href="/mylaunchr#landings"><i>◇</i> Mis landings</Link><Link href="/mylaunchr#ventas"><i>↗</i> Ventas</Link><a href="#recursos"><i>◌</i> Recursos</a></nav><div className="sidebar-bottom"><Link className="active" href="/mylaunchr/ajustes"><i>⚙</i> Ajustes</Link><form action={signOut}><button className="logout" type="submit">← Cerrar sesión</button></form><Link href="/">← Volver a Launchr</Link></div></aside><section className="settings-content"><header className="settings-header"><div><p>MYLAUNCHR / AJUSTES</p><h1>Tu perfil de creador.</h1></div><Link href="/mylaunchr" className="text-link">← Volver al resumen</Link></header><SettingsForm fullName={fullName} username={profile?.username ?? null} bio={profile?.bio ?? null} avatarUrl={profile?.avatar_url ?? null} contactEmail={profile?.contact_email ?? null} websiteUrl={profile?.website_url ?? null} email={user.email ?? ""} /><section className="signout-card"><div><span className="eyebrow">SESIÓN</span><h2>¿Quieres salir?</h2><p>Al cerrar sesión, podrás volver a entrar cuando quieras con tu email y contraseña.</p></div><form action={signOut}><button className="button signout-button" type="submit">Cerrar sesión <i>→</i></button></form></section></section></main>;
}
