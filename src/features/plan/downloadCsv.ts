/** Download rows as a CSV file. Values are quoted, and cells starting with = + - @ are prefixed so spreadsheets don't run them as formulas. */
export function downloadCsv(fileName: string, rows: (string | number)[][]) {
  const cell = (v: string | number) => {
    let s = String(v)
    if (/^[=+\-@]/.test(s) && Number.isNaN(Number(s))) s = `'${s}`
    return `"${s.replace(/"/g, '""')}"`
  }
  const blob = new Blob(['﻿' + rows.map((r) => r.map(cell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
