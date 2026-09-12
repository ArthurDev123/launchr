"use client";

import { useActionState } from "react";
import { updateProfile, type SettingsState } from "@/app/mylaunchr/actions";

const initialState: SettingsState = {};

type SettingsFormProps = { fullName: string; username: string | null; bio: string | null; avatarUrl: string | null; contactEmail: string | null; websiteUrl: string | null; email: string };

export default function SettingsForm({ fullName, username, bio, avatarUrl, contactEmail, websiteUrl, email }: SettingsFormProps) {
  const [state, action, pending] = useActionState(updateProfile, initialState);
  return <form action={action} className="settings-form"><section><span className="eyebrow">PERFIL PÚBLICO</span><h2>Así te verán en Launchr.</h2><p>Estos datos acompañan a tus landings y ayudan a compradores a conocer a su creador.</p><div className="form-grid"><label className="form-full">Nombre completo<input name="full_name" defaultValue={fullName} required minLength={2} maxLength={80} /></label><label>Nombre de usuario<input name="username" defaultValue={username ?? ""} placeholder="tu-nombre" pattern="[a-z0-9-]{3,30}" /><small>Solo minúsculas, números y guiones.</small></label><label>URL del avatar<input name="avatar_url" defaultValue={avatarUrl ?? ""} type="url" placeholder="https://..." /></label><label>Email público<input name="contact_email" defaultValue={contactEmail ?? ""} type="email" placeholder="hola@tusitio.com" /></label><label>Web personal<input name="website_url" defaultValue={websiteUrl ?? ""} type="url" placeholder="https://tusitio.com" /></label><label className="form-full">Biografía<textarea name="bio" defaultValue={bio ?? ""} rows={4} maxLength={400} placeholder="Cuéntale a la comunidad en qué te especializas." /></label></div></section><section><span className="eyebrow">CUENTA</span><h2>Tu acceso.</h2><div className="form-grid"><label className="form-full">Email<input value={email} disabled aria-label="Email de la cuenta" /><small>El email se gestiona desde tu cuenta de acceso.</small></label></div></section>{state.error && <p className="form-error" role="alert">{state.error}</p>}{state.success && <p className="form-success" role="status">{state.success}</p>}<div className="settings-actions"><button className="button button-dark" type="submit" disabled={pending}>{pending ? "Guardando..." : "Guardar cambios"} <i>↗</i></button></div></form>;
}
