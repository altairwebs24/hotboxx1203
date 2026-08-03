import { z } from "zod";

export const placeOrderSchema = z.object({
  customerName: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(9).max(20),
  fulfillment: z.enum(["collection", "delivery"]),
  address: z.string().trim().max(300).default(""),
  note: z.string().trim().max(500).default(""),
  items: z
    .array(
      z.object({
        id: z.string().uuid(),
        quantity: z.number().int().min(1).max(50),
        note: z.string().trim().max(200).default(""),
      }),
    )
    .min(1)
    .max(50),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;

export const trackOrderSchema = z.object({
  orderNumber: z.string().trim().min(3).max(20),
  phone: z.string().trim().min(4).max(20),
});
