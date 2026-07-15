import { z } from "zod";

export const saleLineSchema = z.object({
  key: z.string(),
  productId: z.string().nullable(),
  name: z.string().min(1, "Product name is required"),
  quantity: z.number().int().positive("Quantity must be at least 1"),
  unit: z.string().min(1, "Unit is required"),
});

export const saleConfirmSchema = z.object({
  items: z.array(saleLineSchema).min(1, "Add at least one item"),
});

export type SaleLineValues = z.infer<typeof saleLineSchema>;
export type SaleConfirmValues = z.infer<typeof saleConfirmSchema>;
