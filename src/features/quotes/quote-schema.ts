import { z } from "zod";

export const quoteRequestSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email(),
  arrival: z.iso.date(),
  departure: z.iso.date(),
  adults: z.number().int().min(1).max(8),
  childrenSixToSeventeen: z.number().int().min(0).max(8),
  childrenUnderSix: z.number().int().min(0).max(8),
}).refine((value) => value.adults + value.childrenSixToSeventeen + value.childrenUnderSix <= 8, { message: "Coco Palms accommodates up to 8 guests." });

export type QuoteRequest = z.infer<typeof quoteRequestSchema>;
