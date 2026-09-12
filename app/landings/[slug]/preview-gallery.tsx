"use client";

import { useState } from "react";

type PreviewMode = "desktop" | "mobile" | "both";

type PreviewGalleryProps = { title: string; screenshots: { url: string; device: "desktop" | "mobile" }[]; coverImage: string | null };

export default function PreviewGallery({ title, screenshots, coverImage }: PreviewGalleryProps) {
  const [mode, setMode] = useState<PreviewMode>("both");
  const desktopScreens = screenshots.filter((screenshot) => screenshot.device === "desktop").map((screenshot) => screenshot.url);
  const mobileScreens = screenshots.filter((screenshot) => screenshot.device === "mobile").map((screenshot) => screenshot.url);
  const desktopImages = desktopScreens.length ? desktopScreens : coverImage ? [coverImage] : [];
  const mobileImages = mobileScreens.length ? mobileScreens : coverImage ? [coverImage] : [];
  const showDesktop = mode === "desktop" || mode === "both";
  const showMobile = mode === "mobile" || mode === "both";
  const renderImages = (images: string[], device: "desktop" | "mobile") => images.map((image, index) => <figure className={`capture capture-${device}`} key={`${image}-${index}`}><img src={image} alt={`${title}, captura ${index + 1} en ${device === "desktop" ? "ordenador" : "móvil"}`} />{/* eslint-disable-line @next/next/no-img-element */}<figcaption>{index + 1} / {images.length}</figcaption></figure>);

  return <div className="preview-gallery"><div className="preview-toolbar"><span className="preview-count">{screenshots.length || (coverImage ? 1 : 0)} capturas incluidas</span><div className="preview-toggle" aria-label="Cambiar vista de las capturas"><button type="button" className={mode === "desktop" ? "selected" : ""} onClick={() => setMode("desktop")}>PC</button><button type="button" className={mode === "mobile" ? "selected" : ""} onClick={() => setMode("mobile")}>Móvil</button><button type="button" className={mode === "both" ? "selected" : ""} onClick={() => setMode("both")}>Ambos</button></div></div>{desktopImages.length || mobileImages.length ? <div className={`preview-stage preview-${mode}`}>{showDesktop && <div className="preview-column preview-desktop-column"><span className="preview-column-label">Desktop</span>{renderImages(desktopImages, "desktop")}</div>}{showMobile && <div className="preview-column preview-mobile-column"><span className="preview-column-label">Móvil</span>{renderImages(mobileImages, "mobile")}</div>}</div> : <div className="market-empty"><strong>El creador todavía no ha añadido capturas.</strong><p>La preview estará disponible cuando se publiquen los assets de esta landing.</p></div>}</div>;
}
