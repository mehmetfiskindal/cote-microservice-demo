export const Events = {
  OrderCreated: "order.created",
  OrderCompleted: "order.completed",
  OrderFailed: "order.failed",

  PaymentCompleted: "payment.completed",
  PaymentFailed: "payment.failed",
  PaymentRefundRequested: "payment.refund_requested",
  PaymentRefunded: "payment.refunded",

  InventoryReserved: "inventory.reserved",
  InventoryFailed: "inventory.failed",

  NotificationSent: "notification.sent"
} as const;

export const OrderStatuses = {
  Pending: "PENDING",
  PaymentCompleted: "PAYMENT_COMPLETED",
  PaymentFailed: "PAYMENT_FAILED",
  InventoryReserved: "INVENTORY_RESERVED",
  InventoryFailed: "INVENTORY_FAILED",
  Completed: "COMPLETED",
  Failed: "FAILED",
  Cancelled: "CANCELLED"
} as const;

export const PaymentStatuses = {
  Pending: "PENDING",
  Completed: "COMPLETED",
  Failed: "FAILED",
  Refunded: "REFUNDED"
} as const;

export const ReservationStatuses = {
  Reserved: "RESERVED",
  Failed: "FAILED",
  Released: "RELEASED"
} as const;

export type EventName = typeof Events[keyof typeof Events];
