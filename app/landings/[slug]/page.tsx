import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicLanding } from "@/lib/marketplace";
import PreviewGallery from "./preview-gallery";

export const dynamic = "force-dynamic";

export default async function LandingPage({ params }: PageProps<"/landings/[slug]">) {
  const { slug } = await params;
  const landing = await getPublicLanding(slug);
  if (!landing) notFound();

  const creator = landing.profiles[0];
  const creatorSlug = creator?.username;
  const initials = creator?.full_name?.slice(0, 2).toUpperCase() || "L";
  const screenshots = landing.landing_assets.filter((asset) => asset.kind === "screenshot").sort((first, second) => first.position - second.position).map((asset) => ({ url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/landing-previews/${asset.path}`, device: asset.path.includes("/mobile/") ? "mobile" as const : "desktop" as const }));
  const coverImage = landing.cover_image_url || (landing.landing_assets.find((asset) => asset.kind === "cover") ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/landing-previews/${landing.landing_assets.find((asset) => asset.kind === "cover")?.path}` : null);

  return <main className="landing-detail">
    <nav className="nav shell"><Link href="/" className="brand"><span>l</span>launchr</Link><Link href="/explorar" className="text-link">← Volver a explorar</Link></nav>
    <section className="landing-hero shell">
      <div className="landing-copy"><span className="eyebrow"><i className="dot" /> {landing.category.toUpperCase()}</span><h1>{landing.title}</h1><p>{landing.tagline || landing.description || "Una landing lista para lanzar."}</p><div className="landing-tags">{landing.technologies.map((technology) => <span key={technology}>{technology}</span>)}</div><div className="landing-author"><div className="avatar">{initials}</div><div><small>Creada por</small><b>{creator?.full_name || "Creador Launchr"}</b></div></div></div>
      <div className="landing-cover" style={coverImage ? { backgroundImage: `url(${coverImage})` } : undefined}>{!coverImage && <span>{landing.title}</span>}</div>
    </section>
    <section className="landing-body shell">
      <article className="landing-main-content"><span className="eyebrow">VISTA PREVIA</span><h2>{landing.title}<br /><em>lista para lanzar.</em></h2><p>{landing.description || landing.tagline || "Una landing cuidada hasta el último detalle."}</p><PreviewGallery title={landing.title} screenshots={screenshots} coverImage={coverImage} /><div className="landing-includes"><div className="includes-heading"><span className="eyebrow">LO QUE RECIBES</span><p>Todo lo necesario para publicar una presencia digital sólida desde el primer día.</p></div><div className="includes-grid"><div><b>01</b><strong>Diseño responsive</strong><p>Una experiencia cuidada en escritorio, tablet y móvil.</p></div><div><b>02</b><strong>Archivos editables</strong><p>Componentes claros para adaptar textos, colores y contenido.</p></div><div><b>03</b><strong>Lista para publicar</strong><p>Entrega ordenada y documentación para empezar sin fricción.</p></div></div></div></article>
      <aside className="landing-sidebar"><div className="purchase-card"><span>LICENCIA INDIVIDUAL</span><strong>{(landing.price_cents / 100).toFixed(0)} €</strong><p>Pago único. Incluye el código fuente, todos los recursos y futuras mejoras de la versión adquirida.</p><button className="button button-dark">Comprar landing <i>↗</i></button><small>Compra segura · Entrega inmediata</small></div><Link href={`/creadores/${creatorSlug || ""}`} className="creator-card"><div className="avatar">{initials}</div><div><span>CREADA POR</span><strong>{creator?.full_name || "Creador Launchr"}</strong><p>{creator?.bio || "Diseñador independiente en Launchr."}</p><small>Ver perfil y contactar ↗</small></div></Link></aside>
    </section>
  </main>;
}
