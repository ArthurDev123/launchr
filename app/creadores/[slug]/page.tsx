import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicCreator } from "@/lib/marketplace";

export const dynamic = "force-dynamic";

export default async function CreatorPage({ params }: PageProps<"/creadores/[slug]">) {
  const { slug } = await params;
  const creator = await getPublicCreator(slug);
  if (!creator) notFound();

  return <main className="creator-profile-page"><nav className="nav shell"><Link href="/" className="brand"><span>l</span>launchr</Link><Link href="/explorar" className="text-link">← Volver al marketplace</Link></nav><section className="creator-profile-hero shell"><div className="creator-profile-avatar" style={creator.avatar_url ? { backgroundImage: `url(${creator.avatar_url})` } : undefined}>{!creator.avatar_url && creator.full_name.slice(0, 2).toUpperCase()}</div><div><span className="eyebrow"><i className="dot" /> CREADOR EN LAUNCHR</span><h1>{creator.full_name}</h1><p className="creator-role">Diseñador independiente</p><p className="creator-bio">{creator.bio || "Creador independiente de landings y experiencias digitales."}</p><div className="creator-profile-actions">{creator.contact_email && <a className="button button-dark" href={`mailto:${creator.contact_email}`}>Contactar <i>↗</i></a>}{creator.website_url && <a className="creator-website" href={creator.website_url} target="_blank" rel="noreferrer">Visitar web ↗</a>}</div></div></section><section className="creator-profile-content shell"><div><span className="eyebrow">SU TRABAJO</span><h2>Landings para ideas<br /><em>con algo que decir.</em></h2><div className="creator-landings">{creator.landings.map((landing) => <Link href={`/landings/${landing.slug}`} className="creator-landing-card" key={landing.id}><div className="market-image" style={landing.cover_image_url ? { backgroundImage: `url(${landing.cover_image_url})` } : undefined}><span>{landing.title}</span></div><div><h3>{landing.title}</h3><p>{landing.tagline || landing.category}</p><span>Ver landing · {(landing.price_cents / 100).toFixed(0)} {landing.currency}</span></div></Link>)}</div></div><aside className="creator-contact-card"><span className="eyebrow">PARA PROYECTOS</span><h3>¿Tienes una idea<br />en la cabeza?</h3><p>Escríbele directamente para hablar de disponibilidad, personalización o un proyecto a medida.</p>{creator.contact_email && <a href={`mailto:${creator.contact_email}`}>{creator.contact_email}</a>}<small>El contacto depende de la información pública que el creador haya añadido a su perfil.</small></aside></section></main>;
}
