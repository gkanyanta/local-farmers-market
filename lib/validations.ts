import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const checkoutSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerPhone: z.string().min(10, "Phone number is required"),
  pickupOption: z.enum(["OWN_RIDER", "BOOK_RIDER"]),
  mobileOperator: z.enum(["airtel", "mtn"]).optional(),
  riderName: z.string().optional(),
  riderPhone: z.string().optional(),
  pickupTime: z.string().optional(),
  pickupNotes: z.string().optional(),
});

export const productSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  unit: z.string().min(1, "Unit is required"),
  price: z.number().positive("Price must be positive"),
  imageUrl: z.string().optional(),
  isPerishable: z.boolean(),
  isActive: z.boolean(),
  stockQty: z.number().int().nonnegative().nullable().optional(),
});

export const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters"),
  imageUrl: z.string().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const settingsSchema = z.object({
  minOrderValue: z.number().positive("Minimum order value must be positive"),
  cutOffTime: z.string(),
  pickupAddressText: z.string().optional(),
  contactPhone: z.string().optional(),
  supportWhatsApp: z.string().optional(),
});

export const orderStatusUpdateSchema = z.object({
  orderId: z.string(),
  status: z.enum([
    "PENDING_PAYMENT",
    "CONFIRMED",
    "SOURCING",
    "READY_FOR_PICKUP",
    "PICKED_UP",
    "CANCELLED",
  ]),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
export type OrderStatusUpdateInput = z.infer<typeof orderStatusUpdateSchema>;
