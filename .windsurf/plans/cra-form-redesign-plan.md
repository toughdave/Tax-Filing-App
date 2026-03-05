# CRA-Aligned Form Redesign — Master Plan

## Vision
Transform the tax filing UX from a flat wizard with generic field labels into a CRA T1-aligned, province-aware, vertically-organized accordion timeline with:
- Monochrome Lucide icons (replacing emojis)
- Vertical expand/collapse timeline sections with subsections
- Friendly question-style field labels where appropriate
- Deep dynamic branching based on province, filing mode, and profile flags
- Real CRA form/schedule/line-number mapping
- Provincial form integration (ON428, ON-BEN, etc.)

---

## Phase 1 — Foundation: Icons, Timeline UI, Mobile Labels
**Goal**: Replace all emoji icons with Lucide React monochrome icons. Build the vertical accordion timeline component. Ensure mobile stepper shows text labels alongside icons.

### Tasks
1. Install `lucide-react` dependency
2. Create icon mapping in `tax-field-config.ts` — each section references a Lucide icon name instead of emoji
3. Build `AccordionTimeline` component:
   - Vertical layout with connecting line between sections
   - Each section heading is clickable to expand/collapse
   - Active section highlighted with brand color
   - Completed sections show checkmark icon
   - Subsection support (nested collapsibles within a section)
4. Update `return-form.tsx` to use the new timeline instead of horizontal stepper
5. Mobile: always show icon + text label in timeline (not icon-only)
6. Update `site-header.tsx` pill and any other emoji usage to use Lucide icons
7. CSS for accordion animations (smooth expand/collapse)

### Files Modified
- `package.json` (add lucide-react)
- `src/lib/tax-field-config.ts` (icon field changes)
- `src/components/return-form.tsx` (timeline component)
- `src/components/site-header.tsx` (header pill icon)
- `src/app/globals.css` (accordion CSS)
- `src/lib/i18n.ts` (any new keys)

---

## Phase 2 — CRA T1 Form Structure + Schedules
**Goal**: Restructure the field config to mirror the real CRA T1 return with proper steps, schedules, and subsections.

### T1 Structure (Individual)
1. **Step 1 — Identification** (personal info, residency, marital status, Elections Canada, Indian Act, climate action, foreign property)
2. **Step 2 — Total Income** (employment, EI benefits, pensions, dividends, interest, rental, capital gains, self-employment, other)
3. **Step 3 — Net Income** (RPP, RRSP, FHSA, union dues, child care, moving expenses, support payments, carrying charges, CPP deductions)
4. **Step 4 — Taxable Income** (security options, capital gains deduction, northern residents, other deductions)
5. **Step 5 — Federal Tax**
   - Part A: Federal tax on taxable income (bracket calculation)
   - Part B: Federal non-refundable tax credits (basic personal, age, spouse, dependant, CPP, EI, employment amount, disability, tuition, medical, donations)
   - Part C: Net federal tax (TOSI, dividend tax credit, minimum tax carryover)
6. **Step 6 — Refund or Balance Owing** (total payable vs total credits)

### Schedules (conditionally shown)
- **Schedule 8** — CPP Contributions (Parts 1-5, shown when has employment/self-employment income)
- **Schedule 11** — Tuition/Education (shown when isStudent flag set)
- **EI Overpayment** — (auto-calculated from T4 data)

### Subsection Model
```typescript
interface FormSubsection {
  id: string;
  titleKey: string;
  descriptionKey?: string;
  helpText?: string; // explanation of what this subsection targets
  fields: TaxField[];
  visibleWhen?: (ctx: FormContext) => boolean; // dynamic visibility
}

interface FormSection {
  id: string;
  titleKey: string;
  descriptionKey: string;
  icon: string; // Lucide icon name
  craFormRef?: string; // e.g. "T1-Step2", "Schedule 8", "ON428"
  subsections: FormSubsection[];
  visibleWhen?: (ctx: FormContext) => boolean;
}
```

### Friendly Labels (examples)
- "Employment income" → "How much did you earn from your job(s) this year?" (helpKey provides the CRA term)
- "Employment insurance benefits" → "Did you receive any EI benefits this year?"
- "Child care expenses" → "How much did you spend on child care?"
- "Union / professional dues" → "Did you pay union or professional membership fees?"
- "Northern residents deductions" → "Do you qualify for the Northern residents deduction?"

### Files Modified
- `src/lib/tax-field-config.ts` (complete rewrite of section/field structure)
- `src/lib/i18n.ts` (new friendly labels + CRA reference labels)
- `src/components/return-form.tsx` (render subsections)

---

## Phase 3 — Provincial Intelligence
**Goal**: When user selects a province, dynamically load province-specific tax forms as additional sections.

