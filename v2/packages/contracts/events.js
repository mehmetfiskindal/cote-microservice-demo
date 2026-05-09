const ORDER_EVENTS = {
  ORDER_CREATED: "order.created",
  PAYMENT_COMPLETED: "payment.completed",
  PAYMENT_FAILED: "payment.failed",
  INVENTORY_RESERVED: "inventory.reserved",
  INVENTORY_FAILED: "inventory.failed",
  ORDER_COMPLETED: "order.completed",
  ORDER_FAILED: "order.failed",
  NOTIFICATION_SENT: "notification.sent"
};

const ORDER_STATUSES = {
  PENDING: "PENDING",
  PAYMENT_COMPLETED: "PAYMENT_COMPLETED",
  INVENTORY_RESERVED: "INVENTORY_RESERVED",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED"
};

module.exports = {
  ORDER_EVENTS,
  ORDER_STATUSES
};
