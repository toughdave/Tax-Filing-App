import { z } from "zod";
import {
  baseFieldGroups,
  modeSpecificFieldGroups,
  PROFILE_FLAGS,
  type FilingMode,
  type TaxField
} from "@/lib/tax-field-config";

function zodTypeForField(field: TaxField) {
  if (field.key === "sinLast4") {
    return z.string().regex(/^\d{4}$/, "sinLast4 must be exactly 4 digits").nullable();
  }

  const base = field.type === "number"
    ? z.number().nullable()
    : z.string().nullable();

  return base;
}

function buildSchemaForFields(fields: TaxField[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of fields) {
    shape[field.key] = zodTypeForField(field);
  }
  for (const flag of PROFILE_FLAGS) {
    shape[flag.key] = z.boolean().nullable();
  }
  return z.object(shape).partial();
}

const baseFields = baseFieldGroups.flatMap((g) => g.fields);

const schemasByMode: Record<FilingMode, z.ZodTypeAny> = {
  INDIVIDUAL: buildSchemaForFields(baseFields),
  SELF_EMPLOYED: buildSchemaForFields([
    ...baseFields,
    ...modeSpecificFieldGroups.SELF_EMPLOYED.flatMap((g) => g.fields)
  ]),
  COMPANY: buildSchemaForFields([
    ...baseFields,
    ...modeSpecificFieldGroups.COMPANY.flatMap((g) => g.fields)
  ])
};

export function payloadSchemaForMode(mode: FilingMode) {
  return schemasByMode[mode];
}

export function allowedKeysForMode(mode: FilingMode): Set<string> {
  const fields = [
    ...baseFieldGroups.flatMap((g) => g.fields),
    ...(modeSpecificFieldGroups[mode] ?? []).flatMap((g) => g.fields)
  ];
  const keys = fields.map((f) => f.key);
  for (const flag of PROFILE_FLAGS) {
    keys.push(flag.key);
  }
  return new Set(keys);
}
