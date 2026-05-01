const IMAGE_BASE_URL = "https://storage.enamorimpex.com/eloraftp";

function getFullImageUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${IMAGE_BASE_URL}/${path}`;
}

// Convert SVG blob to PNG data URL via canvas (jsPDF does not support SVG)
function svgBlobToPng(blob: Blob): Promise<string | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || 500;
      canvas.height = img.naturalHeight || 120;
      const ctx = canvas.getContext("2d");
      if (!ctx) { URL.revokeObjectURL(url); resolve(null); return; }
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

// Proxy through Next.js API to avoid CORS
async function loadImageAsBase64(imageUrl: string): Promise<string | null> {
  if (!imageUrl) return null;
  try {
    const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`;
    const res = await fetch(proxyUrl);
    if (!res.ok) return null;
    const blob = await res.blob();
    if (blob.type.includes("svg")) return svgBlobToPng(blob);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function formatDate(date?: string) {
  if (!date) return new Date().toLocaleDateString("en-IN");
  return new Date(date).toLocaleDateString("en-IN");
}

function drawNoImage(doc: any, x: number, y: number, w: number, h: number) {
  doc.setFillColor(230, 230, 230);
  doc.rect(x, y, w, h, "F");
  doc.setDrawColor(200, 200, 200);
  doc.rect(x, y, w, h, "S");
  doc.setFontSize(7);
  doc.setTextColor(160, 160, 160);
  doc.text("No Image", x + w / 2, y + h / 2, { align: "center" });
}