### Ontario (ON) — Phase 3a
- **Form ON428** — Ontario Tax
  - Part A: Ontario tax on taxable income (bracket calculation)
  - Part B: Ontario non-refundable tax credits
  - Part C: Ontario tax (surtax, health premium, LIFT credit, tax reduction)
- **Form ON-BEN** — Ontario Trillium Benefit Application
  - Ontario sales tax credit (OSTC) — auto
  - Ontario energy and property tax credit (OEPTC) — rent/property tax fields
  - Northern Ontario energy credit (NOEC) — only if Northern Ontario
  - Ontario senior homeowners' property tax grant (OSHPTG) — only if 64+

### Other Provinces — Phase 3b (future)
- Each province gets its own form config module
- QC: TP-1, Schedule B, etc.
- BC: BC428, BC479
- AB: AB428
- etc.

### Dynamic Logic
- Province selection in Step 1 → triggers loading of provincial form sections
- Northern Ontario residency flag → shows NOEC subsection
- Age 64+ → shows OSHPTG subsection
- Student residence → shows student residence checkbox in ON-BEN

### Files Modified
- New: `src/lib/provincial-forms/ontario.ts`
- New: `src/lib/provincial-forms/index.ts` (registry)
- `src/lib/tax-field-config.ts` (provincial section integration)
- `src/components/return-form.tsx` (render provincial sections)
- `src/lib/i18n.ts` (provincial form labels)

---

## Phase 4 — Deep Dynamic Branching + Conversational Labels
**Goal**: Make every section/subsection/field visibility decision driven by user context.

### Branching Rules
| Profile Signal | Sections/Subsections Revealed |
|---|---|
| Province = ON | ON428, ON-BEN sections |
| Province = ON + Northern | NOEC subsection in ON-BEN |
| isStudent | Schedule 11, tuition fields in Part B credits |
| isSelfEmployed | Schedule 8 Parts 4/5, business income in Step 2, GST/HST |
| isRetired | Pension income fields, age amount, pension splitting |
| hasInvestments | Dividend/interest/capital gains in Step 2, Schedule 3 |
| hasRentalIncome | Rental income subsection in Step 2 |
| hasDisability | Disability amount in Part B credits, DTC fields |
| hasDependants | Dependant amounts, caregiver amounts, child care |
| hasMedicalExpenses | Medical expense section in Part B credits |
| hasDonations | Donations in Part B credits, ON community food program |
| hasMovingExpenses | Moving expenses in Step 3 |
| hasForeignProperty | Foreign property disclosure in Step 1 |
| Age >= 65 | Age amount credit, OSHPTG eligibility |

### Conversational Labels
Applied selectively to fields that benefit from plain-language phrasing. Each field gets:
- `friendlyLabelKey` — the conversational question
- `craLabelKey` — the official CRA term (shown as help text)
- `craLineNumber` — e.g. "Line 10100"

### Files Modified
- `src/lib/tax-field-config.ts` (visibility predicates on every section/subsection)
- `src/lib/i18n.ts` (friendly labels + CRA labels)
- `src/components/return-form.tsx` (evaluate visibility in render)

---

## Phase 5 — Calculation Engine Upgrade
**Goal**: Wire the backend calculation to handle real T1 Steps 2-6 math, CPP/EI overpayment, and provincial tax.

### Calculations
- Step 2: Sum all income sources → Total Income (Line 15000)
- Step 3: Apply deductions → Net Income (Line 23600)
- Step 4: Apply additional deductions → Taxable Income (Line 26000)
- Step 5A: Federal tax brackets on taxable income
- Step 5B: Non-refundable credits at 15% rate
- Step 5C: Net federal tax
- Step 6: Total payable vs total credits → Refund/Balance owing
- Schedule 8: CPP contributions + overpayment
- EI Overpayment: Based on insurable earnings
- ON428: Ontario tax brackets + surtax + health premium + LIFT credit
- ON-BEN: OEPTC/NOEC/OSTC eligibility calculations

### Real-Time Preview
- As user fills fields, a floating summary card shows:
  - Total Income
  - Net Income
  - Federal Tax
  - Provincial Tax
  - Estimated Refund or Balance Owing

### Files Modified
- `src/lib/services/tax-calculation-engine.ts` (major expansion)
- `src/lib/provincial-tax-config.ts` (provincial calculations)
- `src/components/return-form.tsx` (live calculation display)

---

## Phase 6 — Polish, Tests, Deploy
- Quality gates: typecheck, lint, tests, build
- i18n parity check (EN/FR)
- Version bump
- Commit + push + deploy
- Browser-based verification on Vercel preview
