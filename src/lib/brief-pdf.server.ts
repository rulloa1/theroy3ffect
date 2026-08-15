import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export interface BriefPdfData {
  name: string
  email: string
  company?: string
  projectType: string
  goals: string
  audience?: string
  deliverables?: string
  referencesLinks?: string
  budget?: string
  timeline?: string
  extra?: string
  sessionId?: string
  submittedAt?: string
}

const PAGE_W = 595.28
const PAGE_H = 841.89
const MARGIN = 56
const CRIMSON = rgb(1, 0.2, 0.2)
const INK = rgb(0.09, 0.09, 0.11)
const MUTED = rgb(0.42, 0.42, 0.46)

function wrap(text: string, font: any, size: number, maxWidth: number): string[] {
  const lines: string[] = []
  for (const paragraph of text.split(/\r?\n/)) {
    if (!paragraph.trim()) {
      lines.push('')
      continue
    }
    let line = ''
    for (const word of paragraph.split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        line = candidate
      } else {
        if (line) lines.push(line)
        line = word
      }
    }
    if (line) lines.push(line)
  }
  return lines
}

/** Renders a one-or-more page PDF summary of a submitted brief. */
export async function buildBriefPdf(data: BriefPdfData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  pdf.setTitle(`Project brief — ${data.name}`)
  pdf.setAuthor('The Roy Effect')

  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const regular = await pdf.embedFont(StandardFonts.Helvetica)
  const maxWidth = PAGE_W - MARGIN * 2

  let page = pdf.addPage([PAGE_W, PAGE_H])
  let y = PAGE_H - MARGIN

  const newPage = () => {
    page = pdf.addPage([PAGE_W, PAGE_H])
    y = PAGE_H - MARGIN
  }

  const ensure = (needed: number) => {
    if (y - needed < MARGIN) newPage()
  }

  const drawLines = (
    text: string,
    font: any,
    size: number,
    color = INK,
    leading = size * 1.45,
  ) => {
    for (const line of wrap(text, font, size, maxWidth)) {
      ensure(leading)
      if (line) page.drawText(line, { x: MARGIN, y: y - size, size, font, color })
      y -= leading
    }
  }

  // Header
  page.drawRectangle({
    x: 0,
    y: PAGE_H - 10,
    width: PAGE_W,
    height: 10,
    color: CRIMSON,
  })
  y -= 6
  drawLines('THE ROY EFFECT', bold, 10, CRIMSON, 16)
  drawLines('PROJECT BRIEF', bold, 26, INK, 32)
  drawLines(
    `${data.submittedAt ?? new Date().toISOString().slice(0, 10)}${
      data.sessionId ? `  ·  Payment ref: ${data.sessionId}` : ''
    }`,
    regular,
    9,
    MUTED,
    20,
  )
  y -= 8

  const section = (label: string, value?: string) => {
    const content = value && value.trim() ? value.trim() : '—'
    ensure(48)
    drawLines(label.toUpperCase(), bold, 9, CRIMSON, 15)
    drawLines(content, regular, 11, INK, 16)
    y -= 10
  }

  section('Client', `${data.name}${data.company ? ` — ${data.company}` : ''}`)
  section('Email', data.email)
  section('Project type', data.projectType)
  section('Goals', data.goals)
  section('Audience', data.audience)
  section('Deliverables', data.deliverables)
  section('References & links', data.referencesLinks)
  section('Budget', data.budget)
  section('Timeline', data.timeline)
  section('Anything else', data.extra)

  ensure(40)
  y -= 6
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_W - MARGIN, y },
    thickness: 0.6,
    color: rgb(0.85, 0.85, 0.87),
  })
  y -= 18
  drawLines('Rory Ulloa — Creative Director · theroyeffect.com', regular, 9, MUTED, 14)

  return await pdf.save()
}
