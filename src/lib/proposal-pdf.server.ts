import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";

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
const CRIMSON = rgb(1, 0.2, 0.2);
const INK = rgb(0.09, 0.09, 0.11);
const MUTED = rgb(0.42, 0.42, 0.46);
const EMERALD = rgb(0.06, 0.65, 0.42);

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

export async function buildSignedProposalPdf(data: ProposalPdfData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Signed Proposal — ${data.projectTitle} — ${data.clientName}`);
  pdf.setAuthor("The Roy Effect");

  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const maxWidth = PAGE_W - MARGIN * 2;

  let page = pdf.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  const newPage = () => {
    page = pdf.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - MARGIN;
  };

  const ensure = (needed: number) => {
    if (y - needed < MARGIN) newPage();
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

  // Crimson top banner bar
  page.drawRectangle({
    x: 0,
    y: PAGE_H - 10,
    width: PAGE_W,
    height: 10,
    color: CRIMSON,
  });
  y -= 6;

  drawLines("THE ROY EFFECT", bold, 10, CRIMSON, 16);
  drawLines("PROJECT SCOPE AGREEMENT", bold, 24, INK, 30);
  drawLines(
    `Reference Token: ${data.shareToken}  ·  Generated: ${new Date().toISOString().slice(0, 10)}`,
    regular,
    9,
    MUTED,
    20,
  );
  y -= 10;

  const section = (label: string, value?: string | null) => {
    const content = value && value.trim() ? value.trim() : "—";
    ensure(44);
    drawLines(label.toUpperCase(), bold, 9, CRIMSON, 15);
    drawLines(content, regular, 10, INK, 15);
    y -= 8;
  };

  section(
    "Client",
    `${data.clientName}${data.clientCompany ? ` (${data.clientCompany})` : ""} · ${data.clientEmail}`,
  );
  section("Project Title", data.projectTitle);
  section("Scope & Deliverables", data.scopeDeliverables);
  section("Estimated Timeline", data.timelineWeeks);
  section(
    "Investment",
    `Total: ${money(data.totalPriceCents)}  |  50% Deposit: ${money(data.depositCents)}  |  Balance: ${money(data.balanceCents)}`,
  );
  section("Payment & Scope Terms", data.terms);

  // Digital Signature Block
  ensure(70);
  y -= 10;
  page.drawRectangle({
    x: MARGIN - 10,
    y: y - 55,
    width: maxWidth + 20,
    height: 60,
    color: rgb(0.95, 0.98, 0.95),
    borderColor: EMERALD,
    borderWidth: 1,
  });

  drawLines("DIGITAL SIGNATURE & ACCEPTANCE", bold, 9, EMERALD, 14);
  drawLines(
    `Signed by: ${data.clientSignatureName || data.clientName} (${data.clientEmail})`,
    bold,
    11,
    INK,
    16,
  );
  drawLines(
    `Timestamp: ${data.clientSignedAt ? new Date(data.clientSignedAt).toUTCString() : "Signed online"}`,
    regular,
    9,
    MUTED,
    14,
  );
  y -= 25;

  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_W - MARGIN, y },
    thickness: 0.6,
    color: rgb(0.85, 0.85, 0.87),
  });
  y -= 18;
  drawLines("Rory Ulloa — Creative Director · theroyeffect.com", regular, 9, MUTED, 14);

  return await pdf.save();
}
