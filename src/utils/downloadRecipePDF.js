import jsPDF from "jspdf";

/**
 * Generates and downloads a recipe PDF
 * @param {Object} recipe - The recipe object from Supabase
 */
export const downloadRecipePDF = async (recipe) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  // ── COLORS ──────────────────────────────────────────
  const orange = [249, 115, 22];
  const darkGray = [31, 41, 55];
  const midGray = [107, 114, 128];
  const lightGray = [243, 244, 246];
  const white = [255, 255, 255];
  const divider = [229, 231, 235];

  // ── HELPERS ──────────────────────────────────────────
  const setFont = (style = "normal", size = 11, color = darkGray) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
  };

  const drawRect = (x, yPos, w, h, color, radius = 0) => {
    doc.setFillColor(...color);
    if (radius > 0) {
      doc.roundedRect(x, yPos, w, h, radius, radius, "F");
    } else {
      doc.rect(x, yPos, w, h, "F");
    }
  };

  const wrapText = (text, x, yStart, maxWidth, lineHeight = 6) => {
    const lines = doc.splitTextToSize(String(text || ""), maxWidth);
    lines.forEach((line) => {
      doc.text(line, x, yStart);
      yStart += lineHeight;
    });
    return yStart;
  };

  const checkNewPage = (neededHeight) => {
    if (y + neededHeight > pageHeight - 20) {
      doc.addPage();
      y = margin;
    }
  };

  // ── PARSE HELPERS ─────────────────────────────────────
  const parseList = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data.filter((i) => i && String(i).trim());
    if (typeof data === "string") {
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed.filter((i) => i && String(i).trim());
      } catch (e) {}
      return data.split(/\n|\\n/).map((i) => i.trim()).filter(Boolean).map((i) => i.replace(/^\d+\.\s*/, ""));
    }
    return [];
  };

  const formatTime = (minutes) => {
    if (!minutes) return "N/A";
    const n = parseInt(minutes);
    if (isNaN(n)) return "N/A";
    if (n < 60) return `${n} min`;
    const h = Math.floor(n / 60);
    const m = n % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const ingredients = parseList(recipe.ingredients);
  const instructions = parseList(recipe.instructions);

  // ════════════════════════════════════════════════════
  // HEADER BAR
  // ════════════════════════════════════════════════════
  drawRect(0, 0, pageWidth, 22, orange);
  setFont("bold", 16, white);
  doc.text("CookEase", margin, 14);
  setFont("normal", 9, [255, 220, 180]);
  doc.text("Your Recipe Collection", pageWidth - margin, 14, { align: "right" });

  y = 28;

  // ════════════════════════════════════════════════════
  // RECIPE IMAGE
  // ════════════════════════════════════════════════════
  if (recipe.image_url) {
    try {
      const imgData = await loadImageAsBase64(recipe.image_url);
      if (imgData) {
        const imgH = 65;
        drawRect(margin, y, contentWidth, imgH, lightGray, 4);
        doc.addImage(imgData, "JPEG", margin, y, contentWidth, imgH, "", "FAST");
        y += imgH + 4;
      }
    } catch (e) {
      // Skip image if it fails to load
      y += 4;
    }
  }

  // ════════════════════════════════════════════════════
  // TITLE + META
  // ════════════════════════════════════════════════════
  setFont("bold", 22, darkGray);
  const titleLines = doc.splitTextToSize(recipe.title || "Untitled Recipe", contentWidth);
  titleLines.forEach((line) => {
    doc.text(line, margin, y);
    y += 9;
  });

  y += 1;
  setFont("normal", 10, midGray);
  const meta = `${recipe.cuisine || ""}${recipe.cuisine && recipe.category ? " • " : ""}${recipe.category || ""}`;
  if (meta) { doc.text(meta, margin, y); y += 5; }

  setFont("normal", 9, midGray);
  doc.text(`By: ${recipe.owner_name || "Anonymous"}`, margin, y);
  y += 8;

  // Divider
  doc.setDrawColor(...divider);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // ════════════════════════════════════════════════════
  // INFO CARDS ROW (Prep | Cook | Servings | Difficulty)
  // ════════════════════════════════════════════════════
  const infoItems = [
    { label: "Prep Time", value: formatTime(recipe.prepTime || recipe.prep_time) },
    { label: "Cook Time", value: formatTime(recipe.cookTime || recipe.cook_time) },
    { label: "Servings", value: String(recipe.servings || "N/A") },
    { label: "Difficulty", value: recipe.difficulty || "N/A" },
  ];

  const cardW = contentWidth / 4 - 2;
  const cardH = 18;
  const cardY = y;

  infoItems.forEach((item, i) => {
    const cardX = margin + i * (cardW + 2.7);
    drawRect(cardX, cardY, cardW, cardH, lightGray, 3);

    setFont("bold", 10, orange);
    doc.text(item.value, cardX + cardW / 2, cardY + 7, { align: "center" });

    setFont("normal", 7, midGray);
    doc.text(item.label, cardX + cardW / 2, cardY + 13, { align: "center" });
  });

  y = cardY + cardH + 8;

  // Divider
  doc.setDrawColor(...divider);
  doc.line(margin, y, pageWidth - margin, y);
  y += 7;

  // ════════════════════════════════════════════════════
  // INGREDIENTS
  // ════════════════════════════════════════════════════
  checkNewPage(20);

  // Section label
  drawRect(margin, y, contentWidth, 9, orange, 2);
  setFont("bold", 11, white);
  doc.text("INGREDIENTS", margin + 4, y + 6.2);
  y += 13;

  if (ingredients.length === 0) {
    setFont("normal", 10, midGray);
    doc.text("No ingredients listed.", margin, y);
    y += 8;
  } else {
    ingredients.forEach((ing) => {
      checkNewPage(8);
      // Bullet dot
      doc.setFillColor(...orange);
      doc.circle(margin + 2, y - 1.5, 1.2, "F");

      setFont("normal", 10, darkGray);
      const newY = wrapText(ing, margin + 6, y, contentWidth - 8, 5.5);
      y = newY + 1;
    });
  }

  y += 4;

  // ════════════════════════════════════════════════════
  // INSTRUCTIONS
  // ════════════════════════════════════════════════════
  checkNewPage(20);

  drawRect(margin, y, contentWidth, 9, orange, 2);
  setFont("bold", 11, white);
  doc.text("INSTRUCTIONS", margin + 4, y + 6.2);
  y += 13;

  if (instructions.length === 0) {
    setFont("normal", 10, midGray);
    doc.text("No instructions provided.", margin, y);
    y += 8;
  } else {
    instructions.forEach((step, i) => {
      checkNewPage(16);

      // Step number circle
      doc.setFillColor(...orange);
      doc.circle(margin + 3.5, y - 1, 3.5, "F");
      setFont("bold", 9, white);
      doc.text(String(i + 1), margin + 3.5, y + 0.8, { align: "center" });

      setFont("normal", 10, darkGray);
      const newY = wrapText(step, margin + 10, y, contentWidth - 12, 5.5);
      y = Math.max(newY, y + 8) + 3;
    });
  }

  // ════════════════════════════════════════════════════
  // NOTES (if any)
  // ════════════════════════════════════════════════════
  if (recipe.notes) {
    y += 4;
    checkNewPage(20);

    drawRect(margin, y, contentWidth, 9, [245, 158, 11], 2);
    setFont("bold", 11, white);
    doc.text("NOTES", margin + 4, y + 6.2);
    y += 13;

    drawRect(margin, y, contentWidth, 2, [254, 243, 199], 0);
    setFont("normal", 10, [92, 68, 0]);
    const newY = wrapText(recipe.notes, margin + 4, y + 6, contentWidth - 8, 5.5);
    y = newY + 4;
  }

  // ════════════════════════════════════════════════════
  // FOOTER
  // ════════════════════════════════════════════════════
  const totalPages = doc.getNumberOfPages();
  for (let pg = 1; pg <= totalPages; pg++) {
    doc.setPage(pg);
    drawRect(0, pageHeight - 12, pageWidth, 12, orange);
    setFont("normal", 8, white);
    doc.text("Downloaded from CookEase", margin, pageHeight - 5);
    doc.text(`Page ${pg} of ${totalPages}`, pageWidth - margin, pageHeight - 5, { align: "right" });
  }

  // ── SAVE ─────────────────────────────────────────────
  const filename = `${(recipe.title || "recipe").toLowerCase().replace(/\s+/g, "-")}.pdf`;
  doc.save(filename);
};

/**
 * Loads an image URL as base64 via a canvas (handles CORS via proxy if needed)
 */
const loadImageAsBase64 = (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext("2d").drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      } catch (e) {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
};