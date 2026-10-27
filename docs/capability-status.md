# Core 3.0 participant portal: capability status

Prototype status against the 3.0 capability list, based on the `one-step-enrollment-version` branch.

**How to read this.** "Built" means a working screen in the prototype, not a production feature. Every new feature below keeps its data in the participant's browser and uses placeholder content. Nothing is connected to a backend, a recordkeeper or a vendor. Nothing has been committed.

## At a glance

| Status | Count | Capabilities |
|---|---|---|
| Built (prototype) | 8 | One-click enrolment, request status tracking, remaining contribution limits, service requests, adviser collaboration, documents center, fee report, proactive notifications |
| Partial | 6 | AI assistant, multi-lingual content, next-best actions, FAQs and plan guidance, communication preferences, better dashboard |
| Not started | 6 | IDology, address validation, bank account verification, digital beneficiary authentication, outside-asset linking, personalized guidance and financial health |

None of the forward-looking items or the four tracked backlog items has been started.

## 3.0 capabilities

| # | Capability | Status | What exists | What is missing |
|---|---|---|---|---|
| 1 | One-click enrolment | Built | `/enrollment/quick` is an enrolment agent: it checks eligibility and loads plan rules from one sample plan configuration (`agent/planConfig.ts`) through a simulated service, then prepares the plan beside a live summary with disclosures, explicit consent and a single "Confirm and enrol" (simulated submission with error, retry and confirmation states; choices kept for the session). As a conversation with CORE AI, It asks the "Start my enrolment" popup's questions (birth date, retirement age, location, savings, risk comfort) plus salary, or reuses the popup's answers, then shows its checks, streams the plan step by step with one-tap suggestions and a Change toggle on each step, and takes typed requests ("save 8%", "switch to Roth", "less risk", "what is an expense ratio?") from a message bar beside the Enrol button. Typed requests go to the language model (Groq, via the `enrol-intent` Netlify function) and every returned action is validated before it's applied; without the model, built-in English-first rules take over. Underneath: every field of the step-by-step flow (contribution %, pre-tax/Roth split, auto-increase on/off with amount and cap, risk profile, per-fund allocation) shown pre-filled and editable on one screen. One click enrols. "Customise" opens the full flow. Three numbered steps also carry the rest of the plan setup: exact pre-tax and Roth amounts in % or $ per paycheck, auto-increase timing and per-source increases and caps, investment approach (risk style, plan default, own funds), separate funds per source, auto rebalance, and a Self-Directed Brokerage opt-in that lists SDB investments. Each term has an ⓘ explanation. Entry link on the pre-enrollment dashboard. | Real save to the backend (untested; no Supabase locally). Compliance sign-off on the consent and disclosure wording. One fund allocation for all sources (different funds per source are only on the plan page). The full flow doesn't read back the saved fund percentages yet. Retirement readiness step is skipped. |
| 2 | AI assistant (voice and text) | Partial | Existing: chat panel, intent resolver, FAQ answers, guided flows, voice input via the browser's speech recognition. Not changed. | Voice output. LLM is called directly from the browser, which is not production-safe. |
| 3 | Multi-lingual content | Partial | English and Spanish (French was removed on request). All new screens are in both. | Spanish wording I added is mine and needs native review. Some existing Spanish strings are still English (for example the allocation "over / remaining" messages). Other languages. |
| 4 | Point-in-time transaction tracking | Built | "Request status" section on the Transaction Center. Stages per type (for example loan: submitted, under review, approved, check mailed, check delivered). All five flows record a request on submit. | A real status feed. Stage times are simulated on a fixed schedule. |
| 5 | IDology integration | Not started | | Vendor integration and a verification flow. |
| 6 | Online address validation | Not started | | Address service and a validation step in profile and checks. |
| 7 | Online bank account verification | Not started | | Verification provider (for example micro-deposits or instant verification) and UI. |
| 8 | Digital beneficiary authentication (e-notary) | Not started | | E-notary or e-signature provider and a flow in the beneficiaries panel. |
| 9 | View remaining contribution limits | Built | Card on the post-enrollment dashboard: remaining amount, pace, rate needed to max out, age-based catch-up, combined limit, employer match gap. | Real year-to-date contributions (currently estimated from rate and pay periods). Verify the 2026 limits. Roth catch-up rule for higher earners is not modelled. |
| 10 | Personalized next-best actions | Partial | Match-gap and limit-nearing nudges, shown in the limits card, banner and bell. | The existing Next Best Actions card is unchanged and hardcoded. There's no engine that ranks actions per participant. |
| 11 | Link outside assets (Manifest) | Not started | | Aggregation provider and a consolidated view. |
| 12 | Personalized guidance and financial health | Not started | Building blocks exist: limits, nudges, fee impact illustration, adviser recommendations (static). | A financial health score and guidance logic. |
| 13 | Create service requests | Built | `/service-requests`: new-request form with validation, request list with status timeline, notes, cancel. Entry from the user menu and the Documents page. | A case-management system. Attachments. Staff replies. Reopen. |
| 14 | Adviser or coach collaboration | Built | `/advisor`: secure-style messages, meeting booking, recommendations with done tracking, participant-controlled data-sharing consent. Dashboard Message and Schedule buttons now work. | A backend so the adviser actually receives messages and sees shared data. Real recommendations. Coach or multi-adviser support. In-portal video. |
| 15 | FAQs and plan guidance | Partial | FAQ answers inside the AI assistant, a public Help Center page, and a glossary of 14 plan terms (`src/features/learning/glossary.ts`): ⓘ explanations on the one-click enrolment page, and CORE AI answers "what is …" questions about them without the LLM. | A searchable in-portal FAQ section. |
| 16 | Communication preferences | Partial | Existing profile preferences panel. | I did not verify whether it saves anything. |
| 17 | Document availability online | Built | `/documents`: statements, tax forms, plan documents (SPD and others), confirmations. Search, category filter, "New" badge, PDF download. | A document store. Downloads are one-page sample PDFs. Form 1099-R. |
| 18 | Transparent fee reports | Built | `/fees`: total ongoing fees, breakdown, cost by fund, 20-year impact illustration, request fees, PDF summary. Linked from the Investments page. | Real fee schedule and holdings. No revenue-sharing, advisory fees or peer benchmark. |
| 19 | Proactive notifications on the homepage | Built | One feed (beneficiary, match gap, limit, request updates, adviser messages and meetings, service requests, statement) powering a dismissible banner and the header bell with read state. | Server-side feed and delivery by email, SMS or push. The beneficiary and statement items are placeholders. |
| 20 | Better dashboard | Partial | Notification banner, limits card, working adviser buttons. | The dashboard is mostly hardcoded sample data, and balances disagree across pages ($142,893, $287,451, $30,000). Needs real data and a design decision on "better". |

