import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const enPath = join(root, 'src/locales/en.json')
const extraPath = join(__dirname, 'enrollment-locale-data.json')

function deepMerge(target, source) {
  const out = { ...target }
  for (const key of Object.keys(source)) {
    const sv = source[key]
    const tv = out[key]
    if (sv && typeof sv === 'object' && !Array.isArray(sv) && tv && typeof tv === 'object' && !Array.isArray(tv)) {
      out[key] = deepMerge(tv, sv)
    } else {
      out[key] = sv
    }
  }
  return out
}

const full = JSON.parse(readFileSync(enPath, 'utf8'))
const extra = JSON.parse(readFileSync(extraPath, 'utf8'))
full.enrollment = deepMerge(full.enrollment || {}, extra)
writeFileSync(enPath, JSON.stringify(full, null, 2) + '\n')
console.log('Merged enrollment locale into en.json')
