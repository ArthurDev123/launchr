import Link from "next/link";
import AuthForm from "./auth-form";

export default function LoginPage() {
  return <main className="auth-page"><Link href="/" className="brand auth-brand"><span>l</span>launchr</Link><div className="auth-layout"><section className="auth-aside"><span className="eyebrow"><i className="dot" /> PARA LOS QUE LANZAN</span><h2>Convierte tu<br /><em>trabajo</em> en impacto.</h2><p>myLaunchr es el espacio desde el que los creadores publican, gestionan y hacen crecer sus mejores landing pages.</p><div className="auth-quote">“Una buena landing no solo se ve bien. Hace que las ideas avancen.”<b>— El manifiesto Launchr</b></div></section><AuthForm /></div></main>;
}
