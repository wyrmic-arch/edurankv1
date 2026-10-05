"use client";

/**
 * Photo → PDF ("scan a note").
 *
 * Everything happens in the browser: each photo is cropped, straightened and
 * optionally enhanced on a canvas, then composed onto a clean A4 page with a
 * small EduRank header/footer and stitched into one multi-page PDF with
 * pdf-lib. The result is uploaded like any other note, so it goes through the
 * normal moderation + storage pipeline.
 */
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export interface PhotoEdit {
  id: string;
  url: string; // object URL
  name: string;
  naturalW: number;
  naturalH: number;
  /** Normalised crop rectangle (0–1). null = full image. */
  crop: { x: number; y: number; w: number; h: number } | null;
  enhance: boolean;
  /** Small straightening angle in degrees (−12…12). */
  rotate: number;
}

const A4 = { w: 595.28, h: 841.89 };
const MAX_EDGE = 2000;
const MARGIN = 40;
const HEADER = 46;
const FOOTER = 30;

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read that image."));
    img.src = url;
  });
}

/** Make a PhotoEdit from a picked file (decodes it to get its dimensions). */
export async function makePhotoEdit(file: File): Promise<PhotoEdit> {
  const url = URL.createObjectURL(file);
  const img = await loadImage(url);
  return {
    id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
    url,
    name: file.name,
    naturalW: img.naturalWidth,
    naturalH: img.naturalHeight,
    crop: null,
    enhance: true,
    rotate: 0,
  };
}

/** Render one edited photo to a canvas (crop → scale → straighten → enhance). */
async function renderPhoto(photo: PhotoEdit): Promise<HTMLCanvasElement> {
  const img = await loadImage(photo.url);
  const c = photo.crop ?? { x: 0, y: 0, w: 1, h: 1 };
  const sx = Math.round(c.x * photo.naturalW);
  const sy = Math.round(c.y * photo.naturalH);
  const sw = Math.max(1, Math.round(c.w * photo.naturalW));
  const sh = Math.max(1, Math.round(c.h * photo.naturalH));

  const scale = Math.min(1, MAX_EDGE / Math.max(sw, sh));
  const dw = Math.max(1, Math.round(sw * scale));
  const dh = Math.max(1, Math.round(sh * scale));

  const rot = (photo.rotate * Math.PI) / 180;
  const cw = Math.round(Math.abs(dw * Math.cos(rot)) + Math.abs(dh * Math.sin(rot)));
  const ch = Math.round(Math.abs(dw * Math.sin(rot)) + Math.abs(dh * Math.cos(rot)));

  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, cw, ch);
  ctx.translate(cw / 2, ch / 2);
  ctx.rotate(rot);
  if (photo.enhance) ctx.filter = "grayscale(1) contrast(1.16) brightness(1.04)";
  ctx.drawImage(img, sx, sy, sw, sh, -dw / 2, -dh / 2, dw, dh);
  return canvas;
}

function canvasToJpeg(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      async (blob) => {
        if (!blob) return reject(new Error("Could not render the page."));
        resolve(new Uint8Array(await blob.arrayBuffer()));
      },
      "image/jpeg",
      0.85,
    );
  });
}

export async function buildPhotoPdf(
  photos: PhotoEdit[],
  meta: { title: string; subjectName: string; grade: string },
  onProgress?: (done: number, total: number) => void,
): Promise<File> {
  if (photos.length === 0) throw new Error("No photos to combine.");
  const pdf = await PDFDocument.create();
  pdf.setTitle(meta.title || "EduRank study notes");
  pdf.setProducer("EduRank");
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.08, 0.09, 0.11);
  const dim = rgb(0.45, 0.48, 0.52);
  const hair = rgb(0.84, 0.86, 0.89);

  for (let i = 0; i < photos.length; i++) {
    const page = pdf.addPage([A4.w, A4.h]);
    const canvas = await renderPhoto(photos[i]!);
    const jpg = await canvasToJpeg(canvas);
    const image = await pdf.embedJpg(jpg);

    // Header: title (left) + grade/subject (right), with a hairline rule.
    const title = (meta.title || "Study notes").slice(0, 58);
    page.drawText(title, { x: MARGIN, y: A4.h - MARGIN - 13, size: 13, font: bold, color: ink });
    const metaLine = [meta.grade ? `GRADE ${meta.grade}` : "", meta.subjectName ? meta.subjectName.toUpperCase() : ""]
      .filter(Boolean)
      .join("  ·  ")
      .slice(0, 52);
    if (metaLine) {
      page.drawText(metaLine, {
        x: A4.w - MARGIN - font.widthOfTextAtSize(metaLine, 8),
        y: A4.h - MARGIN - 12,
        size: 8,
        font,
        color: dim,
      });
    }
    page.drawLine({
      start: { x: MARGIN, y: A4.h - MARGIN - 24 },
      end: { x: A4.w - MARGIN, y: A4.h - MARGIN - 24 },
      thickness: 0.7,
      color: hair,
    });

    // Photo area between header and footer.
    const areaTop = A4.h - MARGIN - HEADER;
    const areaBottom = MARGIN + FOOTER;
    const areaW = A4.w - MARGIN * 2;
    const areaH = areaTop - areaBottom;
    const fit = Math.min(areaW / image.width, areaH / image.height);
    const dw = image.width * fit;
    const dh = image.height * fit;
    page.drawImage(image, {
      x: MARGIN + (areaW - dw) / 2,
      y: areaBottom + (areaH - dh) / 2,
      width: dw,
      height: dh,
    });

    // Footer.
    const foot = `EDURANK  ·  ${i + 1} / ${photos.length}`;
    page.drawText(foot, { x: MARGIN, y: MARGIN - 14, size: 8, font, color: dim });
    onProgress?.(i + 1, photos.length);
  }

  const bytes = await pdf.save();
  const slug = (meta.title || "study-notes").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "study-notes";
  const pdfBytes = new Uint8Array(bytes);
  return new File([pdfBytes.buffer], `${slug}.pdf`, { type: "application/pdf" });
}
