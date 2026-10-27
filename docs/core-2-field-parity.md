# Core 2.0 portal: field parity with 3.0

Source: the Core 2.0 prototype at partcipantportal-core-2.netlify.app ("LendGuard"), walked through with its demo participants on 21 Oct 2026. Every page, form, dialog and dropdown I could open was recorded. Anything that needed me to accept a consent, enter data to continue, or submit was not stepped through, and those cases are listed under "Not captured".

**Status key:** Added = built in this pass. Present = 3.0 already had it. Different = 3.0 has an equivalent with different wording or structure. Gap = not built.

All new screens use placeholder data and keep it in the browser. Spanish text is my own translation and needs native review.

## Profile (`/profile`)

| 2.0 field | 3.0 | Status |
|---|---|---|
| First, middle, last name | Personal details | Added |
| Gender, marital status | Personal details (select) | Added |
| Date of birth, with age shown | Personal details | Added |
| SSN, masked, with show/hide | Personal details (kept in memory only, never in browser storage) | Added |
| Email | Personal details | Added |
| Primary phone (country code and number), secondary phone | Personal details | Added |
| Address line 1 and 2, city, state, zip, country | Personal details | Added |
| Bank: account holder, bank name, account type, account number (masked), ABA routing | Bank details tab, with ABA checksum validation | Added |
| Employment: job, payroll frequency, date of hire, ownership %, rehire, most recent rehire and term | Employment tab (the four editable fields are editable, as in 2.0) | Added |
| Status flags: QDRO, family member of owner, officer, HCE, key employee, insider/restricted | Employment tab, read-only | Added |
| Employee classification: category chips, current entry, history table | Classification tab | Added |
| Beneficiaries: type, name, relationship (8 options), share, Set %, Add beneficiary | Beneficiaries tab with 3-section add form, share editing that must total 100%, and a leave-without-saving prompt | Added |
| Beneficiary basic details: type, name, relationship, SSN, date of birth | Add form section 1 | Added |
| Change password | Password tab and account menu, with strength rules | Added |
| Preferences (language, theme, notifications) | Preferences tab | Present |

## Plan details and elections (`/enrollment/manage/roth-401k`)

| 2.0 field | 3.0 | Status |
|---|---|---|
| Deferral by source: pre-tax and Roth rates | Deferrals tab, view and edit | Added |
| % / $ unit toggle, with conversion by payroll frequency | Edit form | Added |
| Use plan deferral rate, Reset, Total deferral | Edit form | Added |
| Pre-tax and Roth explanations | Edit form | Added |
| Auto increase on/off | Edit form | Added |
| Increment cycle: calendar year, plan participant date, plan year, with next dates | Edit form | Added |
| "Choose source wise" with per-source increment and max limit | Edit form | Added |
| Opt out of paycheck deferral, with confirmation | Plan page header, re-enroll banner, "Opted out" status in the plan list | Added |
| Investments: plan-selected, own, risk-style modes | Investments tab, view and edit | Added |
| Auto rebalance, Self-Directed Brokerage opt-in, apply to all sources | Investments edit form | Added |
| Per-fund election table with CUSIP and type | Investments tab | Added |
| View plan investments: search, asset class filter, returns, expense ratio, per $1,000, shareholder fees, benchmark rows | Dialog and portfolio tab | Added |
| History: date, change, details, updated by | History tab, written to when anything changes | Added |

## Account summary and portfolio (`/account-summary`, `/investments`)

| 2.0 field | 3.0 | Status |
|---|---|---|
| Plan cards with plan ID, type, status, account and vested balance (2 plans) | Account summary | Added |
| Balance by source (11 sources), with percentages | Sources tab | Added |
| Balance by asset class | Investments tab | Added |
| Sortable columns, expandable holdings with NAV, units, value, "NAV as of" | Both tabs | Added |
| My portfolio, Plan investments, Self-Directed Brokerage tabs | Investments page tabs | Added |
| Asset class performance with 1M to 10Y periods and series checkboxes | My portfolio tab (bar chart and table) | Added |
| Investments table: name, asset class, CUSIP, YTD, invested, current, gain/loss, units, search, export | My portfolio tab | Added |
| SDB details: account number, type, updated on, updated through | SDB tab, shown after opting in | Added |

## Transactions (`/transactions`)

| 2.0 field | 3.0 | Status |
|---|---|---|
| New request types: loan, withdrawal, transfer, rebalance, rollover | Quick actions | Present |
| Requests tab | Request status tracker | Different |
| History: All / My Deferral / Employer / Other, plan filter, Generate statement, Date/Type/Plan/Amount | Account activity section | Added |
| **Loan:** loan type (3 options) | General, Home, Refinance, plus Educational | Different |
| **Loan:** reason for loan, take entire amount, interest rate, amount range, processing time | Simulator | Added |
| **Loan:** term in years and months, with 5-year maximum | Simulator and review | Added |
| **Loan:** repayment method, periodic payment, first repayment date, amortization schedule | Configuration | Present |
| **Loan:** repayment frequency, marital status | Configuration | Added |
| **Withdrawal:** 7 types, some marked "not available" | Hardship, In-service, Separation, RMD, One-time, Full balance, plus Permissible, Force-out, QBAD (shown as not available) | Added |
| **Transfer:** by percentage, units or amount | Amount step (Units added) | Added |
| **Transfer:** source-wise transfer | Amount step | Added |
| **Rebalance:** choose sources to rebalance (11 sources) | New first step | Added |
| **Rollover:** distributing plan name, type, account number | Plan details | Different |
| **Rollover:** trustee/custodian name, phone, address | Plan details and review | Added |

