import { z } from "zod";

export const ResolveRecommendationSchema = z.object({
  recommendationId: z.string().uuid("ID kiến nghị không hợp lệ"),
  status: z.enum(["WAITING_OVERDUE", "FEEDBACK_UNVERIFIED", "RESOLVED_CLOSED"]),
  idempotencyKey: z.string().optional(),
});

export type ResolveRecommendationInput = z.infer<typeof ResolveRecommendationSchema>;
