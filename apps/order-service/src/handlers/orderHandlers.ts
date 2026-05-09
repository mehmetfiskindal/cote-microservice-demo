import { Commands, Events } from "../../../../packages/contracts/src";
import { log, logError } from "../../../../packages/shared/src";
import {
  createOrder,
  getOrder,
  getOrderTimeline,
  listOrders,
  markInventoryFailed,
  markInventoryReserved,
  markPaymentCompleted,
  markPaymentFailed,
  recordNotification,
  recordRefunded
} from "../repositories/orderRepository";

const SERVICE_NAME = "order-service";

export function registerOrderHandlers(responder: any, subscriber: any) {
  responder.on(Commands.OrderHealth, async () => ({
    service: SERVICE_NAME,
    status: "ok",
    timestamp: new Date().toISOString()
  }));

  responder.on(Commands.GetOrders, async () => ({
    message: "Orders retrieved successfully",
    orders: await listOrders()
  }));

  responder.on(Commands.GetOrder, async (req: any) => ({
    message: "Order retrieved successfully",
    order: await getOrder(req.payload.orderId)
  }));

  responder.on(Commands.GetOrderTimeline, async (req: any) => ({
    message: "Order timeline retrieved successfully",
    orderId: req.payload.orderId,
    events: await getOrderTimeline(req.payload.orderId)
  }));

  responder.on(Commands.CreateOrder, async (req: any) => {
    const order = await createOrder(req.payload);
    log(SERVICE_NAME, "Order created", {
      orderId: order.id,
      correlationId: order.correlationId
    });

    return {
      message: "Order created successfully",
      order
    };
  });

  subscriber.on(Events.PaymentCompleted, async (event: any) => run("Payment completed received", event, markPaymentCompleted));
  subscriber.on(Events.PaymentFailed, async (event: any) => run("Payment failed received", event, markPaymentFailed));
  subscriber.on(Events.InventoryReserved, async (event: any) => run("Inventory reserved received", event, markInventoryReserved));
  subscriber.on(Events.InventoryFailed, async (event: any) => run("Inventory failed received", event, markInventoryFailed));
  subscriber.on(Events.PaymentRefunded, async (event: any) => run("Payment refunded received", event, recordRefunded));
  subscriber.on(Events.NotificationSent, async (event: any) => run("Notification sent received", event, recordNotification));
}

async function run(message: string, event: any, handler: (event: any) => Promise<void>) {
  try {
    log(SERVICE_NAME, message, {
      eventType: event.eventType,
      orderId: event.payload?.orderId,
      correlationId: event.correlationId
    });
    await handler(event);
  } catch (err) {
    const error = err as Error;
    logError(SERVICE_NAME, "Event handling failed", {
      message,
      eventType: event.eventType,
      correlationId: event.correlationId,
      error: error.message
    });
  }
}
