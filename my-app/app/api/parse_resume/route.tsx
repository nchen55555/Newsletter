import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import { exec } from 'child_process'

// Ensure this API runs on the Node.js runtime (NOT Edge)
export const runtime = 'nodejs'
// Optional: prevent caching of results by Next
export const dynamic = 'force-dynamic'

const writeFile = promisify(fs.writeFile)
const unlink = promisify(fs.unlink)
const execAsync = promisify(exec)

// =========================
// Types
// =========================
interface ExperienceJob {
  company: string
  role: string
  dates: string
  summary?: string
  summary_bullets?: string[]
  [key: string]: string | string[] | undefined
}

interface ParsedResumeData {
  experience: ExperienceJob[]
  education: string[]
  _meta?: { charCount: number; preview: string }
}

// =========================
// Config: headers & patterns
// =========================
const SECTION_HEADERS = {
  experience: [
    'work experience',
    'professional experience',
    'experience',
    'employment history',
    'employment',
  ],
  education: ['education', 'academic background', 'academics'],
}

const JOB_SUBSECTION_HEADERS = [
  'responsibilities',
  'achievements',
  'accomplishments',
  'impact',
  'results',
  'outcomes',
  'projects',
  'leadership',
  'technologies',
  'tech',
  'stack',
  'tools',
  'skills',
]

const MONTH =
  '(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)'
const YEAR = '(20\\d{2}|19\\d{2})'
const DATE_RANGE = `(?:${MONTH}\\s+${YEAR}|${YEAR})(?:\\s*[–-]\\s*(?:${MONTH}\\s+${YEAR}|${YEAR}|Present))`

const JOB_HEADER_PATTERNS: RegExp[] = [
  // Company — Role — Dates
  new RegExp(`^(?<company>.+?)\\s+[—-]\\s+(?<role>.+?)\\s+[—-]\\s+(?<dates>${DATE_RANGE})$`),
  // Role, Company — Dates
  new RegExp(`^(?<role>.+?),\\s+(?<company>.+?)\\s+[—-]\\s+(?<dates>${DATE_RANGE})$`),
  // Company | Role | Dates
  new RegExp(`^(?<company>.+?)\\s*[|•]\\s*(?<role>.+?)\\s*[|•]\\s*(?<dates>${DATE_RANGE})$`),
  // Company (Role) Dates
  new RegExp(`^(?<company>.+?)\\s*\\((?<role>.+?)\\)\\s+(?<dates>${DATE_RANGE})$`),
  // Fallback: prefix + dates
  new RegExp(`^(?<prefix>.+?)\\s+(?<dates>${DATE_RANGE})$`),
]

const BULLET_REGEX = /^\s*(?:[-•–*]|\d{1,2}\.)\s+/

// PII redaction
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g
const PHONE_REGEX = /(\+?\d{1,3}[\s\-]?)?(\(?\d{2,4}\)?[\s\-.]?)?\d{3}[\s\-.]?\d{4}/g

// =========================
// Helpers
// =========================
function redactPii(text: string): string {
  return text.replace(EMAIL_REGEX, '[EMAIL]').replace(PHONE_REGEX, '[PHONE]')
}

function isBullet(line: string): boolean {
  return BULLET_REGEX.test(line.trim())
}

function normalizeLines(block: string): string[] {
  return block
    .split('\n')
    .map((l) => l.replace(/[\u200B-\u200D\uFEFF]/g, '')) // zero-width
    .map((l) => l.replace(/\u00A0/g, ' ')) // nbsp -> space
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}

