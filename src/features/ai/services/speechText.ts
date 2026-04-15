/**
 * Strip markdown and tidy text so the browser TTS sounds like a person talking,
 * not reading asterisks and line breaks aloud.
 */
export function textForSpeech(raw: string): string {
  let t = raw.replace(/\*\*(.+?)\*\*/g, '$1')
  t = t.replace(/\*(.+?)\*/g, '$1')
  t = t.replace(/#{1,6}\s*/g, '')
  t = t.replace(/\n+/g, ' ')
  t = t.replace(/\s+/g, ' ')
  return t.trim()
}