export async function generateReccePDF(stores: any[]): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const H = 297;
  const margin = 12;

  const logoB64 = await loadImageAsBase64(`${window.location.origin}/logo.svg`);

  for (let si = 0; si < stores.length; si++) {
    const store = stores[si];

    // ===================== PAGE 1: COVER =====================
    if (si > 0) doc.addPage();

    doc.setFillColor(255, 253, 240);
    doc.rect(0, 0, W, H, "F");
    doc.setFillColor(246, 178, 28);
    doc.rect(0, 0, W, 8, "F");
    doc.setFillColor(246, 178, 28);
    doc.rect(0, H - 8, W, 8, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(246, 178, 28);
    doc.text("WE DON'T JUST PRINT.", W / 2, 90, { align: "center" });
    doc.text("WE INSTALL YOUR BRAND", W / 2, 108, { align: "center" });
    doc.text("INTO THE REAL WORLD.", W / 2, 126, { align: "center" });

    if (logoB64) {
      doc.addImage(logoB64, "PNG", W / 2 - 45, 140, 90, 22);
    } else {
      doc.setFontSize(20);
      doc.text("ea | ELORA CREATIVE ART", W / 2, 158, { align: "center" });
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text("We help businesses stand out with custom branding,", W / 2, 175, { align: "center" });
    doc.text("high-quality banner printing, and professional on-site installation.", W / 2, 181, { align: "center" });

    // ===================== PAGE 2: REPORT =====================
    doc.addPage();

    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, W, H, "F");

    // Gold header bar
    doc.setFillColor(246, 178, 28);
    doc.rect(0, 0, W, 16, "F");

    if (logoB64) {
      doc.addImage(logoB64, "PNG", margin, 1, 28, 14);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text("Recce Inspection Report", W / 2, 10, { align: "center" });

    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("ELORA CREATIVE ART", W - margin, 7, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.text("www.eloracreativeart.in", W - margin, 12, { align: "right" });

    // Gold bottom bar
    doc.setFillColor(246, 178, 28);
    doc.rect(0, H - 8, W, 8, "F");

    let y = 22;

    // Store info table (left)
    const infoTableW = 95;
    const infoTableH = 40;
    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(250, 250, 250);
    doc.rect(margin, y, infoTableW, infoTableH, "FD");

    const col1 = margin + 3;
    const col2 = margin + 22;
    const col3 = margin + 52;
    const col4 = margin + 65;

    const infoRows = [
      ["Store:", store.storeName || "-", "City:", store.location?.city || "-"],
      ["ID:", store.dealerCode || store.storeId || "-", "State:", store.location?.state || "-"],
      ["Date:", formatDate(store.recce?.submittedDate), "By:", (store.workflow?.recceAssignedTo as any)?.name || "-"],
      ["Address:", store.location?.address || "-", "", ""],
    ];

    let iy = y + 7;
    for (const row of infoRows) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      doc.text(row[0], col1, iy);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 30, 30);
      const val1 = doc.splitTextToSize(row[1], 28)[0] || row[1];
      doc.text(val1, col2, iy);
      if (row[2]) {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(80, 80, 80);
        doc.text(row[2], col3, iy);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(30, 30, 30);
        doc.text(row[3], col4, iy);
      }
      iy += 8;
    }

    // Initial photos (right side)
    const photosX = margin + infoTableW + 4;
    const photosW = W - photosX - margin;
    const initialPhotos: string[] = store.recce?.initialPhotos || [];

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text("Initial Photos:", photosX, y + 6);

    const maxInitial = Math.min(initialPhotos.length, 4);
    const thumbSize = maxInitial > 0 ? Math.min((photosW - (maxInitial - 1) * 2) / maxInitial, 22) : 22;
    const thumbH = 28;
    const thumbY = y + 9;

    if (maxInitial === 0) {
      for (let i = 0; i < 4; i++) {
        drawNoImage(doc, photosX + i * (22 + 2), thumbY, 22, thumbH);
      }
    } else {
      for (let i = 0; i < maxInitial; i++) {
        const b64 = await loadImageAsBase64(getFullImageUrl(initialPhotos[i]));
        const px = photosX + i * (thumbSize + 2);
        if (b64) {
          doc.addImage(b64, "JPEG", px, thumbY, thumbSize, thumbH, undefined, "FAST");
        } else {
          drawNoImage(doc, px, thumbY, thumbSize, thumbH);
        }
      }
    }

    y += infoTableH + 6;

    // Gold divider
    doc.setDrawColor(246, 178, 28);
    doc.setLineWidth(0.8);
    doc.line(margin, y, W - margin, y);
    doc.setLineWidth(0.2);
    y += 5;

    // Recce photos
    const reccePhotos: any[] = store.recce?.reccePhotos || [];

    if (reccePhotos.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text("No recce photos submitted.", W / 2, y + 10, { align: "center" });
    }

    for (let i = 0; i < reccePhotos.length; i++) {
      const rp = reccePhotos[i];
      const photoPath = typeof rp.photo === "string" ? rp.photo : rp.photo?.relativePath || "";
      const elementName = rp.elements?.[0]?.elementName || "-";
      const status = rp.approvalStatus || "PENDING";

      const photoH = 52;
      const photoW = 65;

      if (y + photoH + 14 > H - 14) {
        doc.addPage();
        doc.setFillColor(246, 178, 28);
        doc.rect(0, 0, W, 16, "F");
        if (logoB64) doc.addImage(logoB64, "PNG", margin, 1, 28, 14);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(255, 255, 255);
        doc.text("Recce Inspection Report", W / 2, 10, { align: "center" });
        doc.setFontSize(7);
        doc.text("ELORA CREATIVE ART", W - margin, 7, { align: "right" });
        doc.setFont("helvetica", "normal");
        doc.text("www.eloracreativeart.in", W - margin, 12, { align: "right" });
        doc.setFillColor(246, 178, 28);
        doc.rect(0, H - 8, W, 8, "F");
        y = 22;
      }

      // Label
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);
      doc.text(`Photo ${i + 1} - ${elementName}`, margin, y);

      if (status === "APPROVED") doc.setTextColor(34, 197, 94);
      else if (status === "REJECTED") doc.setTextColor(239, 68, 68);
      else doc.setTextColor(234, 179, 8);
      doc.text(status, W - margin, y, { align: "right" });
      y += 5;

      // Image
      const b64 = await loadImageAsBase64(getFullImageUrl(photoPath));
      if (b64) {
        doc.addImage(b64, "JPEG", margin, y, photoW, photoH, undefined, "FAST");
      } else {
        drawNoImage(doc, margin, y, photoW, photoH);
      }

      // Measurements
      const mx = margin + photoW + 6;
      const w = rp.measurements?.width || "-";
      const h = rp.measurements?.height || "-";
      const unit = rp.measurements?.unit || "in";
      const wFt = unit === "in" && w !== "-" ? (parseFloat(w) / 12).toFixed(2) : w;
      const hFt = unit === "in" && h !== "-" ? (parseFloat(h) / 12).toFixed(2) : h;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(40, 40, 40);
      doc.text(`Width:   ${w} ${unit}  (${wFt} ft)`, mx, y + 10);
      doc.text(`Height:  ${h} ${unit}  (${hFt} ft)`, mx, y + 19);
      doc.text(`Element: ${elementName}`, mx, y + 28);

      if (rp.rejectionReason) {
        doc.setTextColor(239, 68, 68);
        doc.setFontSize(8);
        const lines = doc.splitTextToSize(`Reason: ${rp.rejectionReason}`, W - mx - margin);
        doc.text(lines, mx, y + 37);
      }

      y += photoH + 8;
    }

    // Notes
    if (store.recce?.notes) {
      if (y + 16 > H - 14) { doc.addPage(); y = 22; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(80, 80, 80);
      doc.text("Remarks:", margin, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(40, 40, 40);
      const lines = doc.splitTextToSize(store.recce.notes, W - margin * 2 - 22);
      doc.text(lines, margin + 22, y);
    }
  }

  doc.save(`Recce_Report_${stores.length}_Stores_${new Date().toISOString().split("T")[0]}.pdf`);
}

export async function generateReccePPT(stores: any[]): Promise<void> {
  const pptxgen = (await import("pptxgenjs")).default;
  const prs = new pptxgen();
  prs.layout = "LAYOUT_WIDE";

  const logoB64 = await loadImageAsBase64(`${window.location.origin}/logo.svg`);

  for (const store of stores) {
    // ===================== SLIDE 1: COVER =====================
    const cover = prs.addSlide();
    cover.background = { color: "FFFDF0" };

    cover.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 0.18, fill: { color: "F6B21C" }, line: { color: "F6B21C" } });
    cover.addShape(prs.ShapeType.rect, { x: 0, y: 5.45, w: "100%", h: 0.18, fill: { color: "F6B21C" }, line: { color: "F6B21C" } });

    cover.addText("WE DON'T JUST PRINT.\nWE INSTALL YOUR BRAND\nINTO THE REAL WORLD.", {
      x: 1, y: 1.2, w: 8, h: 1.8,
      fontSize: 28, bold: true, color: "F6B21C", align: "center",
    });

    if (logoB64) {
      cover.addImage({ data: logoB64, x: 3.2, y: 3.1, w: 3.6, h: 0.9 });
    } else {
      cover.addText("ea | ELORA CREATIVE ART", {
        x: 1, y: 3.1, w: 8, h: 0.9, fontSize: 22, bold: true, color: "F6B21C", align: "center",
      });
    }

    cover.addText(
      "We help businesses stand out with custom branding,\nhigh-quality banner printing, and professional on-site installation.",
      { x: 1, y: 4.1, w: 8, h: 0.8, fontSize: 10, color: "888888", align: "center" }
    );

    // ===================== SLIDE 2: REPORT INFO =====================
    const info = prs.addSlide();
    info.background = { color: "FFFFFF" };

    info.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 0.65, fill: { color: "F6B21C" }, line: { color: "F6B21C" } });
    if (logoB64) info.addImage({ data: logoB64, x: 0.15, y: 0.05, w: 1.4, h: 0.55 });

    info.addText("Recce Inspection Report", {
      x: 1.7, y: 0, w: 6, h: 0.65,
      fontSize: 16, bold: true, color: "FFFFFF", align: "center", valign: "middle",
    });
    info.addText("ELORA CREATIVE ART\nwww.eloracreativeart.in", {
      x: 7.8, y: 0, w: 2.05, h: 0.65,
      fontSize: 7, bold: true, color: "FFFFFF", align: "right", valign: "middle",
    });
    info.addShape(prs.ShapeType.rect, { x: 0, y: 5.45, w: "100%", h: 0.18, fill: { color: "F6B21C" }, line: { color: "F6B21C" } });

    const infoData = [
      [{ text: "Store:", options: { bold: true, color: "888888" } }, { text: store.storeName || "-" },
       { text: "City:", options: { bold: true, color: "888888" } }, { text: store.location?.city || "-" }],
      [{ text: "ID:", options: { bold: true, color: "888888" } }, { text: store.dealerCode || store.storeId || "-" },
       { text: "State:", options: { bold: true, color: "888888" } }, { text: store.location?.state || "-" }],
      [{ text: "Date:", options: { bold: true, color: "888888" } }, { text: formatDate(store.recce?.submittedDate) },
       { text: "By:", options: { bold: true, color: "888888" } }, { text: (store.workflow?.recceAssignedTo as any)?.name || "-" }],
      [{ text: "Address:", options: { bold: true, color: "888888" } }, { text: store.location?.address || "-" },
       { text: "" }, { text: "" }],
    ];
    info.addTable(infoData as any, {
      x: 0.15, y: 0.75, w: 5.5, h: 1.5,
      fontSize: 9, border: { pt: 0.5, color: "DDDDDD" }, fill: { color: "FAFAFA" },
    });

    info.addText("Initial Photos:", {
      x: 5.8, y: 0.75, w: 4, h: 0.3, fontSize: 9, bold: true, color: "555555",
    });

    const initialPhotos: string[] = store.recce?.initialPhotos || [];
    const maxInitial = Math.min(initialPhotos.length, 4);
    const thumbW = maxInitial > 0 ? (4.0 - (maxInitial - 1) * 0.08) / maxInitial : 0.9;
    const thumbH = 1.1;

    if (maxInitial === 0) {
      for (let i = 0; i < 4; i++) {
        info.addShape(prs.ShapeType.rect, { x: 5.8 + i * 1.02, y: 1.1, w: 0.9, h: thumbH, fill: { color: "E0E0E0" }, line: { color: "CCCCCC" } });
        info.addText("No Image", { x: 5.8 + i * 1.02, y: 1.1, w: 0.9, h: thumbH, fontSize: 7, color: "AAAAAA", align: "center", valign: "middle" });
      }
    } else {
      for (let i = 0; i < maxInitial; i++) {
        const b64 = await loadImageAsBase64(getFullImageUrl(initialPhotos[i]));
        const px = 5.8 + i * (thumbW + 0.08);
        if (b64) {
          info.addImage({ data: b64, x: px, y: 1.1, w: thumbW, h: thumbH });
        } else {
          info.addShape(prs.ShapeType.rect, { x: px, y: 1.1, w: thumbW, h: thumbH, fill: { color: "E0E0E0" }, line: { color: "CCCCCC" } });
          info.addText("No Image", { x: px, y: 1.1, w: thumbW, h: thumbH, fontSize: 7, color: "AAAAAA", align: "center", valign: "middle" });
        }
      }
    }

    info.addShape(prs.ShapeType.rect, { x: 0.15, y: 2.35, w: 9.7, h: 0.04, fill: { color: "F6B21C" }, line: { color: "F6B21C" } });

    if (store.recce?.notes) {
      info.addText(`Remarks: ${store.recce.notes}`, {
        x: 0.15, y: 2.45, w: 9.7, h: 0.4, fontSize: 8, color: "555555", italic: true,
      });
    }

    // ===================== RECCE PHOTO SLIDES (2 per slide) =====================
    const reccePhotos: any[] = store.recce?.reccePhotos || [];

    for (let i = 0; i < reccePhotos.length; i += 2) {
      const slide = prs.addSlide();
      slide.background = { color: "FFFFFF" };

      slide.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 0.5, fill: { color: "F6B21C" }, line: { color: "F6B21C" } });
      if (logoB64) slide.addImage({ data: logoB64, x: 0.1, y: 0.02, w: 1.2, h: 0.46 });
      slide.addText(`${store.storeName} — Recce Photos`, {
        x: 1.4, y: 0, w: 7, h: 0.5,
        fontSize: 13, bold: true, color: "FFFFFF", align: "center", valign: "middle",
      });
      slide.addShape(prs.ShapeType.rect, { x: 0, y: 5.45, w: "100%", h: 0.18, fill: { color: "F6B21C" }, line: { color: "F6B21C" } });

      const photosOnSlide = reccePhotos.slice(i, i + 2);
      for (let j = 0; j < photosOnSlide.length; j++) {
        const rp = photosOnSlide[j];
        const photoPath = typeof rp.photo === "string" ? rp.photo : rp.photo?.relativePath || "";
        const b64 = await loadImageAsBase64(getFullImageUrl(photoPath));
        const xBase = j === 0 ? 0.15 : 5.1;
        const elementName = rp.elements?.[0]?.elementName || "-";
        const status = rp.approvalStatus || "PENDING";
        const statusColor = status === "APPROVED" ? "22C55E" : status === "REJECTED" ? "EF4444" : "EAB308";

        slide.addText(`Photo ${i + j + 1}: ${elementName}`, {
          x: xBase, y: 0.55, w: 3.5, h: 0.3, fontSize: 9, bold: true, color: "333333",
        });
        slide.addText(status, {
          x: xBase + 3.2, y: 0.55, w: 1.6, h: 0.3, fontSize: 9, bold: true, color: statusColor, align: "right",
        });

        if (b64) {
          slide.addImage({ data: b64, x: xBase, y: 0.9, w: 4.7, h: 3.5 });
        } else {
          slide.addShape(prs.ShapeType.rect, { x: xBase, y: 0.9, w: 4.7, h: 3.5, fill: { color: "E0E0E0" }, line: { color: "CCCCCC" } });
          slide.addText("No Image", { x: xBase, y: 0.9, w: 4.7, h: 3.5, align: "center", valign: "middle", fontSize: 12, color: "999999" });
        }

        const w = rp.measurements?.width || "-";
        const h = rp.measurements?.height || "-";
        const unit = rp.measurements?.unit || "in";
        const wFt = unit === "in" && w !== "-" ? (parseFloat(w) / 12).toFixed(2) : w;
        const hFt = unit === "in" && h !== "-" ? (parseFloat(h) / 12).toFixed(2) : h;

        slide.addText(
          `Width: ${w} ${unit} (${wFt} ft)   Height: ${h} ${unit} (${hFt} ft)   Element: ${elementName}`,
          { x: xBase, y: 4.45, w: 4.7, h: 0.3, fontSize: 8, color: "444444" }
        );
        if (rp.rejectionReason) {
          slide.addText(`Rejection: ${rp.rejectionReason}`, {
            x: xBase, y: 4.78, w: 4.7, h: 0.3, fontSize: 7.5, color: "EF4444", italic: true,
          });
        }
      }
    }
  }

  prs.writeFile({ fileName: `Recce_Report_${stores.length}_Stores_${new Date().toISOString().split("T")[0]}.pptx` });
}