function findSectionSpan(
  text: string,
  headerPatterns: string[],
  stopPatterns: string[],
): string | null {
  const headerRegex = new RegExp(`^(?:${headerPatterns.join('|')})\\b.*$`, 'im')
  const stopRegex = stopPatterns.length
    ? new RegExp(`^(?:${stopPatterns.join('|')})\\b.*$`, 'im')
    : null

  const startMatch = text.match(headerRegex)
  if (!startMatch) return null

  const startIdx = text.indexOf(startMatch[0]) + startMatch[0].length
  let endIdx = text.length

  if (stopRegex) {
    const slice = text.slice(startIdx)
    const stopMatch = slice.match(stopRegex)
    if (stopMatch) endIdx = startIdx + slice.indexOf(stopMatch[0])
  }

  const section = text.slice(startIdx, endIdx).trim()
  return section || null
}

function sliceSections(text: string): { experience?: string; education?: string } {
  const all = [...SECTION_HEADERS.experience, ...SECTION_HEADERS.education]
  const experience =
    findSectionSpan(
      text,
      SECTION_HEADERS.experience,
      all.filter((p) => !SECTION_HEADERS.experience.includes(p)),
    ) || undefined

  const education =
    findSectionSpan(
      text,
      SECTION_HEADERS.education,
      all.filter((p) => !SECTION_HEADERS.education.includes(p)),
    ) || undefined

  return { experience, education }
}

function tryParseJobHeader(line: string): { company?: string; role?: string; dates?: string } | null {
  const trimmed = line.trim()
  for (const re of JOB_HEADER_PATTERNS) {
    const m = trimmed.match(re) as (RegExpMatchArray & { groups?: Record<string, string> }) | null
    if (m?.groups) {
      const { company, role, dates, prefix } = m.groups
      if (prefix && (!company || !role)) {
        const parts = prefix.split(/\s*[—–\-|•,]\s*/).filter(Boolean)
        return { company: parts[0] || '', role: parts[1] || '', dates }
      }
      return { company, role, dates }
    }
  }
  return null
}

function partitionJobSubsections(lines: string[]): Record<string, string | string[]> {
  if (!lines.length) return {}
  const subheaderRegex = new RegExp(`^(?:${JOB_SUBSECTION_HEADERS.join('|')})\\b.*$`, 'i')

  let currentKey = 'summary'
  const buckets: Record<string, string[]> = { [currentKey]: [] }

  for (const line of lines) {
    if (subheaderRegex.test(line)) {
      const key = line.replace(/:?\s*$/, '').trim().toLowerCase().replace(/\s+/g, '_')
      currentKey = key
      if (!buckets[currentKey]) buckets[currentKey] = []
      continue
    }
    buckets[currentKey].push(line)
  }

  const result: Record<string, string | string[]> = {}
  for (const [key, values] of Object.entries(buckets)) {
    const bullets = values.filter(isBullet).map((v) => v.replace(BULLET_REGEX, '').trim())
    const normals = values.filter((v) => !isBullet(v))

    if (bullets.length) result[`${key}_bullets`] = bullets.map(redactPii)
    if (normals.length) result[key] = redactPii(normals.join(' '))
  }
  return result
}

function parseExperienceBlock(expText?: string): ExperienceJob[] {
  if (!expText) return []
  const lines = normalizeLines(expText)

  const jobs: ExperienceJob[] = []
  let current: Partial<ExperienceJob> | null = null
  let buffer: string[] = []
  let expectingRole = false
  let expectingDates = false

  const flush = () => {
    if (!current) return
    const subs = partitionJobSubsections(buffer)
    jobs.push({
      company: redactPii(current.company || ''),
      role: redactPii(current.role || ''),
      dates: current.dates || '',
      ...subs,
    })
    current = null
    buffer = []
    expectingRole = false
    expectingDates = false
  }

  const isDateLine = (line: string) => new RegExp(DATE_RANGE, 'i').test(line)
  const looksCompany = (line: string) =>
    !isBullet(line) && !isDateLine(line) && line.length > 2 &&
    !/(responsibilities|achievements|accomplishments|impact|results|outcomes)/i.test(line)

  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i]

    // Single-line job header
    const header = tryParseJobHeader(ln)
    if (header) {
      flush()
      current = { company: header.company || '', role: header.role || '', dates: header.dates || '' }
      continue
    }

    // Multi-line Company → Role → Dates
    if (expectingRole && current && !current.role && !isBullet(ln) && !isDateLine(ln)) {
      current.role = ln
      expectingRole = false
      expectingDates = true
      continue
    }
    if (expectingDates && current && !current.dates && isDateLine(ln)) {
      current.dates = ln
      expectingDates = false
      continue
    }

    // Potential start of a new job
    if (looksCompany(ln) && !expectingRole && !expectingDates) {
      const next = lines[i + 1] || ''
      const after = lines[i + 2] || ''
      if (next && !isBullet(next) && !isDateLine(next) && (isDateLine(after) || /Present|20\d{2}|19\d{2}/.test(after))) {
        flush()
        current = { company: ln }
        expectingRole = true
        continue
      }
    }

    // Accumulate content
    buffer.push(ln)
  }

  flush()
  return jobs.filter((j) => j.company || j.role || j.dates)
}

