const cote = require("cote");
const { SERVICE_COMMANDS } = require("../../../packages/contracts/commands");
const { ORDER_EVENTS } = require("../../../packages/contracts/events");
const { log, error } = require("../../../packages/shared/logger");

const SERVICE_NAME = "inventory-service";

const inventory = {
  "product-1": { name: "Laptop", stock: 100 },
  "product-2": { name: "Mouse", stock: 200 },
  "product-3": { name: "Keyboard", stock: 150 },
  "product-4": { name: "Monitor", stock: 80 }
};

const inventoryResponder = new cote.Responder({
  name: "Inventory Service Responder",
  key: "inventory"
});

const inventorySubscriber = new cote.Subscriber({
  name: "Inventory Service Subscriber",
  subscribesTo: [ORDER_EVENTS.PAYMENT_COMPLETED]
});

const inventoryPublisher = new cote.Publisher({
  name: "Inventory Service Publisher",
  broadcasts: [ORDER_EVENTS.INVENTORY_RESERVED, ORDER_EVENTS.INVENTORY_FAILED]
});

log(SERVICE_NAME, "Inventory Service started", {
  listeningFor: ORDER_EVENTS.PAYMENT_COMPLETED
});

inventoryResponder.on(SERVICE_COMMANDS.INVENTORY_HEALTH_CHECK, async () => ({
  service: SERVICE_NAME,
  status: "ok",
  products: Object.keys(inventory).length,
  timestamp: new Date().toISOString()
}));

inventorySubscriber.on(ORDER_EVENTS.PAYMENT_COMPLETED, async (event) => {
  log(SERVICE_NAME, "Received payment completed event", {
    orderId: event.orderId,
    correlationId: event.correlationId,
    itemsCount: event.items.length
  });

  try {
    const invalidItem = event.items.find(item => !inventory[item.productId]);
    if (invalidItem) {
      const failedEvent = {
        correlationId: event.correlationId,
        orderId: event.orderId,
        userId: event.userId,
        reason: `Product not found: ${invalidItem.productId}`,
        failedAt: new Date().toISOString()
      };

      inventoryPublisher.publish(ORDER_EVENTS.INVENTORY_FAILED, failedEvent);
      log(SERVICE_NAME, "Inventory reservation failed", failedEvent);
      return;
    }

    const outOfStockItem = event.items.find(item => inventory[item.productId].stock < item.quantity);
    if (outOfStockItem) {
      const failedEvent = {
        correlationId: event.correlationId,
        orderId: event.orderId,
        userId: event.userId,
        reason: `Insufficient stock for ${outOfStockItem.productId}`,
        failedAt: new Date().toISOString()
      };

      inventoryPublisher.publish(ORDER_EVENTS.INVENTORY_FAILED, failedEvent);
      log(SERVICE_NAME, "Inventory reservation failed", failedEvent);
      return;
    }

    const reservedItems = event.items.map(item => {
      const product = inventory[item.productId];
      const previousStock = product.stock;
      product.stock -= item.quantity;

      return {
        productId: item.productId,
        quantity: item.quantity,
        previousStock,
        currentStock: product.stock
      };
    });

    const reservedEvent = {
      correlationId: event.correlationId,
      orderId: event.orderId,
      userId: event.userId,
      reservedItems,
      reservedAt: new Date().toISOString()
    };

    inventoryPublisher.publish(ORDER_EVENTS.INVENTORY_RESERVED, reservedEvent);
    log(SERVICE_NAME, "Inventory reserved", reservedEvent);
  } catch (err) {
    error(SERVICE_NAME, "Inventory reservation crashed", {
      orderId: event.orderId,
      correlationId: event.correlationId,
      error: err.message
    });
  }
});
