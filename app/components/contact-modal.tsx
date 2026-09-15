"use client";

import { FormEvent, useEffect, useState } from "react";

type ContactModalProps = { creatorName: string; destinationEmail: string; projectTitle?: string };

const inquiryTypes = ["Proyecto a medida", "Personalización", "Disponibilidad", "Otra consulta"];

export default function ContactModal({ creatorName, destinationEmail, projectTitle }: ContactModalProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const origin = String(formData.get("origin") ?? "").trim();
    const type = String(formData.get("type") ?? "").trim();
    const observations = String(formData.get("observations") ?? "").trim();
    const subject = projectTitle ? `${type}: ${projectTitle}` : type;
    const body = [`Email de origen: ${origin}`, `Email destino: ${destinationEmail}`, `Tipo de consulta: ${type}`, "", "Observaciones:", observations || "Sin observaciones adicionales.", projectTitle ? `\nProyecto: ${projectTitle}` : ""].join("\n");
    window.location.href = `mailto:${destinationEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setOpen(false);
  }

  return <>
    <button type="button" className="button button-dark" onClick={() => setOpen(true)}>Contactar <i>↗</i></button>
    {open && <div className="contact-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <section className="contact-modal" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title">
        <button type="button" className="contact-modal-close" aria-label="Cerrar formulario" onClick={() => setOpen(false)}>×</button>
        <span className="eyebrow"><i className="dot" /> CONTACTO</span>
        <h2 id="contact-modal-title">Habla con {creatorName}.</h2>
        <p>Completa el formulario y se abrirá tu aplicación de correo con la consulta preparada.</p>
        <form onSubmit={handleSubmit} className="contact-form">
          <label>Email de origen<input name="origin" type="email" placeholder="tu@email.com" required /></label>
          <label>Email destino<input name="destination" type="email" value={destinationEmail} readOnly /></label>
          <label>Tipo de consulta<select name="type" defaultValue={inquiryTypes[0]}>{inquiryTypes.map((type) => <option value={type} key={type}>{type}</option>)}</select></label>
          <label>Observaciones<textarea name="observations" rows={5} placeholder="Cuéntale algo más al creador..." /></label>
          <button type="submit" className="button button-dark">Preparar correo <i>↗</i></button>
        </form>
      </section>
    </div>}
  </>;
}
