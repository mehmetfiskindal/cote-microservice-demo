export const Commands = {
  CreateOrder: "order.create",
  GetOrder: "order.get",
  GetOrders: "order.get_all",
  GetOrderTimeline: "order.timeline.get",
  OrderHealth: "order.health",
  PaymentHealth: "payment.health",
  InventoryHealth: "inventory.health",
  NotificationHealth: "notification.health"
} as const;

export type CommandName = typeof Commands[keyof typeof Commands];
