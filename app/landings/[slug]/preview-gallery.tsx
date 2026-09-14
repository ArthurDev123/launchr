"use client";

import { useEffect, useState } from "react";

type PreviewMode = "desktop" | "mobile" | "both";

type PreviewGalleryProps = { title: string; screenshots: { url: string; device: "desktop" | "mobile" }[]; coverImage: string | null };

export default function PreviewGallery({ title, screenshots, coverImage }: PreviewGalleryProps) {
  const [mode, setMode] = useState<PreviewMode>("both");
  const [selectedImage, setSelectedImage] = useState<{ url: string; alt: string; index: number; total: number } | null>(null);
  const desktopScreens = screenshots.filter((screenshot) => screenshot.device === "desktop").map((screenshot) => screenshot.url);
  const mobileScreens = screenshots.filter((screenshot) => screenshot.device === "mobile").map((screenshot) => screenshot.url);
  const desktopImages = desktopScreens.length ? desktopScreens : coverImage ? [coverImage] : [];
  const mobileImages = mobileScreens.length ? mobileScreens : coverImage ? [coverImage] : [];
  const showDesktop = mode === "desktop" || mode === "both";
  const showMobile = mode === "mobile" || mode === "both";
  useEffect(() => {
    if (!selectedImage) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setSelectedImage(null); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selectedImage]);
  const renderImages = (images: string[], device: "desktop" | "mobile") => images.map((image, index) => {
    const alt = `${title}, captura ${index + 1} en ${device === "desktop" ? "ordenador" : "móvil"}`;
    return <button type="button" className={`capture capture-${device}`} key={`${image}-${index}`} onClick={() => setSelectedImage({ url: image, alt, index, total: images.length })} aria-label={`Ampliar ${alt}`}><img src={image} alt={alt} />{/* eslint-disable-line @next/next/no-img-element */}<span className="capture-zoom" aria-hidden="true">↗</span><span className="capture-count">{index + 1} / {images.length}</span></button>;
  });

  return <div className="preview-gallery"><div className="preview-toolbar"><span className="preview-count">{screenshots.length || (coverImage ? 1 : 0)} capturas incluidas</span><div className="preview-toggle" aria-label="Cambiar vista de las capturas"><button type="button" className={mode === "desktop" ? "selected" : ""} onClick={() => setMode("desktop")}>PC</button><button type="button" className={mode === "mobile" ? "selected" : ""} onClick={() => setMode("mobile")}>Móvil</button><button type="button" className={mode === "both" ? "selected" : ""} onClick={() => setMode("both")}>Ambos</button></div></div>{desktopImages.length || mobileImages.length ? <div className={`preview-stage preview-${mode}`}>{showDesktop && <div className="preview-column preview-desktop-column"><span className="preview-column-label">Desktop</span>{renderImages(desktopImages, "desktop")}</div>}{showMobile && <div className="preview-column preview-mobile-column"><span className="preview-column-label">Móvil</span>{renderImages(mobileImages, "mobile")}</div>}</div> : <div className="market-empty"><strong>El creador todavía no ha añadido capturas.</strong><p>La preview estará disponible cuando se publiquen los assets de esta landing.</p></div>}{selectedImage && <div className="image-lightbox" role="dialog" aria-modal="true" aria-label={`Vista ampliada de ${selectedImage.alt}`} onClick={() => setSelectedImage(null)}><div className="lightbox-toolbar"><span>{selectedImage.index + 1} / {selectedImage.total}</span><button type="button" onClick={() => setSelectedImage(null)} aria-label="Cerrar imagen ampliada">×</button></div><img src={selectedImage.url} alt={selectedImage.alt} onClick={(event) => event.stopPropagation()} />{/* eslint-disable-line @next/next/no-img-element */}</div>}</div>;
}
