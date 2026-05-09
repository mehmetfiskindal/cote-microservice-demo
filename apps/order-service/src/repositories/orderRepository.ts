import { Prisma, PrismaClient } from "../generated/prisma";
import { Events, OrderStatuses } from "../../../../packages/contracts/src";
import { BaseEvent, CreateOrderPayload, OrderFinishedPayload } from "../../../../packages/contracts/src";
import { createEvent } from "../../../../packages/shared/src";

export const prisma = new PrismaClient();

export async function createOrder(payload: CreateOrderPayload) {
  const orderEvent = createEvent(Events.OrderCreated, payload.correlationId, {
    orderId: "",
    userId: payload.userId,
    items: payload.items,
    totalPrice: payload.totalPrice,
    simulatePaymentFailure: Boolean(payload.simulatePaymentFailure),
    simulateInventoryFailure: Boolean(payload.simulateInventoryFailure)
  });

  return prisma.$transaction(async tx => {
    const order = await tx.order.create({
      data: {
        userId: payload.userId,
        status: OrderStatuses.Pending,
        totalPrice: payload.totalPrice,
        correlationId: payload.correlationId,
        items: {
          create: payload.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price
          }))
        }
      },
      include: { items: true }
    });

    const event = {
      ...orderEvent,
      payload: {
        ...orderEvent.payload,
        orderId: order.id
      }
    };

    await recordOrderEvent(tx, order.id, event);
    await addOutboxEvent(tx, event);

    return order;
  });
}

export async function listOrders() {
  return prisma.order.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" }
  });
}

export async function getOrder(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true }
  });
}

export async function getOrderTimeline(orderId: string) {
  return prisma.orderEvent.findMany({
    where: { orderId },
    orderBy: { createdAt: "asc" }
  });
}

export async function recordIncomingEvent(event: BaseEvent<any>) {
  const orderId = event.payload.orderId;
  await prisma.orderEvent.create({
    data: {
      orderId,
      eventType: event.eventType,
      payload: event as unknown as Prisma.JsonObject,
      correlationId: event.correlationId
    }
  });
}

export async function markPaymentCompleted(event: BaseEvent<any>) {
  await prisma.$transaction(async tx => {
    await recordOrderEvent(tx, event.payload.orderId, event);
    await tx.order.update({
      where: { id: event.payload.orderId },
      data: { status: OrderStatuses.PaymentCompleted }
    });
  });
}

export async function markPaymentFailed(event: BaseEvent<any>) {
  await prisma.$transaction(async tx => {
    await recordOrderEvent(tx, event.payload.orderId, event);
    await tx.order.update({
      where: { id: event.payload.orderId },
      data: {
        status: OrderStatuses.PaymentFailed,
        failureReason: event.payload.reason
      }
    });

    await failOrder(tx, event.payload.orderId, event.correlationId, event.payload.reason, false);
  });
}

export async function markInventoryReserved(event: BaseEvent<any>) {
  await prisma.$transaction(async tx => {
    await recordOrderEvent(tx, event.payload.orderId, event);
    const order = await tx.order.update({
      where: { id: event.payload.orderId },
      data: { status: OrderStatuses.InventoryReserved }
    });

    await tx.order.update({
      where: { id: event.payload.orderId },
      data: { status: OrderStatuses.Completed }
    });

    const completedEvent = createEvent<OrderFinishedPayload>(Events.OrderCompleted, event.correlationId, {
      orderId: order.id,
      userId: order.userId,
      totalPrice: order.totalPrice
    });

    await recordOrderEvent(tx, order.id, completedEvent);
    await addOutboxEvent(tx, completedEvent);
  });
}

export async function markInventoryFailed(event: BaseEvent<any>) {
  await prisma.$transaction(async tx => {
    await recordOrderEvent(tx, event.payload.orderId, event);
    await tx.order.update({
      where: { id: event.payload.orderId },
      data: {
        status: OrderStatuses.InventoryFailed,
        failureReason: event.payload.reason
      }
    });

    await failOrder(tx, event.payload.orderId, event.correlationId, event.payload.reason, true);

    const refundEvent = createEvent(Events.PaymentRefundRequested, event.correlationId, {
      orderId: event.payload.orderId,
      userId: event.payload.userId,
      amount: event.payload.amount,
      reason: event.payload.reason
    });

    await recordOrderEvent(tx, event.payload.orderId, refundEvent);
    await addOutboxEvent(tx, refundEvent);
  });
}

export async function recordRefunded(event: BaseEvent<any>) {
  await recordIncomingEvent(event);
}

export async function recordNotification(event: BaseEvent<any>) {
  await recordIncomingEvent(event);
}

async function failOrder(
  tx: Prisma.TransactionClient,
  orderId: string,
  correlationId: string,
  reason: string,
  requiresRefund: boolean
) {
  const order = await tx.order.update({
    where: { id: orderId },
    data: {
      status: OrderStatuses.Failed,
      failureReason: reason
    }
  });

  const failedEvent = createEvent<OrderFinishedPayload>(Events.OrderFailed, correlationId, {
    orderId,
    userId: order.userId,
    totalPrice: order.totalPrice,
    reason,
    requiresRefund
  });

  await recordOrderEvent(tx, orderId, failedEvent);
  await addOutboxEvent(tx, failedEvent);
}

async function recordOrderEvent(tx: Prisma.TransactionClient, orderId: string, event: BaseEvent<any>) {
  await tx.orderEvent.create({
    data: {
      orderId,
      eventType: event.eventType,
      payload: event as unknown as Prisma.JsonObject,
      correlationId: event.correlationId
    }
  });
}

async function addOutboxEvent(tx: Prisma.TransactionClient, event: BaseEvent<any>) {
  await tx.outboxEvent.create({
    data: {
      eventType: event.eventType,
      payload: event as unknown as Prisma.JsonObject,
      correlationId: event.correlationId
    }
  });
}
