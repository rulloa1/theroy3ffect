import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { ROY_EFFECT_LOGO_PNG_BASE64 } from "@/lib/brand-logo";
import { LEGAL_IDENTITY } from "@/lib/legal-identity";

export interface ProposalPdfData {
  clientName: string;
  clientEmail: string;
  clientCompany?: string | null;
  projectTitle: string;
  scopeDeliverables: string;
  timelineWeeks: string;
  totalPriceCents: number;
  depositCents: number;
  balanceCents: number;
  terms: string;
  clientSignatureName?: string | null;
  clientSignedAt?: string | null;
  shareToken: string;
}

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 56;
const HEADER_H = 118;
const CONT_HEADER_H = 54;
const FOOTER_H = 44;

const NIGHT = rgb(0.043, 0.051, 0.078);
const GOLD = rgb(0.792, 0.635, 0.318);
const CRIMSON = rgb(1, 0.2, 0.2);
const INK = rgb(0.09, 0.09, 0.11);
const MUTED = rgb(0.42, 0.42, 0.46);
const EMERALD = rgb(0.06, 0.65, 0.42);
const HAIRLINE = rgb(0.85, 0.85, 0.87);

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split(/\r?\n/)) {
    if (!paragraph.trim()) {
      lines.push("");
      continue;
    }
    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        line = candidate;
      } else {
        if (line) lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

const money = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}

