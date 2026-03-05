import type { FilingMode } from "@/lib/tax-field-config";

/**
 * Carry-forward policy for tax return fields.
 *
 * PROFILE fields are stable identity/residency data that persist year-over-year
 * (name, SIN, DOB, province, marital status, corporate identity).
 *
 * All other fields (income, deductions, credits, payments, corporate amounts)
 * are year-specific and must NOT carry forward — they require fresh entry each
 * tax year.
 */

/**
 * Year-over-year field key migrations.
 * Maps { oldKey -> newKey } for cases where we renamed an internal field key.
 * During carry-forward, prior-year data using the old key is automatically
 * mapped to the new key. Add entries here when field keys change between versions.
 */
const FIELD_KEY_MIGRATIONS: ReadonlyMap<string, string> = new Map([
  // Example (uncomment when an actual migration is needed):
  // ["oldFieldName", "newFieldName"],
]);

/** Apply key migrations to a data blob, returning a new object with renamed keys. */
export function migrateFieldKeys(
  data: Record<string, unknown>
): Record<string, unknown> {
  if (FIELD_KEY_MIGRATIONS.size === 0) return data;

  const migrated: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    const newKey = FIELD_KEY_MIGRATIONS.get(key) ?? key;
    // New key takes precedence if both old and new exist in source data
    if (!(newKey in migrated) || key === newKey) {
      migrated[newKey] = value;
    }
  }
  return migrated;
}

/** Returns the field key migrations map (for testing/inspection). */
export function getFieldKeyMigrations(): ReadonlyMap<string, string> {
  return FIELD_KEY_MIGRATIONS;
}

/** Fields that carry forward across tax years (stable profile data). */
const PROFILE_FIELDS: ReadonlySet<string> = new Set([
  // Identity
  "legalName",
  "sinLast4",
  "birthDate",
  // Residency / personal
  "residencyProvince",
  "maritalStatus",
  "dependants",
  // Company identity (stable across years)
  "corporationName",
  "businessNumber",
  "fiscalYearEnd"
]);

/** Returns true if the given field key is eligible for carry-forward. */
export function isCarryForwardField(key: string): boolean {
  return PROFILE_FIELDS.has(key);
}

/** Returns the set of carry-forward-eligible field keys (for testing/inspection). */
export function getCarryForwardFieldKeys(): ReadonlySet<string> {
  return PROFILE_FIELDS;
}

/**
 * Filters a prior-year data blob to only the fields eligible for carry-forward.
 * Returns a new object containing only profile/identity fields.
 */
export function buildCarryForwardData(
  priorYearData: Record<string, unknown>
): Record<string, unknown> {
  const migrated = migrateFieldKeys(priorYearData);
  const carried: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(migrated)) {
    if (PROFILE_FIELDS.has(key) && value !== null && value !== undefined) {
      carried[key] = value;
    }
  }
  return carried;
}

export interface CarryForwardDiffEntry {
  key: string;
  source: "carried" | "new" | "changed";
  priorValue?: unknown;
  currentValue?: unknown;
}

/**
 * Computes a diff showing which fields were carried forward, which are new,
 * and which the user changed relative to the prior-year profile data.
 *
 * Only compares carry-forward-eligible (profile) fields. Year-specific fields
 * (income, deductions, etc.) are always considered "new" if present.
 */
export function computeCarryForwardDiff(
  priorYearData: Record<string, unknown> | null,
  currentPayload: Record<string, unknown>,
  _mode: FilingMode
): CarryForwardDiffEntry[] {
  const diff: CarryForwardDiffEntry[] = [];
  const prior = priorYearData ?? {};

  for (const [key, currentValue] of Object.entries(currentPayload)) {
    if (currentValue === null || currentValue === undefined) continue;

    if (!PROFILE_FIELDS.has(key)) {
      // Year-specific field — always "new" (never carried)
      diff.push({ key, source: "new", currentValue });
      continue;
    }

    const priorValue = prior[key];
    if (priorValue === null || priorValue === undefined) {
      // Profile field not in prior year
      diff.push({ key, source: "new", currentValue });
    } else if (String(priorValue) !== String(currentValue)) {
      // Profile field changed from prior year
      diff.push({ key, source: "changed", priorValue, currentValue });
    } else {
      // Profile field carried forward unchanged
      diff.push({ key, source: "carried", priorValue, currentValue });
    }
  }

  // Profile fields that existed in prior year but are absent in current payload
  // (user removed or hasn't filled yet) — only for profile fields
  for (const [key, priorValue] of Object.entries(prior)) {
    if (!PROFILE_FIELDS.has(key)) continue;
    if (priorValue === null || priorValue === undefined) continue;
    if (key in currentPayload) continue;
    diff.push({ key, source: "carried", priorValue, currentValue: priorValue });
  }

  return diff;
}
