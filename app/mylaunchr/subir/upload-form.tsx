"use client";
/* eslint-disable @next/next/no-img-element */

import { useActionState, useEffect, useMemo, useState } from "react";
import { uploadLanding, type UploadState } from "@/app/mylaunchr/actions";

const initialState: UploadState = {};

function ImagePreviewGroup({ files, label, mobile = false }: { files: File[]; label: string; mobile?: boolean }) {
  const urls = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);
  useEffect(() => () => urls.forEach((url) => URL.revokeObjectURL(url)), [urls]);
  if (!urls.length) return null;
  return <div className={`upload-preview-group ${mobile ? "upload-preview-mobile" : ""}`}><span className="preview-label">Vista previa · {label}</span><div className="upload-previews">{urls.map((url, index) => <figure key={url}><img src={url} alt={`${label}, imagen ${index + 1}`} /><figcaption>{index + 1}</figcaption></figure>)}</div></div>;
}

export default function UploadForm() {
  const [state, action, pending] = useActionState(uploadLanding, initialState);
  const [title, setTitle] = useState("");
  const [coverFiles, setCoverFiles] = useState<File[]>([]);
  const [desktopFiles, setDesktopFiles] = useState<File[]>([]);
  const [mobileFiles, setMobileFiles] = useState<File[]>([]);
  const [desktopCount, setDesktopCount] = useState(0);
  const [mobileCount, setMobileCount] = useState(0);
  const generatedSlug = title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  return <form action={action} className="upload-form" encType="multipart/form-data">
    <section><span className="eyebrow">01 — INFORMACIÓN</span><h2>Cuéntanos sobre tu landing.</h2><p className="upload-help">Esta información aparecerá en el catálogo público y en tu perfil de creador.</p><div className="form-grid"><label className="form-full">Título<input name="title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ej. Nebula" required minLength={2} maxLength={100} /></label><label>Slug<input name="slug" placeholder={generatedSlug || "ej-nombre-de-landing"} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" /></label><label>Categoría<select name="category" defaultValue="saas"><option value="saas">SaaS & AI</option><option value="portfolio">Portfolio</option><option value="ecommerce">E-commerce</option><option value="agency">Agencia</option><option value="product">Product launch</option><option value="other">Otro</option></select></label><label className="form-full">Tagline<input name="tagline" placeholder="Una frase breve que defina la landing" maxLength={180} required /></label><label className="form-full">Descripción<textarea name="description" placeholder="Explica qué hace especial a tu landing, a quién va dirigida y qué incluye." maxLength={5000} rows={5} required /></label><label className="form-full">Tecnologías<input name="technologies" placeholder="Next.js, Tailwind, Supabase (separadas por comas)" required /></label></div></section>
    <section><span className="eyebrow">02 — PRECIO Y ENLACES</span><h2>Hazla fácil de descubrir.</h2><div className="form-grid"><label>Precio orientativo (€)<input name="price" type="number" inputMode="decimal" min="0" max="1000" step="0.01" placeholder="49" required /></label><label>Demo en vivo<input name="demo_url" type="url" placeholder="https://..." /></label><label className="form-full">Repositorio (opcional)<input name="repository_url" type="url" placeholder="https://github.com/..." /></label></div></section>
    <section><span className="eyebrow">03 — EXPERIENCIA VISUAL</span><h2>Enséñala en todos los tamaños.</h2><p className="upload-help">La primera imagen será la portada. Añade capturas para mostrar PC, móvil o ambas vistas en la página del proyecto.</p><div className="file-grid"><label className="file-input"><span>＋</span><b>Portada principal</b><small>JPG, PNG o WEBP · máximo 5 MB</small><input name="cover" type="file" accept="image/png,image/jpeg,image/webp" required onChange={(event) => setCoverFiles(event.target.files?.[0] ? [event.target.files[0]] : [])} /></label><label className="file-input"><span>▧</span><b>Capturas de escritorio</b><small>{desktopCount ? `${desktopCount} seleccionadas` : "Hasta 5 imágenes · máximo 5 MB"}</small><input name="screenshots_desktop" type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={(event) => { const files = Array.from(event.target.files ?? []); setDesktopFiles(files); setDesktopCount(files.length); }} /></label><label className="file-input"><span>▥</span><b>Capturas de móvil</b><small>{mobileCount ? `${mobileCount} seleccionadas` : "Hasta 5 imágenes · máximo 5 MB"}</small><input name="screenshots_mobile" type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={(event) => { const files = Array.from(event.target.files ?? []); setMobileFiles(files); setMobileCount(files.length); }} /></label></div><ImagePreviewGroup files={coverFiles} label="portada" /><ImagePreviewGroup files={desktopFiles} label="PC" /><ImagePreviewGroup files={mobileFiles} label="móvil" mobile /></section>
    <section><span className="eyebrow">04 — ARCHIVOS</span><h2>Prepara el archivo fuente.</h2><p className="upload-help">El archivo se guarda de forma privada y queda disponible para gestionar tu proyecto.</p><label className="file-input file-input-wide"><span>↑</span><b>Archivo fuente de la landing</b><small>ZIP · máximo 25 MB</small><input name="source" type="file" accept=".zip,application/zip,application/x-zip-compressed" required /></label></section>
    {state.error && <p className="form-error" role="alert">{state.error}</p>}{state.success && <p className="form-success" role="status">{state.success}</p>}<div className="upload-actions"><span>Se enviará a revisión antes de publicarse.</span><button className="button button-dark" type="submit" disabled={pending}>{pending ? "Subiendo..." : "Enviar a revisión"} <i>↗</i></button></div>
  </form>;
}