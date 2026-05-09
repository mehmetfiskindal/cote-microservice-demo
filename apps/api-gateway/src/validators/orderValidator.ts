import { z } from "zod";

export const createOrderSchema = z.object({
  userId: z.string().min(1),
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().min(1),
    price: z.number().positive()
  })).min(1),
  simulatePaymentFailure: z.boolean().optional().default(false),
  simulateInventoryFailure: z.boolean().optional().default(false)
}).transform(data => ({
  ...data,
  totalPrice: data.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
}));

export type CreateOrderRequest = z.infer<typeof createOrderSchema>;
