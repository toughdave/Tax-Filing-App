# Changelog

All notable changes to this project are documented in this file.
## [0.22.2] - 2026-03-06
### Security
- **JWT session expiration** — Enforce `maxAge` of 7 days on JWT sessions.
- **Path traversal prevention** — Add `safeLocalPath()` guard to all document storage file operations; sanitize uploaded file names (strip path separators and null bytes).
- **Open redirect protection** — Validate middleware callback URLs as relative paths only (reject `//`-prefixed).
- **Blob redirect validation** — Verify `https:` protocol before redirecting to blob storage URLs.
- **Content-Disposition sanitisation** — Escape `"`, `\r`, `\n` in file names used in download headers.
- **XSS in email templates** — Apply HTML entity escaping to all user-provided values interpolated into email HTML (name, status, provider, returnId, confirmationNumber).
- **Security headers** — Add `X-Download-Options: noopen` and `Cross-Origin-Opener-Policy: same-origin` to response headers.

### Changed
- **AGENTS.md** — Expanded Section 4 from 4 high-level rules to a full 35-point security checklist (10 subsections) for ongoing agent assessments and pre-release auditing.

## [0.22.1] - 2026-03-06
### Changed
- Version bump.

## [0.22.0] - 2026-03-05
### Added
- **CPP/EI individual calculation**: New `computeCppEi()` helper computes employee CPP credits, self-employed CPP deduction/credit split (half deductible, half as credit), and EI overpayment handling.
- **Education carry-forward in tax math**: `educationCarryForward` field now flows into non-refundable credit items for both individual and self-employed calculations.
- **Ontario ON-BEN refundable credits**: Property tax (10% credit), rent (20% credit), energy credit, and Northern Ontario energy now flow into refundable credit items in the calculation engine.
- CPP self-employed contributions automatically split: half added to deductions (Step 3), half to non-refundable credits (Step 5).

### Changed
- `calculateIndividualTax()` and `calculateSelfEmployedTax()` now call `computeCppEi()` and include Schedule 8 CPP fields and ON-BEN provincial fields in their respective item maps.

## [0.21.0] - 2026-03-05
### Added
- **Field-level conditions**: New `FieldCondition` interface and `condition` property on `TaxField`. Fields with conditions are only rendered when the referenced field's value matches one of the specified values (e.g. spouse amount only shown when marital status is married/commonLaw).
- **Medical-donations restructured**: Section now uses profile-flag-gated subsections: Medical expenses (`hasMedicalExpenses`), Charitable donations (`hasDonations`), Disability tax credit (`hasDisability`). Each subsection only appears when the user checked the corresponding profile flag.
- **Other-credits restructured**: Spouse/partner credits subsection (conditionally visible by marital status), Dependant credits subsection (gated by `hasDependants` profile flag). General credits remain as top-level fields.
- 10 new bilingual i18n keys (EN/FR) for subsection titles. Total: 583/583 parity.

### Changed
- `renderField()` now checks `field.condition` against `watchedValues` before rendering, enabling cross-field dynamic visibility.

## [0.20.0] - 2026-03-05
### Added
- **Provincial forms system**: New `src/lib/provincial-forms.ts` module provides province-keyed wizard section configs loaded dynamically when the user selects their province of residence.
- **Ontario ON428**: Provincial tax section with 5 fields (basic personal, spouse amount, age amount, donations credit, surtax).
- **Ontario ON-BEN**: Trillium Benefit section with 4 fields (property tax, energy credit, rent, Northern Ontario energy).
- Provincial sections automatically appear in the wizard timeline when Ontario is selected and disappear when province changes.
- 31 new bilingual i18n keys (EN/FR) for Ontario forms. Total: 573/573 parity.

### Changed
- `getWizardSections()` now accepts optional `provincialSections` parameter and appends them after federal sections (individual/self-employed only).
- `ReturnForm` derives `provincialSections` from `watchedValues.residencyProvince` via `getProvincialSections()`.

## [0.19.0] - 2026-03-05
### Added
- **Subsection rendering**: Wizard sections now support nested subsections (`FormSubsection`) with their own titles, descriptions, and fields. Subsections render as bordered cards inside their parent section, filtered by `mode` and `profileFlag`.
- **Schedule 8 (CPP contributions)**: New subsection under Deductions with 3 fields (`cppPensionableEarnings`, `cppEmployeeContributions`, `cppSelfEmployedContributions`), gated to `SELF_EMPLOYED` mode.
- **Education carry-forward field**: New `educationCarryForward` field (Line 32700) under a new "Additional education credits" subsection in Schedule 11.
- **Deductions restructured into subsections**: Family & dependant deductions, Other deductions, and CPP contributions are now grouped as subsections under the main Deductions section.
- 20 new bilingual i18n keys (EN/FR): subsection titles, Schedule 8 fields, education carry-forward. Total: 542/542 parity.

### Changed
- `allSectionFields()` helper aggregates fields from both section and subsections for completeness checks and payload serialization.
- `isSectionComplete()` and `countMissingRequired()` now include subsection fields.

