
/**
 * src/utils/printHelper.ts
 * Print and PDF export utilities for the resume builder.
 */

import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const A4_WIDTH_PX = 794;
const A4_MIN_HEIGHT_PX = 1123;

interface PdfTextLine {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontStyle: "normal" | "bold" | "italic" | "bolditalic";
}

function collectPdfTextLines(element: HTMLElement): PdfTextLine[] {
  const bounds = element.getBoundingClientRect();
  const zoom = bounds.width / element.offsetWidth || 1;
  const textLines: PdfTextLine[] = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);

  while (walker.nextNode()) {
    const textNode = walker.currentNode as Text;
    const parent = textNode.parentElement;
    const text = textNode.textContent ?? "";

    if (
      !parent ||
      !text.trim() ||
      parent.closest(
        "button, script, style, svg, .no-print, [data-no-print], [data-print-hide], [aria-hidden='true']"
      )
    ) {
      continue;
    }

    const style = window.getComputedStyle(parent);
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      Number(style.opacity) === 0
    ) {
      continue;
    }

    const fontSize = Number.parseFloat(style.fontSize);
    if (!Number.isFinite(fontSize) || fontSize <= 0) continue;

    const weight = Number.parseInt(style.fontWeight, 10);
    const fontStyle =
      style.fontStyle === "italic"
        ? weight >= 600
          ? "bolditalic"
          : "italic"
        : weight >= 600
          ? "bold"
          : "normal";
    const lines = new Map<number, { text: string; x: number; y: number }>();
    const range = document.createRange();
    let textOffset = 0;

    for (const character of text) {
      const start = textOffset;
      textOffset += character.length;
      range.setStart(textNode, start);
      range.setEnd(textNode, textOffset);

      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && /^\s$/.test(character)) continue;

      const lineY = Math.round(rect.top / zoom);
      const line = lines.get(lineY);
      if (line) {
        line.text += character;
      } else {
        lines.set(lineY, {
          text: character,
          x: (rect.left - bounds.left) / zoom,
          y: (rect.top - bounds.top) / zoom,
        });
      }
    }

    for (const line of lines.values()) {
      if (!line.text.trim()) continue;
      textLines.push({
        text: line.text,
        x: line.x,
        y: line.y,
        fontSize,
        fontStyle,
      });
    }

    range.detach();
  }

  return textLines;
}

export function printResumeDocument(
  elementIdOrName: string = "printable-resume"
): void {
  const resumeElement =
    document.getElementById(elementIdOrName) ??
    document.getElementById("printable-resume");

  if (!resumeElement) {
    console.error("Resume element not found:", elementIdOrName);
    window.alert("Resume preview nahi mila. Dobara try karein.");
    return;
  }

  const printWindow = window.open(
    "",
    "_blank",
    "width=1000,height=800"
  );

  if (!printWindow) {
    window.alert(
      "Print window block ho gayi hai. Browser mein pop-ups allow karein."
    );
    return;
  }

  const clonedResume = resumeElement.cloneNode(true) as HTMLElement;
  clonedResume.id = "printable-resume";

  clonedResume
    .querySelectorAll(
      'button, .no-print, [data-no-print], [data-print-hide]'
    )
    .forEach((element) => element.remove());

  const styles = Array.from(
    document.querySelectorAll('link[rel="stylesheet"], style')
  )
    .map((element) => element.outerHTML)
    .join("\n");

  printWindow.document.open();
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Resume</title>
        ${styles}
        <style>
          @page {
            size: A4;
            margin: 12mm;
          }

          html, body {
            margin: 0;
            padding: 0;
            background: white !important;
            color: #111827;
            font-family: Arial, Helvetica, sans-serif;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          #printable-resume {
            display: block !important;
            visibility: visible !important;
            position: static !important;
            width: 100% !important;
            max-width: none !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
            transform: none !important;
            background: white !important;
            box-sizing: border-box !important;
          }

          #printable-resume,
          #printable-resume * {
            visibility: visible !important;
            box-sizing: border-box;
          }

          #printable-resume img {
            max-width: 100%;
            height: auto;
          }

          #printable-resume h1,
          #printable-resume h2,
          #printable-resume h3 {
            break-after: avoid-page;
          }

          .no-print,
          [data-no-print],
          [data-print-hide] {
            display: none !important;
          }
            /* Keep the personal information header visible when printing */
#printable-resume header {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  position: relative !important;
  height: auto !important;
  max-height: none !important;
  overflow: visible !important;
  color: #111827 !important;
}

