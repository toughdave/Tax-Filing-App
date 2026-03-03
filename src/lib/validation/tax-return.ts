import { z } from "zod";

const currentYear = new Date().getFullYear();

export const filingModeSchema = z.enum(["INDIVIDUAL", "SELF_EMPLOYED", "COMPANY"]);
export const returnStatusSchema = z.enum([
  "DRAFT",
  "READY_TO_REVIEW",
  "SUBMISSION_PENDING",
  "SUBMITTED",
  "REJECTED"
]);

export const saveReturnSchema = z.object({
  taxYear: z.coerce.number().int().min(2010).max(currentYear),
  filingMode: filingModeSchema,
  status: returnStatusSchema.optional().default("DRAFT"),
  payload: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).or(z.record(z.string(), z.any()))
});

export const prepareSubmissionSchema = z.object({
  returnId: z.string().cuid()
});

export type SaveReturnInput = z.infer<typeof saveReturnSchema>;