## [0.18.0] - 2026-03-05
### Fixed
- **Responsive header navigation**: Desktop nav and mobile nav no longer display simultaneously. Added CSS media queries to toggle `.desktop-nav` / `.mobile-nav` visibility at 640px breakpoint.
- **Yes/No radio toggle fields**: Fields that ask yes/no questions (EI benefits, donations, medical expenses, child care, etc.) now render as radio button toggles instead of bare number inputs. Selecting "Yes" reveals the amount input with a branded left-border accent; "No" hides it. 24 fields converted to `promptType: "yesno"`.
- **Missing friendly labels**: Added conversational question-style labels to 8 fields that were still showing generic CRA form labels (`ageAmount`, `pensionIncomeAmount`, `refundableMedical`, `spouseAmount`, `eligibleDependantAmount`, `canadaCaregiverAmount`, `cppEiOverpayment`, `canadaWorkersAmount`).
- **Province selector missing options**: `residencyProvince` field in wizard now correctly includes `PROVINCES` options array.

### Added
- `promptType` property on `TaxField` interface for conditional field rendering patterns.
- `yesNoState` React state in `ReturnForm` to track toggle state, initialized from existing payload values.
- 11 new bilingual i18n keys (EN/FR): 8 friendly labels + 3 yes/no UI strings. Total: 522/522 parity.

## [0.17.2] - 2026-03-05
### Fixed
- **Single-column vertical field layout**: All form fields now stack vertically in a single column instead of the previous multi-column grid. Improves readability and scrollability on both mobile and desktop.
- **Inline accordion form content**: Each wizard step's form content now renders directly inside its corresponding timeline item as an expandable accordion body, instead of appearing as a separate card below the timeline. Clicking a timeline header expands the form inline beneath it.

### Changed
- Refactored `renderTimeline()` into two functions: `renderStepContent()` (returns JSX per step) and `renderTimeline()` (builds the full accordion). Main component return now delegates entirely to `renderTimeline()`.
- Review step section icons now render as Lucide icons instead of raw string names.

## [0.17.1] - 2026-03-05
### Added
- **Friendly conversational field labels**: 35 new question-style labels (EN/FR) for form fields. Instead of "Employment income", users see "How much did you earn from your job(s) this year?" with the official CRA term shown below as context.
- **CRA line number references**: All income, deduction, and credit fields now display their CRA line number (e.g. "Line 10100") below the label, helping users cross-reference with their T4 slips and CRA documents.
- **Extended data model**: `TaxField` now supports `craLine` and `friendlyLabelKey`. `WizardSection` supports `craFormRef` (e.g. "T1-Step2", "Schedule 11") and optional `subsections` array. New `FormSubsection` interface for nested grouping.

### Changed
- 35 new bilingual i18n keys (EN/FR): all `friendly*` conversational labels. Total: 511/511 parity.
- Field rendering shows friendly label as primary, official CRA label + line number as secondary context underneath.

## [0.17.0] - 2026-03-05
### Added
- **Vertical accordion timeline**: Replaces the old horizontal icon-only stepper with a vertical timeline layout. Each section shows as a node on a connecting line with expand/collapse navigation. Works identically on mobile and desktop — text labels always visible alongside icons.
- **Lucide React monochrome icons**: All wizard section icons switched from emojis to a consistent flat monochrome icon set via `lucide-react`. New `LucideIcon` component wraps the icon map for easy reuse across the app.
- **CRA Form Redesign master plan**: Comprehensive 6-phase plan at `.windsurf/plans/cra-form-redesign-plan.md` covering CRA T1 alignment, provincial form integration (ON428, ON-BEN), conversational field labels, deep dynamic branching, and calculation engine upgrades.

### Changed
- **Icon migration**: 16 wizard section icons replaced (user, home, briefcase, trending-up, building, award, file-text, clipboard-list, graduation-cap, heart, sparkles, credit-card, landmark, dollar-sign, users, calculator). Stepper meta-steps use settings, target, paperclip, check-square.
- **Timeline CSS**: New `.timeline`, `.timeline-item`, `.timeline-node`, `.timeline-header`, `.timeline-body` CSS classes with light/dark mode support, smooth transitions, and completion/missing status badges.
- Dependency: added `lucide-react`.

## [0.16.0] - 2026-03-05
### Added
- **"Next" button on section forms**: Users can now skip sections without being blocked by mandatory field validation. "Save & Continue" still validates and saves; "Next →" simply advances to the next section.
- **Persistent site footer**: Privacy Policy, Terms of Service, and copyright links now appear on every page (previously only on landing page). New `SiteFooter` shared component.
- **Dynamic nav label**: "Start a return" nav link changes to "Filing forms" (highlighted) when user is on any `/returns/*` page.