function parseEducationBlock(edText?: string): string[] {
  if (!edText) return []
  return normalizeLines(edText).map(redactPii)
}

// =========================
// PDF extraction (Node) with graceful fallbacks
// =========================
async function extractTextFromPdf(buffer: Buffer, filePath: string): Promise<string> {
  // Preferred: pdf-parse
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod = await import('pdf-parse') as { default?: any; [key: string]: any } // dynamic import works with CJS
    const pdfParse = mod?.default || mod
    const res = await pdfParse(buffer)
    if (res?.text?.trim()) return res.text
  } catch (e) {
    console.warn('pdf-parse not available or failed:', e)
  }

  // Fallback 1: poppler-utils (pdftotext)
  try {
    const { stdout } = await execAsync(`pdftotext "${filePath}" -`)
    if (stdout?.trim()) return stdout
  } catch (e) {
    console.warn('pdftotext not available or failed:', e)
  }

  // Fallback 2: Python pdfplumber (if available)
  try {
    const python = `
import sys
try:
  import pdfplumber
  with pdfplumber.open("${filePath}") as pdf:
    txt=""
    for p in pdf.pages:
      txt += (p.extract_text() or "") + "\n"
    print(txt)
except Exception as e:
  sys.exit(1)
`
    const { stdout } = await execAsync(`python3 -c "${python.replace(/\n/g, ';')}"`)
    if (stdout?.trim()) return stdout
  } catch (e) {
    console.warn('python/pdfplumber not available or failed:', e)
  }

  throw new Error('Unable to extract text from PDF with available methods.')
}

// =========================
// API handler
// =========================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { resume_url } = body || {}

    if (!resume_url) {
      return NextResponse.json({ error: 'Missing required field: resume_url' }, { status: 400 })
    }

    // Download to /tmp
    const res = await fetch(resume_url)
    if (!res.ok) return NextResponse.json({ error: 'Failed to download resume from URL' }, { status: 400 })

    const buf = Buffer.from(await res.arrayBuffer())
    const tempFilePath = path.join('/tmp', `resume_${Date.now()}.pdf`)
    await writeFile(tempFilePath, buf)

    try {
      // Extract + parse
      const fullText = await extractTextFromPdf(buf, tempFilePath)
      const sections = sliceSections(fullText)
      const experience = parseExperienceBlock(sections.experience)
      const education = parseEducationBlock(sections.education)

      const data: ParsedResumeData = {
        experience,
        education,
        _meta: {
          charCount: fullText.length,
          preview: fullText.slice(0, 300).replace(/\s+/g, ' ') + (fullText.length > 300 ? '…' : ''),
        },
      }

      return NextResponse.json({ success: true, data })
    } finally {
      // Clean up temp file regardless of success
      await unlink(tempFilePath).catch(() => {})
    }
  } catch (err: unknown) {
    console.error('Resume parsing error:', err)
    return NextResponse.json(
      { error: 'Failed to parse resume', details: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
