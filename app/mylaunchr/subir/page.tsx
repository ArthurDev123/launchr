import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import UploadForm from "./upload-form";

export const dynamic = "force-dynamic";

export default async function UploadLandingPage() {
  const supabase = await createClient();
  const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!user) redirect("/login");
  return <main className="upload-page"><nav className="upload-nav"><Link href="/" className="brand"><span>l</span>launchr</Link><Link href="/mylaunchr" className="text-link">← Volver al espacio</Link></nav><header className="upload-header"><span className="eyebrow"><i className="dot" /> NUEVA LANDING</span><h1>Comparte algo<br /><em>que merezca lanzarse.</em></h1><p>Revisaremos los detalles antes de publicarla en Launchr. Puedes guardar cambios más adelante desde tu catálogo.</p></header><UploadForm /></main>;
}