### Changed
- **Documents & imports moved early**: The supporting documents, tax slip import, and NOA import sections now appear *before* manual form sections in the wizard flow (Setup → Profile → Documents → Sections → Review). This lets uploaded documents and CRA imports autofill fields before users fill them manually.
- **Wizard flow reorder**: Setup → Profile → Documents/Imports → Form Sections → Review & Submit. Back/forward navigation updated throughout.
- **Eyebrow pill**: "Canada-only • CRA-focused" replaced with 🍁 CRA / 🍁 ARC (bilingual).
- 4 new bilingual i18n keys (EN/FR): `navFilingForms`, `wizardNext`.

## [0.15.1] - 2026-03-05
### Fixed
- **Wizard navigation blocked on incomplete sections**: "Save & Continue" now validates all required fields via `react-hook-form` `trigger()` before advancing. If required fields are empty, an error message is shown and the user stays on the current section.
- **Save failure no longer advances**: If the API save fails, the wizard stays on the current section instead of silently moving forward.
- **Stepper completion checkmarks**: Green checkmarks (✓) now only appear when a section has been both saved AND all required fields are filled. Previously sections were marked complete unconditionally on navigation.
- **Review page section indicators**: Sections with missing required fields show a red "!" badge with a count of missing fields. Unsaved sections show "Not yet saved". Only fully completed sections show the green "Complete" badge.

### Changed
- **CRA-essential fields now required**: Employment income, rental income, pension income, tuition, and total income tax deducted are now marked as required in their respective wizard sections — matching CRA filing requirements.
- 3 new bilingual i18n keys (EN/FR): `wizardSectionIncomplete`, `wizardMissingFields`, `wizardNotSaved`.

## [0.15.0] - 2026-03-05
### Added
- **Multi-section wizard flow**: TurboTax-inspired guided tax filing experience. Users progress through focused sections one at a time instead of a single long form. Section stepper with completion indicators (checkmarks), section-by-section auto-save on "Continue".
- **Dynamic profile branching**: "Tell us about your situation" profile step with 8 flags (student, retired, investments, rental income, medical, donations, disability, dependants). Selecting flags dynamically shows/hides relevant sections (e.g., checking "I'm a student" reveals Education section with tuition and student loan fields).
- **Dropdown selects for limited-answer fields**: Province of residence (13 provinces/territories), marital status (6 CRA-defined options), and tax year now use proper `<select>` dropdowns instead of free-text inputs.
- **Active nav highlighting**: Current page is visually indicated in the site header navigation with brand color and background. Uses middleware `x-pathname` header for server-component detection.
- **84 new bilingual i18n keys** (EN/FR): 13 provinces, 6 marital statuses, 3 tax years, 8 profile flags with help text, 16 wizard section titles/descriptions, 10 wizard UI labels.
- Wizard stepper CSS with light/dark mode support, responsive layout (icons-only on mobile, full labels on desktop).

### Changed
- `tax-field-config.ts`: Extended `FieldType` to include `"select"`, added `SelectOption`, `ProfileFlag`, and `WizardSection` interfaces. Province and marital status fields now use select type with predefined options. Added `getWizardSections()` for dynamic section filtering by filing mode and profile flags.
- `return-form.tsx`: Complete rewrite from flat form to multi-step wizard with setup → profile → sections → documents → review flow.
- `site-header.tsx`: Reads `x-pathname` from request headers for active nav link detection. Both desktop and mobile navs highlight current page.
- `middleware.ts`: Now sets `x-pathname` header on all requests for server-component page detection.

## [0.14.0] - 2026-03-05
### Added
- **Document management UI**: Inline document upload, list, and delete within the return form. Category selection (T4, T5, Receipt, Business Statement, NOA, Other), file size display, date formatting, and delete confirmation.
- **PDF generation**: Downloadable tax return summary PDFs via `/api/returns/[returnId]/pdf`. Includes return info, taxpayer data, full tax summary with federal/provincial breakdown. "Download PDF Summary" button in return form.
- **Year-over-year comparison**: `/api/returns/[returnId]/compare` endpoint and `YoyComparison` client component. Field-level diff table (added/removed/changed/unchanged), summary delta cards for key metrics (income, tax, balance owing), toggle to show/hide unchanged fields.
- **Dark mode**: Full CSS variable-based dark theme via `[data-theme="dark"]` selector. Theme toggle button (☀️/🌙) in site header with localStorage persistence. Dark overrides for surfaces, buttons, form fields, notices, tables, and pills.
- **E2E test framework**: Playwright setup with `playwright.config.ts`, smoke tests for public pages, auth-gated redirects, dark mode persistence, mobile responsiveness, and API auth guards. Scripts: `npm run e2e`, `npm run e2e:ui`, `npm run e2e:install`.
- **Tax slip import stub**: "Import Tax Slips" section with drag-and-drop placeholder and "Coming soon" badge. Future CRA My Account / OCR integration point.
- **NOA import stub**: "Notice of Assessment" section with disabled "Connect to CRA My Account" button and "Coming soon" badge.
- 36 new bilingual i18n keys (EN/FR) for YoY comparison, PDF, dark mode, import stubs.

