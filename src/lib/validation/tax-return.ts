import { z } from "zod";
import { allowedKeysForMode, payloadSchemaForMode } from "@/lib/validation/payload-schema";
import type { FilingMode } from "@/lib/tax-field-config";

export const filingModeSchema = z.enum(["INDIVIDUAL", "SELF_EMPLOYED", "COMPANY"]);
export const returnStatusSchema = z.enum([
  "DRAFT",
  "READY_TO_REVIEW",
  "SUBMISSION_PENDING",
  "SUBMITTED",
  "REJECTED"
]);

const primitivePayload = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.boolean(), z.null()])
);

export const saveReturnSchema = z
  .object({
    taxYear: z.coerce
      .number()
      .int()
      .min(2010)
      .refine((y) => y < new Date().getFullYear(), {
        message: "Tax year must be a completed calendar year"
      }),
    filingMode: filingModeSchema,
    payload: primitivePayload
  })
  .refine(
    (data) => {
      const allowed = allowedKeysForMode(data.filingMode as FilingMode);
      return Object.keys(data.payload).every((key) => allowed.has(key));
    },
    {
      message: "Payload contains fields not allowed for this filing mode",
      path: ["payload"]
    }
  )
  .refine(
    (data) => {
      const schema = payloadSchemaForMode(data.filingMode as FilingMode);
      const result = schema.safeParse(data.payload);
      return result.success;
    },
    {
      message: "Payload field types do not match the expected schema for this filing mode",
      path: ["payload"]
    }
  );

export const prepareSubmissionSchema = z.object({
  returnId: z.string().cuid()
});

export type SaveReturnInput = z.infer<typeof saveReturnSchema>;
