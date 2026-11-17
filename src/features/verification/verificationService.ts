/**
 * The one place the portal talks to verification providers: address validation, bank account
 * verification, identity checks and beneficiary consent.
 *
 * Each function is answered in the browser from simple rules so the screens work end to end. To
 * connect a provider, replace the body of a function with a request to the backend endpoint and
 * keep its return type: the screens that call it do not change.
 */

// ─── Address validation ──────────────────────────────────────────────────────

export interface PostalAddress {
  address1: string
  address2: string
  city: string
  state: string
  zip: string
  country: string
}

export type AddressIssue = 'zip_state_mismatch' | 'missing_street_number' | 'unknown_state' | 'outside_us'

export type AddressResult =
  /** Deliverable exactly as typed. */
  | { status: 'verified'; address: PostalAddress }
  /** Deliverable once standardized; `changed` lists the fields that differ from what was typed. */
  | { status: 'corrected'; address: PostalAddress; changed: (keyof PostalAddress)[] }
  /** Could not be matched to a deliverable address. */
  | { status: 'unverified'; issue: AddressIssue }

const STATES: Record<string, string> = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA', colorado: 'CO', connecticut: 'CT', delaware: 'DE',
  'district of columbia': 'DC', florida: 'FL', georgia: 'GA', hawaii: 'HI', idaho: 'ID', illinois: 'IL', indiana: 'IN', iowa: 'IA',
  kansas: 'KS', kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD', massachusetts: 'MA', michigan: 'MI', minnesota: 'MN',
  mississippi: 'MS', missouri: 'MO', montana: 'MT', nebraska: 'NE', nevada: 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
  'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', ohio: 'OH', oklahoma: 'OK', oregon: 'OR',
  pennsylvania: 'PA', 'rhode island': 'RI', 'south carolina': 'SC', 'south dakota': 'SD', tennessee: 'TN', texas: 'TX', utah: 'UT',
  vermont: 'VT', virginia: 'VA', washington: 'WA', 'west virginia': 'WV', wisconsin: 'WI', wyoming: 'WY', 'puerto rico': 'PR',
}

/** First ZIP digit by state: enough to catch a ZIP that belongs to another part of the country. */
const ZIP_FIRST_DIGIT: Record<string, string> = {
  CT: '0', MA: '0', ME: '0', NH: '0', NJ: '0', RI: '0', VT: '0', PR: '0',
  DE: '1', NY: '1', PA: '1',
  DC: '2', MD: '2', NC: '2', SC: '2', VA: '2', WV: '2',
  AL: '3', FL: '3', GA: '3', MS: '3', TN: '3',
  IN: '4', KY: '4', MI: '4', OH: '4',
  IA: '5', MN: '5', MT: '5', ND: '5', SD: '5', WI: '5',
  IL: '6', KS: '6', MO: '6', NE: '6',
  AR: '7', LA: '7', OK: '7', TX: '7',
  AZ: '8', CO: '8', ID: '8', NM: '8', NV: '8', UT: '8', WY: '8',
  AK: '9', CA: '9', HI: '9', OR: '9', WA: '9',
}

const STREET_WORDS: Record<string, string> = {
  street: 'St', avenue: 'Ave', boulevard: 'Blvd', drive: 'Dr', road: 'Rd', lane: 'Ln', court: 'Ct', place: 'Pl', highway: 'Hwy',
  parkway: 'Pkwy', terrace: 'Ter', circle: 'Cir', square: 'Sq', apartment: 'Apt', suite: 'Ste', building: 'Bldg', floor: 'Fl',
  north: 'N', south: 'S', east: 'E', west: 'W',
}

const titleCase = (s: string) => s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase())
const tidy = (s: string) => s.trim().replace(/\s+/g, ' ')

function standardizeLine(line: string): string {
  return tidy(line)
    .split(' ')
    .map((word, i) => {
      const bare = word.replace(/[.,]/g, '').toLowerCase()
      // The first word is a house number or part of the street name, never a suffix
      if (i > 0 && STREET_WORDS[bare]) return STREET_WORDS[bare]
      return /^\d/.test(word) ? word.toUpperCase() : titleCase(word.replace(/[.,]/g, ''))
    })
    .join(' ')
}

export async function validateAddress(input: PostalAddress): Promise<AddressResult> {
  if (!/^(usa|us|u\.s\.a?\.?|united states( of america)?)$/i.test(input.country.trim())) return { status: 'unverified', issue: 'outside_us' }

  const stateKey = input.state.trim().toLowerCase()
  const state = STATES[stateKey] ?? (Object.values(STATES).includes(stateKey.toUpperCase()) ? stateKey.toUpperCase() : null)
  if (!state) return { status: 'unverified', issue: 'unknown_state' }

  const zip = input.zip.trim().replace(/^(\d{5})-?(\d{4})$/, '$1-$2')
  if (ZIP_FIRST_DIGIT[state] !== zip[0]) return { status: 'unverified', issue: 'zip_state_mismatch' }
  if (!/^(\d|p\.?\s?o\.?\s?box)/i.test(input.address1.trim())) return { status: 'unverified', issue: 'missing_street_number' }

  const address: PostalAddress = {
    address1: standardizeLine(input.address1),
    address2: standardizeLine(input.address2),
    city: titleCase(tidy(input.city)),
    state,
    zip,
    country: 'USA',
  }
  const changed = (Object.keys(address) as (keyof PostalAddress)[]).filter((k) => address[k] !== input[k])
  return changed.length ? { status: 'corrected', address, changed } : { status: 'verified', address }
}