### Changed
- `tax-return-service.ts`: Added `getYearOverYearComparison()` service function with field-level diff and summary comparison.
- Return form now includes DocumentPanel, TaxSlipImportStub, NoaImportStub, and PDF download button.
- Return detail page includes YoyComparison component below the form.
- `.gitignore`: Added Playwright artifacts (`test-results/`, `playwright-report/`) and `.uploads/`.
- Plan file updated: Phase 7 marked COMPLETE (v0.13.0), Phase 8+9 IN PROGRESS.
- 207 tests (19 files). Quality gates: typecheck ✓ lint ✓ tests ✓ build ✓.

## [0.13.0] - 2026-03-05
### Added
- **Email infrastructure via Resend**: Transactional email system with three bilingual (EN/FR) templates:
  - **Filing confirmation**: Sent after each save with status, missing field count, and deep link to return.
  - **Submission confirmation**: Sent after successful CRA submission with confirmation number and provider.
  - **Welcome / sign-in notification**: Welcome email for new users; sign-in alert for existing users with provider info.
  - Graceful degradation: all email sends are fire-and-forget; app works fully without `RESEND_API_KEY`.
  - 12 new email service tests covering all templates, error handling, and disabled-state behavior.
- **Landing page redesign**: New hero section with centered CTA, stats bar (13 provinces, 3 tax years, 44+ field mappings, AES-256-GCM), "How it works" 3-step section, trust signals checklist (PIPEDA, bilingual, audit trail, MFA, open-source, no tracking).
- **Mobile-responsive CSS**: Touch-friendly 44px minimum targets for buttons and inputs, single-column grid on small screens, responsive table cells, and tighter container width on mobile.
- 20 new bilingual i18n keys (EN/FR) for landing page stats, how-it-works steps, and trust signals.

### Changed
- `prepareSubmissionForUser` now includes `taxYear` in its return value for downstream use.
- README updated from v0.1.0 to v0.13.0 with comprehensive current feature summary.
- 207 tests (19 files). Quality gates: typecheck ✓ lint ✓ tests ✓ build ✓.

## [0.12.4] - 2026-03-05
### Fixed
- **Encrypted PII leaking in save API response**: `saveReturnForUser` upsert select included `data: true`, sending encrypted PII ciphertexts to the client. Removed `data` and `taxSummary` from the upsert select since the client only uses `record.id` and `record.status`. Reduces API response size and eliminates unnecessary encrypted data exposure.
- **Server-side `sinLast4` validation gap**: Added `z.string().regex(/^\d{4}$/)` validation for `sinLast4` in `payload-schema.ts`. Previously only the client enforced the 4-digit pattern; now the server rejects malformed SIN values at the Zod layer (defense-in-depth).
- **Redundant tax recalculation on return detail page**: The return detail page now uses the persisted `taxSummary` from the database instead of recalculating from the full payload on every page load. Falls back to recalculation only for legacy records without a persisted summary.

## [0.12.3] - 2026-03-05
### Fixed
- **End-to-end data flow bug**: PII encryption ciphertexts (`enc:***`) were inadvertently being passed to the preflight checker, tax calculation engine, and NETFILE XML builder during the `prepareSubmissionForUser` step. The payload is now decrypted immediately after reading from the database and before processing submission logic.

## [0.12.2] - 2026-03-05
### Added
- **Real-time client-side Zod validation**: Return form fields now validate on blur with inline error messages. Required fields show "This field is required", number fields validate numeric input, and `sinLast4` enforces exactly 4 digits. Errors display in red with `role="alert"` and `aria-invalid`/`aria-describedby` for accessibility.
- Bilingual EN/FR validation message i18n strings.
- Database schema pushed: `taxSummary Json?` column applied to production via `prisma db push`.
- 195 tests total (18 files). Quality gates: typecheck ✓ lint ✓ tests ✓ build ✓.

## [0.12.1] - 2026-03-05
### Added
- **Vercel Blob document storage**: Document uploads now use `@vercel/blob` when `BLOB_READ_WRITE_TOKEN` is set, with local filesystem fallback for development. Downloads redirect to blob URLs in production.
- **Field-level PII encryption**: `legalName`, `sinLast4`, and `birthDate` are now AES-256-GCM encrypted at rest in the `TaxReturn.data` JSON column. Transparent encrypt-on-save / decrypt-on-read via `pii-crypto.ts` module. Uses `PII_ENCRYPTION_KEY` env var (falls back to `NEXTAUTH_SECRET`).
- 11 new PII crypto tests covering encrypt/decrypt round-trips, empty strings, unicode, double-encrypt prevention, field-level batch operations.
- 195 tests total (18 files). Quality gates: typecheck ✓ lint ✓ tests ✓ build ✓.

### Changed
- `document-service.ts` refactored: `uploadDocument` uses `@vercel/blob` `put()`, `deleteDocument` uses `del()`, `getDocumentForDownload` returns `isBlob` flag for URL-based or file-based download.
- Document download API route redirects to blob URL when document is stored in Vercel Blob.
- `saveReturnForUser` encrypts PII fields before DB write; `getReturnForUser` decrypts after read.
- Carry-forward source data is decrypted before merge to ensure plaintext profile fields for tax calculation.

