import { z } from "zod";
import { psychoQuestionKeys } from "@/domain/psychosomatic/model";

const answerKeySchema = z.enum(["none", "rare", "sometimes", "often"]);
const questionKeySchema = z.enum(psychoQuestionKeys);
const completeAnswersShape = psychoQuestionKeys.reduce(
  (shape, key) => {
    shape[key] = answerKeySchema;
    return shape;
  },
  {} as Record<(typeof psychoQuestionKeys)[number], typeof answerKeySchema>
);

export const psychoDraftSchema = z.object({
  sessionId: z.string().uuid(),
  questionKey: questionKeySchema,
  answerKey: answerKeySchema,
  consentAcceptedAt: z.string().datetime().optional(),
});

export const psychoCompleteSchema = z.object({
  sessionId: z.string().uuid(),
  answers: z.object(completeAnswersShape),
});

export const consultationLeadSchema = z.object({
  name: z.string().min(2).max(120),
  contact: z.string().min(3).max(255),
  message: z.string().min(5).max(2000),
});

export const waitlistSchema = z.object({
  email: z.string().email(),
  locale: z.enum(["ru", "en"]),
});

export const adminLeadStatusSchema = z.object({
  status: z.enum(["new", "in_progress", "done", "archived"]),
});
