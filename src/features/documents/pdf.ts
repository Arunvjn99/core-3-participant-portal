/**
 * Minimal single-page PDF writer (Helvetica, text only) so the demo can offer real downloads.
 * When documents come from a backend, replace the `buildPdf` call in DocumentsPage's handleDownload
 * with a fetch of the stored file.
 */
function latin1(input: string): string {
  // Helvetica/WinAnsi covers Latin-1; map common typographic characters, anything else becomes '?'.
  const s = input.replace(/[\u2013\u2014]/g, '-').replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/\u2026/g, '...')
  return Array.from(s, (c) => (c.charCodeAt(0) <= 255 ? c : '?')).join('').replace(/([\\()])/g, '\\$1')
}

export function buildPdf(title: string, lines: string[]): Blob {
  const content: string[] = ['BT', '/F1 18 Tf', '50 780 Td', `(${latin1(title)}) Tj`, '/F1 11 Tf']
  for (const line of lines) content.push('0 -22 Td', `(${latin1(line)}) Tj`)
  content.push('ET')
  const stream = content.join('\n')

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
  ]

  let pdf = '%PDF-1.4\n'
  const offsets: number[] = []
  objects.forEach((body, i) => {
    offsets.push(pdf.length)
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`
  })
  const xref = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (const o of offsets) pdf += `${String(o).padStart(10, '0')} 00000 n \n`
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`

  const bytes = new Uint8Array(pdf.length)
  for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 0xff
  return new Blob([bytes], { type: 'application/pdf' })
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