## [0.12.0] - 2026-03-05
### Added
- **Provincial tax data in NETFILE XML**: The XML builder now includes a `<TaxCalculation>` section with federal tax, provincial tax breakdown (province code, gross provincial tax, BPA credit, non-refundable credits, surtax, net provincial tax), total tax, and balance owing.
- **Tax summary persistence**: Computed tax summaries are now stored in the database (`taxSummary` JSON column on TaxReturn) alongside user data, eliminating the need to recalculate on every page load.
- **Data request history UI**: Account Settings page now displays a table of submitted data requests (export/deletion) with type, status, and date — powered by the existing GET `/api/account/data-request` endpoint.
- **Privacy Policy page** (`/privacy`): Bilingual EN/FR page covering data collection, usage, storage, sharing, PIPEDA rights, retention, cookies, and contact. Required by PIPEDA and OAuth providers.
- **Terms of Service page** (`/terms`): Bilingual EN/FR page covering acceptance, service description, user responsibilities, accuracy/liability, prohibited use, termination, governing law.
- Footer links to Privacy Policy and Terms of Service on the home page.
- **Loading states**: Skeleton screens for dashboard, return detail, and account pages via Next.js `loading.tsx` streaming.
- **Accessibility improvements**: Skip navigation link in root layout, `id="main-content"` targets on key pages, ARIA labels on navigation elements (`aria-label` on desktop and mobile nav).
- **Filing flow progress meter**: Real-time section completion indicator in the return form showing filled vs. required fields per section with visual progress bar and per-section status pills.
- Bilingual EN/FR i18n strings for all new features (data request history, privacy/terms pages, progress meter).
- 2 new NETFILE provincial XML tests (with and without provincial data).
- 184 tests total (17 files). Quality gates: typecheck ✓ lint ✓ tests ✓ build ✓.

### Changed
- `SubmissionPackage` interface now includes optional `taxSummary` with provincial detail for XML serialization.
- `prepareSubmissionForUser` computes and passes tax summary to submission providers.
- `getReturnForUser` now includes `taxSummary` in its select.
- Prisma schema: added `taxSummary Json?` column to `TaxReturn` model.

## [0.11.0] - 2026-03-05
### Added
- **Robust carry-forward data mapping**: Prior-year data is now filtered to only carry forward stable profile/identity fields (name, SIN, DOB, province, marital status, dependants, company identity). Year-specific amounts (income, deductions, credits, payments, corporate financials) are no longer blindly carried forward.
- New `carry-forward-config.ts` module with `buildCarryForwardData` (filtered extraction), `computeCarryForwardDiff` (carried/new/changed diff), and `isCarryForwardField` helpers.
- `saveReturnForUser` now returns `carryForwardDiff` array showing which fields were carried unchanged, changed from prior year, or are new this year — enabling a "What changed?" UI step.
- Bilingual EN/FR i18n strings for carry-forward diff labels (profile carried, changed, new, prior/current values).
- Year-over-year field key migration infrastructure (`migrateFieldKeys`) for handling internal field key renames between app versions; runs automatically during carry-forward.
- "What changed?" diff panel in the return form UI — shows carried-forward unchanged fields, changed fields (prior → current), and new fields after save.
- 21 new carry-forward tests covering field filtering, exclusion of income/deductions/credits/payments, company identity carry-forward, diff computation, field key migration, and integration with `saveReturnForUser`.
- 182 tests total (17 files). Quality gates: typecheck ✓ lint ✓ tests ✓ build ✓.

## [0.10.1] - 2026-03-05
### Fixed
- **Tax Calculation Engine Accuracy Audit Fixes**:
  - Implemented the **Basic Personal Amount (BPA) income scaling** logic for 2023, 2024, and 2025. High earners now see their BPA correctly reduced down to the minimum (e.g., scaled down from $15,705 to $14,156 for net income between $173,205 and $246,752 in 2024).
  - Implemented the **2024 Capital Gains Inclusion Rate changes**: 
    - Individuals: 1/2 inclusion up to $250,000; 2/3 inclusion on the portion above $250,000 (starting 2024).
    - Corporations: 2/3 inclusion on all capital gains (starting 2024).
  - Implemented the **Quebec Abatement**: 16.5% reduction of basic federal tax for Quebec residents (Line 44000).
- **NETFILE Provider**: Updated the XML builder to include all newly added tax fields (interest, dividends, capital gains, rental, pension, EI benefits, and all new deductions/credits).

## [0.10.0] - 2026-03-04
### Added
- **Provincial / territorial tax calculations** for all 13 Canadian provinces and territories (Form 428 equivalent).
  - Ontario (with surtax: 20% over $4,991 + 36% over $6,387), British Columbia (7 brackets), Alberta (5 brackets), Saskatchewan, Manitoba, Quebec, New Brunswick, Nova Scotia, Prince Edward Island, Newfoundland & Labrador (7 brackets), Northwest Territories, Nunavut, Yukon.
  - Provincial basic personal credits computed at each province's lowest marginal rate.
  - Provincial non-refundable credits applied proportionally.
