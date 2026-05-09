import { EventName } from "./events";

export type OrderItemPayload = {
  productId: string;
  quantity: number;
  price: number;
};

export type CreateOrderPayload = {
  userId: string;
  items: OrderItemPayload[];
  totalPrice: number;
  correlationId: string;
  simulatePaymentFailure?: boolean;
  simulateInventoryFailure?: boolean;
};

export type BaseEvent<TPayload = Record<string, unknown>> = {
  eventId: string;
  eventType: EventName;
  correlationId: string;
  occurredAt: string;
  payload: TPayload;
};

export type OrderCreatedPayload = {
  orderId: string;
  userId: string;
  items: OrderItemPayload[];
  totalPrice: number;
  simulatePaymentFailure: boolean;
  simulateInventoryFailure: boolean;
};

export type PaymentCompletedPayload = {
  orderId: string;
  userId: string;
  amount: number;
  paymentId: string;
  items: OrderItemPayload[];
  simulateInventoryFailure: boolean;
};

export type PaymentFailedPayload = {
  orderId: string;
  userId: string;
  amount: number;
  reason: string;
};

export type InventoryReservedPayload = {
  orderId: string;
  userId: string;
  reservedItems: Array<{
    productId: string;
    quantity: number;
    previousStock: number;
    currentStock: number;
  }>;
};

export type InventoryFailedPayload = {
  orderId: string;
  userId: string;
  amount: number;
  paymentId?: string;
  reason: string;
};

export type PaymentRefundRequestedPayload = {
  orderId: string;
  userId: string;
  amount: number;
  reason: string;
};

export type PaymentRefundedPayload = {
  orderId: string;
  userId: string;
  amount: number;
  paymentId: string;
  refundId: string;
};

export type OrderFinishedPayload = {
  orderId: string;
  userId: string;
  totalPrice: number;
  reason?: string;
  requiresRefund?: boolean;
};

export type NotificationSentPayload = {
  orderId: string;
  userId: string;
  notificationId: string;
  sourceEvent: string;
  channel: string;
};