/* Restore visibility of the name, title and contact information */
#printable-resume header h1,
#printable-resume header h2,
#printable-resume header h3,
#printable-resume header p,
#printable-resume header span,
#printable-resume header div {
  visibility: visible !important;
  opacity: 1 !important;
  color: inherit;
}
        </style>
      </head>
      <body>
        <div id="print-container"></div>
      </body>
    </html>
  `);
  printWindow.document.close();

  const container =
    printWindow.document.getElementById("print-container");

  if (!container) {
    printWindow.close();
    return;
  }

  container.appendChild(clonedResume);

  const waitForImages = async (): Promise<void> => {
    const images = Array.from(
      printWindow.document.querySelectorAll("img")
    );

    await Promise.all(
      images.map(async (img) => {
        if (img.complete) return;

        await new Promise<void>((resolve) => {
          img.addEventListener("load", () => resolve(), {
            once: true,
          });
          img.addEventListener("error", () => resolve(), {
            once: true,
          });
        });
      })
    );
  };

  void (async () => {
    try {
      await waitForImages();

      if (printWindow.document.fonts?.ready) {
        await printWindow.document.fonts.ready;
      }

      printWindow.focus();
      printWindow.print();
    } catch (error) {
      console.error("Resume printing failed:", error);
      printWindow.focus();
      printWindow.print();
    }
  })();
}

/**
 * Exports the printable sheet directly to an A4 PDF without opening the print dialog.
 */
export async function exportElementToPdf(
  elementId: string,
  filename: string = "Resume"
): Promise<void> {
  const printableElement = document.getElementById(elementId);

  if (!printableElement) {
    console.error("PDF export element not found:", elementId);
    throw new Error(`PDF export element not found: ${elementId}`);
  }

  await document.fonts?.ready;

  const textLines = collectPdfTextLines(printableElement);
  const pageBreakPositions: number[] = [];
  const canvas = await html2canvas(printableElement, {
    backgroundColor: "#ffffff",
    scale: 2,
    useCORS: true,
    logging: false,
    onclone: (clonedDocument) => {
      const clonedElement = clonedDocument.getElementById(elementId);
      if (!clonedElement) {
        throw new Error(`PDF export clone not found: ${elementId}`);
      }

      clonedElement.style.setProperty("width", `${A4_WIDTH_PX}px`, "important");
      clonedElement.style.setProperty("max-width", "none", "important");
      clonedElement.style.setProperty("height", "auto", "important");
      clonedElement.style.setProperty("min-height", `${A4_MIN_HEIGHT_PX}px`, "important");
      clonedElement.style.setProperty("overflow", "visible", "important");
      clonedElement.style.setProperty("transform", "none", "important");
      clonedElement.style.setProperty("transition", "none", "important");
      clonedElement.style.setProperty("box-shadow", "none", "important");
      clonedElement.style.setProperty("border-radius", "0", "important");
      clonedElement.style.setProperty("margin", "0", "important");

      clonedElement
        .querySelectorAll("button, .no-print, [data-no-print], [data-print-hide]")
        .forEach((element) => element.remove());

      clonedElement
        .querySelectorAll(
          "p, li, h1, h2, h3, h4, section, article, .resume-section, .experience-item, .education-item, .project-item"
        )
        .forEach((element) => {
          const elementBottom =
            element.getBoundingClientRect().bottom -
            clonedElement.getBoundingClientRect().top;
          if (elementBottom > 0) pageBreakPositions.push(elementBottom);
        });
    },
  });

  if (canvas.width === 0 || canvas.height === 0) {
    throw new Error("PDF export produced an empty image.");
  }

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });
  const pageHeightPx = Math.floor(
    (canvas.width * A4_HEIGHT_MM) / A4_WIDTH_MM
  );
  const scaleFactor = canvas.width / A4_WIDTH_PX;
  let pageTop = 0;
  let pageIndex = 0;

  while (pageTop < canvas.height) {
    const remainingHeight = canvas.height - pageTop;
    const idealPageBottom =
      remainingHeight <= pageHeightPx + 4
        ? canvas.height
        : pageTop + pageHeightPx;
    let pageBottom = idealPageBottom;

    if (idealPageBottom < canvas.height) {
      const earliestAllowedBreak =
        pageTop + Math.floor(pageHeightPx * 0.9);
      const safeBreak = pageBreakPositions
        .map((position) => Math.round(position * scaleFactor))
        .filter(
          (position) =>
            position >= earliestAllowedBreak && position <= idealPageBottom
        )
        .sort((a, b) => b - a)[0];

      if (safeBreak) pageBottom = safeBreak;
    }

    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = canvas.width;
    pageCanvas.height = pageBottom - pageTop;
    const context = pageCanvas.getContext("2d");
    if (!context) throw new Error("Unable to create a PDF page image.");

    context.drawImage(
      canvas,
      0,
      pageTop,
      canvas.width,
      pageCanvas.height,
      0,
      0,
      pageCanvas.width,
      pageCanvas.height
    );

    if (pageIndex > 0) pdf.addPage("a4", "portrait");
    const pageHeightMm = Math.min(
      A4_HEIGHT_MM,
      (pageCanvas.height / pageCanvas.width) * A4_WIDTH_MM
    );
    pdf.addImage(
      pageCanvas.toDataURL("image/jpeg", 0.96),
      "JPEG",
      0,
      0,
      A4_WIDTH_MM,
      pageHeightMm,
      undefined,
      "FAST"
    );

    for (const line of textLines) {
      const lineTop = line.y * scaleFactor;
      if (lineTop < pageTop || lineTop >= pageBottom) continue;

      pdf.setFont("helvetica", line.fontStyle);
      pdf.setFontSize(line.fontSize * 0.75);
      pdf.text(
        line.text,
        (line.x / A4_WIDTH_PX) * A4_WIDTH_MM,
        ((lineTop - pageTop) / canvas.width) * A4_WIDTH_MM,
        { baseline: "top", renderingMode: "invisible" }
      );
    }

    pageTop = pageBottom;
    pageIndex += 1;
  }

  const safeFilename =
    filename.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").trim() || "Resume";
  pdf.save(safeFilename.toLowerCase().endsWith(".pdf") ? safeFilename : `${safeFilename}.pdf`);
}