- New `provincial-tax-config.ts` module with `ProvincialTaxParams` interface, bracket data for 2024 (2025 inherits until CRA publishes indexed amounts), and `getProvincialTaxParams` / `getSupportedProvinces` helpers.
- `TaxSummary` expanded with `provincial` (ProvincialTaxDetail | null), `totalTax` (federal + provincial combined).
- `balanceOwing` now reflects combined federal + provincial tax minus refundable credits and payments.
- Bilingual EN/FR i18n for all provincial tax summary labels.
- 9 new provincial tax tests covering ON (with surtax), BC, AB, QC, SK (self-employed), unknown province fallback, and combined balance owing verification.
- 161 tests total (16 files). Quality gates: typecheck ✓ lint ✓ tests ✓ build ✓.

## [0.9.0] - 2026-03-04
### Security
- **XML escaping** in NETFILE provider: all user-supplied values now escaped with 5 standard XML entities to prevent injection.
- **Document upload ownership verification**: `returnId` is now validated against the authenticated user before document attachment, preventing cross-user document linking.
- Preflight checks now integrated into `prepareSubmissionForUser` flow — submissions cannot bypass validation.

### Added
- **Comprehensive CRA T1 field coverage** for maximizing refund opportunities:
  - **Income sources**: interest/investment (12100), dividends (12000), capital gains with 50% inclusion (12700), rental (12600), pension (11300–11600), EI benefits (11900).
  - **Deductions**: FHSA (20805), union/professional dues (21200), child care (21400), moving expenses (21900), support payments (22000), carrying charges (22100), northern residents (25500).
  - **Non-refundable credits**: age amount (30100), spouse/partner (30300), eligible dependant (30400), Canada caregiver (30450), disability (31600), CPP/EI overpayment (Sched 8), Canada employment (31260), home buyers' (31270), pension income (31400), student loan interest (31900), donations (34900).
  - **Refundable credits & payments**: Canada workers benefit (45300), Canada training credit (45350), refundable medical supplement (45200), tax paid by instalments (47600), total income tax deducted (43700).
- Tax calculation engine expanded with `nonRefundableCredits`, `refundableCredits`, `totalPayments`, and `balanceOwing` fields.
- CRA form-line mappings expanded to 44 individual field mappings per tax year, with Schedule 3, 6, 9, 11 forms added.
- Provider-specific error mapping: preflight failures (422), provider not configured (503), mode mismatch (422).
- UI handles REJECTED submission status with specific error message display.
- Bilingual EN/FR i18n for all new fields, credits, error messages, and group titles.
- Preflight income check now recognizes all 10 income source types.
- 152 tests total (16 files) — new tests for XML escaping (5), expanded calculation engine (7), preflight income sources (2).

### Changed
- `TaxSummary` breakdown now includes `creditItems`, `refundableCreditItems`, and `paymentItems`.
- `medical` and `tuition` moved from deductions to non-refundable credit items (matching CRA T1 structure).
- Preflight checks run automatically before provider.prepare() — no longer optional.


## [0.8.0] - 2026-03-04
### Added
- **Phase 3 — E-filing integration**
  - CRA form-line mapping system (`cra-form-mapping.ts`) for T1, T2125, T2 forms, versioned by tax year (2024/2025).
  - Tax-year-versioned field configuration (`tax-year-config.ts`) with federal brackets, BPA, RRSP/TFSA limits, CPP/EI thresholds for 2023–2025.
  - Tax calculation engine refactored to use dynamic year-based parameters instead of hardcoded 2024 values.
  - Document attachment system: Prisma `Document` model, `DocumentCategory` enum, upload/list/download/delete service and API endpoints (`/api/documents`, `/api/documents/[docId]`).
  - Production e-filing provider interfaces: `NetfileCraProvider` (NETFILE XML for T1 filings) and `EfileCraProvider` (EFILE JSON for all filing modes).
  - Provider factory (`getSubmissionProvider`) selects sandbox/netfile/efile via `EFILING_PROVIDER` env var or explicit override.
  - Filing preflight check system (`filing-preflight.ts`) with 8 pre-submission validations: tax year support, form mapping, required fields, identity, province, income, documents, and company-specific checks.
- **Phase 4 — Company depth expansion**
  - Corporate field groups expanded: fiscal year-end (required), capital cost allowance, retained earnings.
  - Payroll reconciliation field group: employee count, CPP contributions, EI premiums, income tax withheld.
  - GST/HST remittance field group: collected, paid (ITCs), net remittance.
  - Tax calculation engine expanded with `PayrollSummary` and `GstHstSummary` in corporate calculations.
  - CCA included as a corporate deduction item.
