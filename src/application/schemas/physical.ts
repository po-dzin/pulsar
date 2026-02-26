import { z } from "zod";
import { physicalTestKeys } from "@/domain/physical/catalog";

export const physicalDraftSchema = z.object({
  sessionId: z.string().uuid(),
  testKey: z.enum(physicalTestKeys as [string, ...string[]]).optional(),
  questionKey: z.string().min(1).max(120),
  answerValue: z.string().min(1).max(120),
  consentAcceptedAt: z.string().datetime().optional(),
});

export const physicalCompleteSchema = z.object({
  sessionId: z.string().uuid(),
  testKey: z.enum(physicalTestKeys as [string, ...string[]]).optional(),
  answers: z.record(z.string(), z.string().min(1).max(120)),
  consentAcceptedAt: z.string().datetime().optional(),
});
