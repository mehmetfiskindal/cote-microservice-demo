const ORDER_COMMANDS = {
  CREATE_ORDER: "order.create",
  GET_ORDERS: "order.getAll",
  GET_ORDER: "order.getById",
  GET_ORDER_TIMELINE: "order.timeline.get",
  HEALTH_CHECK: "order.health"
};

const SERVICE_COMMANDS = {
  PAYMENT_HEALTH_CHECK: "payment.health",
  INVENTORY_HEALTH_CHECK: "inventory.health",
  NOTIFICATION_HEALTH_CHECK: "notification.health"
};

module.exports = {
  ORDER_COMMANDS,
  SERVICE_COMMANDS
};