## Documents (`/documents`)

| 2.0 field | 3.0 | Status |
|---|---|---|
| Search by document name | Filters | Added |
| Plan name / ID filter | Filters | Added |
| Document type filter, multi-select: Annual Fee Disclosure, Quarterly Fee Disclosure, Summary Plan Description, Enrollment Notice, Investment & Fee Change Notice, Plan Document | Filters (plus statement, tax form, confirmation, plan notice) | Added |
| Documented from / to | Filters, with date validation | Added |
| Reset, Search, record count | Filters | Added |
| Generate new statement: plan and statement period | Dialog (also from Transactions and the dashboard) | Added |

## Retirement goal (`/retirement-goal`)

| 2.0 field | 3.0 | Status |
|---|---|---|
| Retirement location (used for state tax) | Select with estimated state tax note | Added |
| Planned retirement age | Stepper | Added |
| Monthly spending, annual salary, savings outside your 401(k) | Inputs | Added |
| Plan, pre-tax deferral, Roth deferral, auto increase | Inputs with sliders | Added |
| Readiness %, expected expense, all income, shortfall, retirement age, years remaining, deferrals, auto increase | Live results | Added |
| Disclaimer, Update, Cancel | Dialog and buttons | Added |

## Home, plans and learning

| 2.0 | 3.0 | Status |
|---|---|---|
| Plan states: Participating, Eligible, Not Eligible ("Provide elections in advance"), Opted Out ("Re-enroll") | Plan list | Added (Participating, Eligible and Not Eligible existed) |
| Quick links: add beneficiary, my documents, my portfolio, generate statement | Dashboard card | Added |
| Retirement readiness card | Launch button now opens the page | Added |
| Enrich library: featured path, topic filter, articles | `/enrich` with 8 short articles | Added |
| Enrollment: Set my deferral rate, Investment election, Review and confirm | Full flow and one-click page. See "One-click enrolment vs 2.0 enrolment" below | Added |

## One-click enrolment vs 2.0 enrolment

Walked through 2.0's three enrolment steps on 22 Oct 2026 as the demo participant Michael Harris (eligible, not enrolled) with sample values. I stopped before "Confirm enrollment" and declined the risk-questionnaire consent.

| 2.0 enrolment field | One-click page | Status |
|---|---|---|
| Pre-tax % and Roth % entered separately, any split | Contribution step: Pre-tax / Roth / Mix, plus "Set exact amounts" for a rate per source | Added |
| % / $ unit | Contribution step, "Set exact amounts"; per-source dollars per paycheck | Added |
| Use plan deferral rate | Contribution step, "Set exact amounts" | Added |
| Pre-tax and Roth explanations | Tax treatment cards (short) and "Set exact amounts" (full text) | Added |
| Total deferral | Rate stepper and "about $X per paycheck" | Present |
| Use / don't use auto increase | Auto increase card | Present |
| Increment cycle with next dates | Auto-increase step | Added |
| "Now 6% · next 7% on Jan 1" | Auto increase card | Added |
| Choose source wise: increment and max per source | Auto-increase step | Added |
| Plan-selected / own / risk style | Top of the Investments step; fund edits switch to "Choose my own funds" | Added |
| Risk questionnaire with consent | "Take the questionnaire" under the risk cards | Added (questions are 3.0's own) |
| Select investments with search, asset class, returns, expense ratio, per $1,000, shareholder fees, benchmarks | "View plan investments" dialog; funds are added from the dropdown | Different |
| Apply to all sources / separate Pre-tax and Roth elections | Checkbox and source tabs, shown when both sources are used | Added |
| Auto rebalance, SDB opt-in | Bottom of the Investments step | Added |
| Review and confirm with Edit links | The one-click page is the review; one button enrols | Different |
| SDB opt-in shows SDB investments (category, CUSIP, account no. or "not activated") | Ticking SDB lists 4 SDB funds with Add buttons; they also appear in "Add a fund" and "View plan investments" | Added |
| Track Traditional and Roth SDB separately (Yes / No) | Shown under SDB when both pre-tax and Roth are used | Added |

## Not captured, and not built

These need either an action I should not take on your behalf, or are outside what I could observe:

- **Risk questionnaire questions in 2.0.** The flow asks for consent first, and I declined it. The five questions and scoring in 3.0 are my own.
- **Beneficiary contact and bank sections in 2.0.** Validation blocks them until the first section is filled. 3.0's fields for these sections are my best match.
- **Later steps of each 2.0 transaction wizard** (loan payment and fee details, upload documents, summaries; withdrawal allocation and documents; rollover allocation, transaction details, documents). Stepping through needs values entered and, at the end, submission. I recorded the step names and first-screen fields only.
- **Outstanding loan balance and cash balance benefit cards** on the 2.0 home screen, and the Deferred Comp and Cash Balance plan types. 3.0's plan list has different plans and its dashboard has an Active Loan card.
- **Loan calculator** ("enter any two of amount, payment, term to compute the third").
- **Participant switcher** (2.0's "Prototype demo" menu with five personas).
- **Get help** in the 2.0 header only showed a tooltip.
- **E-notary and identity checks for beneficiaries**, which are separate roadmap items.
- **Branding and sample data** differ by design (LendGuard vs Core).
