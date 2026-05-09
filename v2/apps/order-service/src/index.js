const cote = require("cote");
const crypto = require("crypto");
const { ORDER_COMMANDS } = require("../../../packages/contracts/commands");
const { ORDER_EVENTS, ORDER_STATUSES } = require("../../../packages/contracts/events");
const { log, error } = require("../../../packages/shared/logger");

const SERVICE_NAME = "order-service";

const orders = [];
const eventStore = [];

const orderResponder = new cote.Responder({
  name: "Order Service Responder",
  key: "order"
});

const orderPublisher = new cote.Publisher({
  name: "Order Service Publisher",
  broadcasts: [
    ORDER_EVENTS.ORDER_CREATED,
    ORDER_EVENTS.ORDER_COMPLETED,
    ORDER_EVENTS.ORDER_FAILED
  ]
});

const orderSubscriber = new cote.Subscriber({
  name: "Order Service Subscriber",
  subscribesTo: [
    ORDER_EVENTS.PAYMENT_COMPLETED,
    ORDER_EVENTS.PAYMENT_FAILED,
    ORDER_EVENTS.INVENTORY_RESERVED,
    ORDER_EVENTS.INVENTORY_FAILED,
    ORDER_EVENTS.NOTIFICATION_SENT
  ]
});

function appendEvent(eventType, event) {
  const entry = {
    eventType,
    orderId: event.orderId,
    correlationId: event.correlationId,
    payload: event,
    timestamp: new Date().toISOString()
  };

  eventStore.push(entry);
  log(SERVICE_NAME, "Event recorded", {
    eventType,
    orderId: event.orderId,
    correlationId: event.correlationId
  });

  return entry;
}

function findOrder(orderId) {
  return orders.find(order => order.id === orderId);
}

function updateOrderStatus(orderId, status, extra = {}) {
  const order = findOrder(orderId);

  if (!order) {
    log(SERVICE_NAME, "Order not found while updating status", { orderId, status });
    return null;
  }

  Object.assign(order, extra, {
    status,
    updatedAt: new Date().toISOString()
  });

  log(SERVICE_NAME, "Order status updated", {
    orderId,
    status,
    correlationId: order.correlationId
  });

  return order;
}

log(SERVICE_NAME, "Order Service started");

orderResponder.on(ORDER_COMMANDS.HEALTH_CHECK, async () => ({
  service: SERVICE_NAME,
  status: "ok",
  orders: orders.length,
  events: eventStore.length,
  timestamp: new Date().toISOString()
}));

orderResponder.on(ORDER_COMMANDS.GET_ORDERS, async () => {
  log(SERVICE_NAME, "Fetching all orders");

  return {
    message: "Orders retrieved successfully",
    count: orders.length,
    orders
  };
});

orderResponder.on(ORDER_COMMANDS.GET_ORDER, async (req) => {
  const { orderId } = req.payload;
  log(SERVICE_NAME, "Fetching order", { orderId });

  return {
    message: findOrder(orderId) ? "Order retrieved successfully" : "Order not found",
    order: findOrder(orderId) || null
  };
});

orderResponder.on(ORDER_COMMANDS.GET_ORDER_TIMELINE, async (req) => {
  const { orderId } = req.payload;
  const order = findOrder(orderId);

  return {
    message: order ? "Order timeline retrieved successfully" : "Order not found",
    orderId,
    correlationId: order?.correlationId || null,
    events: eventStore
      .filter(event => event.orderId === orderId)
      .map(({ eventType, correlationId, timestamp, payload }) => ({
        eventType,
        correlationId,
        timestamp,
        payload
      }))
  };
});

orderResponder.on(ORDER_COMMANDS.CREATE_ORDER, async (req) => {
  const { userId, items, totalPrice, correlationId } = req.payload;

  const order = {
    id: crypto.randomUUID(),
    correlationId,
    userId,
    items,
    totalPrice,
    status: ORDER_STATUSES.PENDING,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  orders.push(order);

  const event = {
    correlationId,
    orderId: order.id,
    userId: order.userId,
    items: order.items,
    totalPrice: order.totalPrice,
    createdAt: order.createdAt
  };

  appendEvent(ORDER_EVENTS.ORDER_CREATED, event);
  orderPublisher.publish(ORDER_EVENTS.ORDER_CREATED, event);

  log(SERVICE_NAME, "Order created", {
    orderId: order.id,
    correlationId
  });

  return {
    message: "Order created successfully",
    order
  };
});

orderSubscriber.on(ORDER_EVENTS.PAYMENT_COMPLETED, async (event) => {
  appendEvent(ORDER_EVENTS.PAYMENT_COMPLETED, event);
  updateOrderStatus(event.orderId, ORDER_STATUSES.PAYMENT_COMPLETED, {
    paymentId: event.paymentId
  });
});

orderSubscriber.on(ORDER_EVENTS.PAYMENT_FAILED, async (event) => {
  appendEvent(ORDER_EVENTS.PAYMENT_FAILED, event);
  const order = updateOrderStatus(event.orderId, ORDER_STATUSES.FAILED, {
    failureReason: event.reason
  });

  if (order) {
    const failedEvent = {
      correlationId: event.correlationId,
      orderId: event.orderId,
      userId: order.userId,
      reason: event.reason,
      failedAt: new Date().toISOString()
    };

    appendEvent(ORDER_EVENTS.ORDER_FAILED, failedEvent);
    orderPublisher.publish(ORDER_EVENTS.ORDER_FAILED, failedEvent);
  }
});

orderSubscriber.on(ORDER_EVENTS.INVENTORY_RESERVED, async (event) => {
  appendEvent(ORDER_EVENTS.INVENTORY_RESERVED, event);
  const order = updateOrderStatus(event.orderId, ORDER_STATUSES.INVENTORY_RESERVED, {
    reservedItems: event.reservedItems
  });

  if (order) {
    const completedEvent = {
      correlationId: event.correlationId,
      orderId: event.orderId,
      userId: order.userId,
      totalPrice: order.totalPrice,
      completedAt: new Date().toISOString()
    };

    updateOrderStatus(event.orderId, ORDER_STATUSES.COMPLETED);
    appendEvent(ORDER_EVENTS.ORDER_COMPLETED, completedEvent);
    orderPublisher.publish(ORDER_EVENTS.ORDER_COMPLETED, completedEvent);
  }
});

orderSubscriber.on(ORDER_EVENTS.INVENTORY_FAILED, async (event) => {
  appendEvent(ORDER_EVENTS.INVENTORY_FAILED, event);
  const order = updateOrderStatus(event.orderId, ORDER_STATUSES.FAILED, {
    failureReason: event.reason
  });

  if (order) {
    const failedEvent = {
      correlationId: event.correlationId,
      orderId: event.orderId,
      userId: order.userId,
      reason: event.reason,
      failedAt: new Date().toISOString()
    };

    appendEvent(ORDER_EVENTS.ORDER_FAILED, failedEvent);
    orderPublisher.publish(ORDER_EVENTS.ORDER_FAILED, failedEvent);
  }
});

orderSubscriber.on(ORDER_EVENTS.NOTIFICATION_SENT, async (event) => {
  appendEvent(ORDER_EVENTS.NOTIFICATION_SENT, event);
});

process.on("uncaughtException", (err) => {
  error(SERVICE_NAME, "Uncaught exception", { error: err.message });
});