export async function buildSignedProposalPdf(data: ProposalPdfData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(
    `${data.clientSignedAt ? "Signed Proposal" : "Proposal"} — ${data.projectTitle} — ${data.clientName}`,
  );
  pdf.setAuthor("The Roy Effect");
  pdf.setProducer("The Roy Effect");
  pdf.setSubject(`Project scope agreement for ${data.clientName}`);

  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const logo = await pdf.embedPng(base64ToBytes(ROY_EFFECT_LOGO_PNG_BASE64));
  const maxWidth = PAGE_W - MARGIN * 2;

  const generatedOn = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const drawFooter = (target: PDFPage) => {
    target.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: FOOTER_H, color: NIGHT });
    target.drawRectangle({ x: 0, y: FOOTER_H - 2, width: PAGE_W, height: 2, color: GOLD });
    target.drawText(`${LEGAL_IDENTITY.dba}  ·  ${LEGAL_IDENTITY.city}`, {
      x: MARGIN,
      y: FOOTER_H / 2 - 3,
      size: 8,
      font: bold,
      color: rgb(1, 1, 1),
    });
    const right = `${LEGAL_IDENTITY.email}  ·  ${LEGAL_IDENTITY.phone}  ·  ${LEGAL_IDENTITY.site}`;
    target.drawText(right, {
      x: PAGE_W - MARGIN - regular.widthOfTextAtSize(right, 8),
      y: FOOTER_H / 2 - 3,
      size: 8,
      font: regular,
      color: rgb(0.72, 0.72, 0.78),
    });
  };

  const drawLetterhead = (target: PDFPage, first: boolean) => {
    const h = first ? HEADER_H : CONT_HEADER_H;
    target.drawRectangle({ x: 0, y: PAGE_H - h, width: PAGE_W, height: h, color: NIGHT });
    target.drawRectangle({ x: 0, y: PAGE_H - h, width: PAGE_W, height: 2.5, color: GOLD });

    const logoW = first ? 218 : 132;
    const logoH = (logoW * logo.height) / logo.width;
    target.drawImage(logo, {
      x: MARGIN,
      y: PAGE_H - h + (first ? h - logoH - 34 : (h - logoH) / 2 + 1),
      width: logoW,
      height: logoH,
    });

    if (first) {
      target.drawText("CREATIVE DIRECTION  ·  WEB DESIGN  ·  BRAND SYSTEMS", {
        x: MARGIN,
        y: PAGE_H - h + 26,
        size: 7.5,
        font: regular,
        color: rgb(0.65, 0.65, 0.72),
      });
      const lines = [LEGAL_IDENTITY.site, LEGAL_IDENTITY.email, LEGAL_IDENTITY.phone];
      lines.forEach((line, i) => {
        target.drawText(line, {
          x: PAGE_W - MARGIN - regular.widthOfTextAtSize(line, 8.5),
          y: PAGE_H - 46 - i * 13,
          size: 8.5,
          font: i === 0 ? bold : regular,
          color: i === 0 ? GOLD : rgb(0.78, 0.78, 0.83),
        });
      });
    }
    drawFooter(target);
  };

  let page = pdf.addPage([PAGE_W, PAGE_H]);
  drawLetterhead(page, true);
  let y = PAGE_H - HEADER_H - 40;

  const newPage = () => {
    page = pdf.addPage([PAGE_W, PAGE_H]);
    drawLetterhead(page, false);
    y = PAGE_H - CONT_HEADER_H - 34;
  };

  const ensure = (needed: number) => {
    if (y - needed < FOOTER_H + 26) newPage();
  };

  const drawLines = (
    text: string,
    font: PDFFont,
    size: number,
    color = INK,
    leading = size * 1.45,
  ) => {
    for (const line of wrap(text, font, size, maxWidth)) {
      ensure(leading);
      if (line) page.drawText(line, { x: MARGIN, y: y - size, size, font, color });
      y -= leading;
    }
  };

  // Document title block
  drawLines("PROJECT SCOPE AGREEMENT", bold, 22, INK, 28);
  page.drawRectangle({ x: MARGIN, y: y + 6, width: 46, height: 2.5, color: CRIMSON });
  y -= 16;
  drawLines(
    `Prepared for ${data.clientName}${data.clientCompany ? `, ${data.clientCompany}` : ""}  ·  ${generatedOn}  ·  Ref ${data.shareToken.slice(0, 12)}`,
    regular,
    9,
    MUTED,
    18,
  );
  y -= 10;

  const section = (label: string, value?: string | null) => {
    const content = value && value.trim() ? value.trim() : "—";
    ensure(48);
    drawLines(label.toUpperCase(), bold, 8.5, GOLD, 15);
    drawLines(content, regular, 10, INK, 15);
    y -= 6;
    ensure(12);
    page.drawLine({
      start: { x: MARGIN, y: y + 4 },
      end: { x: PAGE_W - MARGIN, y: y + 4 },
      thickness: 0.5,
      color: HAIRLINE,
    });
    y -= 10;
  };

  section(
    "Client",
    `${data.clientName}${data.clientCompany ? ` (${data.clientCompany})` : ""} · ${data.clientEmail}`,
  );
  section("Project Title", data.projectTitle);
  section("Scope & Deliverables", data.scopeDeliverables);
  section("Estimated Timeline", data.timelineWeeks);

  // Investment table
  ensure(96);
  drawLines("INVESTMENT", bold, 8.5, GOLD, 16);
  const rows: Array<[string, string]> = [
    ["Project total", money(data.totalPriceCents)],
    ["Deposit due to reserve start date", money(data.depositCents)],
    ["Balance due at launch", money(data.balanceCents)],
  ];
  rows.forEach(([label, value], i) => {
    ensure(24);
    const rowY = y - 18;
    if (i % 2 === 0) {
      page.drawRectangle({
        x: MARGIN - 8,
        y: rowY - 4,
        width: maxWidth + 16,
        height: 22,
        color: rgb(0.965, 0.965, 0.975),
      });
    }
    page.drawText(label, { x: MARGIN, y: rowY + 2, size: 10, font: regular, color: INK });
    page.drawText(value, {
      x: PAGE_W - MARGIN - bold.widthOfTextAtSize(value, 10),
      y: rowY + 2,
      size: 10,
      font: bold,
      color: i === 0 ? INK : CRIMSON,
    });
    y -= 22;
  });
  y -= 16;

  section("Payment & Scope Terms", data.terms);

  // Signature Block — accepted vs. awaiting signature
  const isSigned = Boolean(data.clientSignedAt);
  ensure(84);
  y -= 6;
  page.drawRectangle({
    x: MARGIN - 10,
    y: y - 58,
    width: maxWidth + 20,
    height: 64,
    color: isSigned ? rgb(0.95, 0.98, 0.95) : rgb(0.98, 0.98, 0.99),
    borderColor: isSigned ? EMERALD : rgb(0.8, 0.8, 0.84),
    borderWidth: 1,
  });
  y -= 6;

  if (isSigned) {
    drawLines("DIGITAL SIGNATURE & ACCEPTANCE", bold, 9, EMERALD, 14);
    drawLines(
      `Signed by: ${data.clientSignatureName || data.clientName} (${data.clientEmail})`,
      bold,
      11,
      INK,
      16,
    );
    drawLines(
      `Timestamp: ${new Date(data.clientSignedAt as string).toUTCString()}`,
      regular,
      9,
      MUTED,
      14,
    );
  } else {
    drawLines("ACCEPTANCE", bold, 9, MUTED, 14);
    drawLines(`Awaiting digital signature from ${data.clientName}`, bold, 11, INK, 16);
    drawLines(
      `Sign online at ${LEGAL_IDENTITY.site}/proposal/${data.shareToken}`,
      regular,
      9,
      MUTED,
      14,
    );
  }
  y -= 24;

  ensure(30);
  drawLines(
    `${LEGAL_IDENTITY.legalName} d/b/a ${LEGAL_IDENTITY.dba} · Creative Director · ${LEGAL_IDENTITY.site}`,
    regular,
    9,
    MUTED,
    14,
  );

  return await pdf.save();
}