/** One line per part, for showing an address in a comparison. */
export const addressLines = (a: PostalAddress) => [[a.address1, a.address2].filter(Boolean).join(', '), `${a.city}, ${a.state} ${a.zip}`, a.country]

// ─── Bank account verification ───────────────────────────────────────────────

export type BankCheckFailure = 'name_mismatch' | 'routing_not_found'

const routingChecksum = (routing: string) => {
  const n = routing.replace(/\D/g, '').split('').map(Number)
  return n.length === 9 && (3 * (n[0] + n[3] + n[6]) + 7 * (n[1] + n[4] + n[7]) + (n[2] + n[5] + n[8])) % 10 === 0
}

/** Instant check: the account exists and is held in the participant's name. */
export async function verifyBankInstant(input: { accountHolder: string; routing: string; participantLastName: string }): Promise<{ ok: true } | { ok: false; reason: BankCheckFailure }> {
  if (!routingChecksum(input.routing)) return { ok: false, reason: 'routing_not_found' }
  const holder = input.accountHolder.trim().toLowerCase()
  if (!holder.includes(input.participantLastName.trim().toLowerCase())) return { ok: false, reason: 'name_mismatch' }
  return { ok: true }
}

/** Starts two small deposits; the participant confirms the amounts once they arrive. */
export async function sendMicroDeposits(): Promise<{ sentAt: string }> {
  return { sentAt: new Date().toISOString() }
}

/** Amounts are in dollars. Two different deposits under one dollar are accepted. */
export async function confirmMicroDeposits(first: number, second: number): Promise<{ ok: boolean }> {
  const valid = (v: number) => Number.isFinite(v) && v >= 0.01 && v <= 0.99
  return { ok: valid(first) && valid(second) && first !== second }
}

// ─── Identity check ──────────────────────────────────────────────────────────

export interface IdentityFacts {
  street: string
  city: string
  hireYear: number
}

export interface IdentityQuestion {
  id: 'street' | 'city' | 'hire_year'
  options: string[]
}

const STREET_DECOYS = ['Maple Avenue', 'Harbor View Road', 'Linden Court', 'Juniper Lane', 'Orchard Street']
const CITY_DECOYS = ['Tacoma', 'Boise', 'Sacramento', 'Albany', 'Madison']

/** Street name without the house number or unit, the way a knowledge question shows it. */
const streetName = (address1: string) => tidy(address1.replace(/^\d+[a-z]?\s+/i, ''))

/** Places the right answer among three others; the position depends on the answer, not on chance, so it is stable. */
function withDecoys(answer: string, decoys: string[]): string[] {
  const others = decoys.filter((d) => d.toLowerCase() !== answer.toLowerCase()).slice(0, 3)
  const at = answer.length % (others.length + 1)
  return [...others.slice(0, at), answer, ...others.slice(at)]
}

/** Knowledge questions drawn from the participant's record. */
export async function getIdentityQuestions(facts: IdentityFacts): Promise<IdentityQuestion[]> {
  const y = facts.hireYear
  return [
    { id: 'street', options: withDecoys(streetName(facts.street), STREET_DECOYS) },
    { id: 'city', options: withDecoys(facts.city, CITY_DECOYS) },
    { id: 'hire_year', options: [y - 3, y - 1, y, y + 2].map(String) },
  ]
}

/** Passes with at least two of the three answers right. */
export async function checkIdentityAnswers(facts: IdentityFacts, answers: Record<IdentityQuestion['id'], string>): Promise<{ passed: boolean }> {
  const right = [answers.street === streetName(facts.street), answers.city === facts.city, answers.hire_year === String(facts.hireYear)].filter(Boolean).length
  return { passed: right >= 2 }
}

// ─── Beneficiary consent ─────────────────────────────────────────────────────

export type ConsentStatus = 'waiting' | 'completed'

/** Sends the spouse a link to sign the consent in front of an online notary. */
export async function requestSpousalConsent(spouseEmail: string): Promise<{ requestedAt: string; sentTo: string }> {
  return { requestedAt: new Date().toISOString(), sentTo: spouseEmail.trim() }
}

/** Asks the notary service whether the spouse has finished signing. */
export async function getSpousalConsentStatus(requestedAt: string): Promise<ConsentStatus> {
  // A request that was really sent counts as signed the next time the participant checks
  return Number.isNaN(new Date(requestedAt).getTime()) ? 'waiting' : 'completed'
}