- Bilingual (EN/FR) i18n strings for all new fields, groups, document UI, preflight, payroll, and GST/HST summaries.
- 22 new unit tests: CRA form mapping (9), tax year config (7), filing preflight (6).
- Expanded submission provider tests (7 total): sandbox, netfile, efile factory and config checks.
- Prisma migration for `Document` table with user/return foreign keys and category index.

### Security
- Document uploads validated: 10 MB max size, restricted MIME types (PDF, JPEG, PNG, WebP, CSV).
- Document API endpoints protected with auth, rate limiting, CSRF, and audit logging.
- E-filing provider credentials read from env vars only — never hardcoded.
- NETFILE provider rejects COMPANY mode filings (T1 individual/self-employed only).

## [0.7.0] - 2026-03-04
### Added
- Two-factor authentication (TOTP) support via authenticator apps (Google Authenticator, Authy, etc.).
- `TotpDevice` Prisma model with AES-256-GCM encrypted secrets and recovery codes.
- MFA enrollment flow: QR code generation, manual secret entry, 6-digit verification.
- 8 single-use recovery codes generated per enrollment for backup access.
- `POST /api/account/mfa/enroll` — starts TOTP enrollment with QR code.
- `POST /api/account/mfa/verify` — confirms enrollment with a valid TOTP token.
- `POST /api/account/mfa/disable` — disables MFA with audit logging.
- `GET /api/account/mfa/challenge` — checks if MFA is enabled for current user.
- `POST /api/account/mfa/challenge` — verifies TOTP token or recovery code.
- MFA setup component integrated into account settings page.
- Bilingual (EN/FR) i18n strings for all MFA UI elements.
- TOTP utility with secret generation, URI building, token verification, AES-256-GCM encryption/decryption.
- 8 unit tests for TOTP utility (encryption roundtrip, secret generation, recovery codes).
- 11 unit tests for MFA service (enrollment, confirmation, disable, challenge, recovery codes).
- Prisma migration for `TotpDevice` table.

### Security
- TOTP secrets encrypted at rest using AES-256-GCM derived from NEXTAUTH_SECRET.
- Recovery codes are single-use and removed from the database after consumption.
- MFA disable action generates an audit event with request metadata.
- All MFA endpoints are rate-limited and CSRF-protected.

## [0.6.0] - 2026-03-04
### Added
- Admin/operator support dashboard (`/admin`) with role-based access control (SUPPORT/ADMIN roles only).
- PII masking utility (`pii-mask.ts`) — masks emails, names, and IP addresses in admin views.
- Admin guard utility (`admin-guard.ts`) — reusable session + role check returning 401/403 for unauthorized access.
- `GET /api/admin/recovery-requests` — lists recovery requests with masked PII.
- `GET /api/admin/data-requests` — lists data export/deletion requests with masked user emails.
- `GET /api/admin/audit-log` — lists recent audit events with masked emails and IPs.
- Tabbed admin dashboard UI (Recovery requests, Data requests, Audit log) with bilingual i18n.
- 10 unit tests for PII masking utility.
- `/admin` added to protected routes in auth middleware.

### Security
- All admin API endpoints enforce SUPPORT/ADMIN role check via `requireAdminSession()`.
- PII is never exposed in admin views — emails, names, and IPs are masked by default.
- Admin API endpoints are rate-limited and CSRF-protected via `guardApiRoute`.

## [0.5.0] - 2026-03-04
### Added
- Account recovery flow for users who lose access to their OAuth provider.
- `RecoveryRequest` Prisma model with status tracking (SUBMITTED → UNDER_REVIEW → APPROVED/DENIED).
- `POST /api/account/recovery` endpoint with strict rate limiting (3 req/5 min per IP) and CSRF protection.
- Public `/recovery` page with bilingual form (email, full name, reason).
- Recovery form component with status feedback (success, already exists, error).
- "Lost access to your account?" link on sign-in page pointing to recovery.
- Recovery service with idempotent request creation and email normalization.
- 5 unit tests for recovery service.
- Prisma migration for `RecoveryRequest` table and indexes.

### Security
- Recovery endpoint has tighter rate limits than standard API routes (3 req/5 min vs 30 req/min).
- Recovery requests log IP address and user-agent for audit trail.
- Duplicate pending recovery requests are prevented per email.

## [0.4.0] - 2026-03-04
### Added
- Consent management system with `ConsentRecord` Prisma model tracking user agreement to Terms of Service, Privacy Policy, and Data Processing.
- Consent banner component — appears for authenticated users who haven't yet accepted current consent versions.
- `GET /api/consent` and `POST /api/consent` endpoints for checking and recording consent.
- Data retention controls with `DataRequest` Prisma model for EXPORT and DELETION requests.
- `GET /api/account/data-request` and `POST /api/account/data-request` endpoints for submitting data requests.
- Account settings page (`/account`) showing consent status and data request controls.
- Account nav link in site header for authenticated users.
- Bilingual (EN/FR) i18n strings for all consent and account management UI.
- Consent service with version tracking, grant/revoke logic, and idempotent data request creation.
- 9 unit tests for consent service covering all CRUD operations.
- Prisma migration for `ConsentRecord`, `DataRequest`, and related enums.

