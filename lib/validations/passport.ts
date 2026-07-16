import { z } from "zod";

export const passportFormSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  ownerName: z.string().min(1, "Owner name is required"),
  market: z.string().min(1, "Market is required"),
  shopNumber: z.string().min(1, "Shop number is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  profileImage: z.string().optional(),
});

export type PassportFormValues = z.infer<typeof passportFormSchema>;