## Forward-looking and backlog

| Item | Status |
|---|---|
| Personalized decumulation strategies, annuity integrations | Not started |
| Participants entering tax withholding rates | Not started |
| Tax-aware recommendations | Not started |
| Immediate trading, continuous rebalancing | Not started (platform changes) |
| Plaid identity verification and AML | Not started (backlog) |
| Manifest auto rollovers | Not started (backlog) |
| Managed accounts integration | Not started (backlog) |
| Direct loan repayments | Not started (backlog) |

Several "not started" items share a verification layer (IDology, address validation, bank verification, Plaid identity and AML), so they are best scoped together.

## Cross-cutting findings

1. **No backend for the new features.** Messages, requests, tracking, documents and notification read state all live in browser storage. Moving them to Supabase or the recordkeeper is the largest remaining piece of work.
2. **Placeholder data.** Fee schedule, adviser, recommendations, statements, SLAs and the 2026 IRS limits need real sources or sign-off.
3. **Inconsistent sample balances** across dashboard, investments and transaction pages.
4. **Compliance decisions.** One-click consent wording, adviser data-sharing consent text, e-notary approach.
5. **Verification.** Typecheck passes and the new files lint clean. The repo had 14 existing lint errors before this work (for example in `AppShell.tsx` and `InvestmentStrategy.tsx`), which I left alone. There is no automated test runner. Login-gated pages were checked through temporary routes, now removed, and the browser pane was often minimized, so several screens were verified through the page rather than by sight. A visual pass in a real browser is still needed.
6. **Accessibility.** New screens use labels, roles and keyboard-friendly controls, but no formal accessibility review has been done.
7. **Repo state.** Changes are uncommitted. Untracked items not created by this work: `core-3-participant-portal-one-step-enrollment-version.zip` and an extracted folder of the same name in the project root. A `.claude/launch.json` I added for the preview server can be deleted.

## Where things are in the code

| Capability | Location |
|---|---|
| One-click enrolment | `src/features/enrollment/pages/QuickEnrollment.tsx`, `quickEnrollmentDefaults.ts`, `investmentCatalog.ts` |
| Contribution limits | `src/features/contributions/` |
| Request status tracking | `src/features/transactions/tracking/` |
| Notifications | `src/features/notifications/` |
| Documents | `src/features/documents/` |
| Fee report | `src/features/fees/` |
| Adviser collaboration | `src/features/advisors/collab/` |
| Service requests | `src/features/support/` |

## Suggested next steps

1. Decide the backend approach (Supabase tables or recordkeeper APIs) and move messages, requests and tracking onto it.
2. Get compliance review of the consent wording, the fee and limit figures, and the document set.
3. Scope the shared verification layer (IDology, address, bank, Plaid) as one workstream.
4. Replace hardcoded dashboard data with one balance source, then revisit "better dashboard".
5. Have a native speaker review the Spanish strings, and complete the untranslated existing ones.