### Changed
- `/account` added to protected routes in auth middleware.
- Root layout now renders `ConsentBanner` globally for all pages.

### Security
- Consent records include IP address and user-agent for audit trail.
- Data requests are rate-limited and CSRF-protected via `guardApiRoute`.
- Duplicate pending data requests are prevented (idempotent).

## [0.3.0] - 2026-03-04
### Added
- Auth middleware for protected page redirects (`/dashboard`, `/returns/*`) — unauthenticated users are redirected to `/sign-in` with `callbackUrl`.
- In-memory rate limiting on all API routes (30 req/min per IP) with `Retry-After` header on 429 responses.
- CSRF origin validation on mutating API requests (POST/PUT/PATCH/DELETE).
- Shared `guardApiRoute` helper combining rate limit + CSRF checks for DRY route protection.
- Unit tests for rate limiter (4 tests) and CSRF validator (7 tests).

### Changed
- All `/api/returns` routes now run rate limit and CSRF checks before auth/business logic.
- Middleware matcher unchanged; auth check runs before CSP/nonce generation for protected routes.

### Security
- Protected routes no longer render for unauthenticated users — immediate redirect at edge.
- API abuse surface reduced via per-IP sliding-window rate limiter.
- Cross-origin mutating requests blocked by origin header validation.

## [0.2.0] - 2026-03-04
### Added
- Return detail retrieval endpoint: `GET /api/returns/:returnId`.
- Return resume UI route: `/returns/:returnId` with prefilled filing data.
- Auth policy helpers for environment-aware provider enablement.
- Vercel preview deployment workflow at `.windsurf/workflows/vercel-preview-deploy.md`.
- New tests for auth policy and audit request metadata extraction.
- Mandatory version bump rule in `AGENTS.md` CI/CD section.

### Changed
- Dashboard "Open" action now targets the selected return record.
- Demo credentials provider is disabled in production unless explicitly enabled.
- `/api/returns` listing now returns summary fields only (reduced PII exposure).
- Not-found and error boundaries now use EN/FR localized text.
- Middleware now emits nonce-based CSP and locale headers.
- Audit metadata extraction now validates/sanitizes IP and user-agent values.
- CI security scan split into strict (production deps) and advisory (all deps) steps.

### Security
- Added auth-route boundary audit events with request metadata.
- Removed static `'unsafe-inline'` script CSP policy from `next.config.ts` in favor of nonce-based middleware CSP.

## [0.1.0] - 2026-03-03
### Added
- Initial Next.js fullstack foundation for Canada-focused tax filing.
- OAuth-ready authentication architecture with secure session handling.
- Guided bilingual (EN/FR) filing UX for individual, self-employed, and company paths.
- Prisma data model for user profiles, tax returns, and audit events.
- CI/CD baseline plan with lint, typecheck, test, build, and security scan steps.
- OAuth-ready authentication architecture with secure session handling.
- Guided bilingual (EN/FR) filing UX for individual, self-employed, and company paths.
- Prisma data model for user profiles, tax returns, and audit events.
- CI/CD baseline plan with lint, typecheck, test, build, and security scan steps.
- OAuth-ready authentication architecture with secure session handling.
- Guided bilingual (EN/FR) filing UX for individual, self-employed, and company paths.
- Prisma data model for user profiles, tax returns, and audit events.
- CI/CD baseline plan with lint, typecheck, test, build, and security scan steps.
- OAuth-ready authentication architecture with secure session handling.
- Guided bilingual (EN/FR) filing UX for individual, self-employed, and company paths.
- Prisma data model for user profiles, tax returns, and audit events.
- CI/CD baseline plan with lint, typecheck, test, build, and security scan steps.
- OAuth-ready authentication architecture with secure session handling.
- Guided bilingual (EN/FR) filing UX for individual, self-employed, and company paths.
- Prisma data model for user profiles, tax returns, and audit events.
- CI/CD baseline plan with lint, typecheck, test, build, and security scan steps.
- OAuth-ready authentication architecture with secure session handling.
- Guided bilingual (EN/FR) filing UX for individual, self-employed, and company paths.
- Prisma data model for user profiles, tax returns, and audit events.
- CI/CD baseline plan with lint, typecheck, test, build, and security scan steps.
- OAuth-ready authentication architecture with secure session handling.
- Guided bilingual (EN/FR) filing UX for individual, self-employed, and company paths.
- Prisma data model for user profiles, tax returns, and audit events.
- CI/CD baseline plan with lint, typecheck, test, build, and security scan steps.
- OAuth-ready authentication architecture with secure session handling.
- Guided bilingual (EN/FR) filing UX for individual, self-employed, and company paths.
- Prisma data model for user profiles, tax returns, and audit events.
- CI/CD baseline plan with lint, typecheck, test, build, and security scan steps.
