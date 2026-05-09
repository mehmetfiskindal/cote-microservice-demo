import { Prisma, PrismaClient } from "../generated/prisma";
import { Events, ReservationStatuses } from "../../../../packages/contracts/src";
import { BaseEvent, PaymentCompletedPayload } from "../../../../packages/contracts/src";
import { createEvent } from "../../../../packages/shared/src";

export const prisma = new PrismaClient();

const seedProducts = [
  { id: "product-1", name: "Laptop", stock: 100, price: 100 },
  { id: "product-2", name: "Mouse", stock: 200, price: 25 },
  { id: "product-3", name: "Keyboard", stock: 150, price: 50 },
  { id: "product-4", name: "Monitor", stock: 80, price: 250 }
];

export async function seedInventory() {
  for (const product of seedProducts) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {},
      create: product
    });
  }
}

export async function reserveInventory(event: BaseEvent<PaymentCompletedPayload>) {
  const payload = event.payload;

  if (payload.simulateInventoryFailure) {
    return failInventory(event, "Inventory failure was requested by demo payload");
  }

  const products = await prisma.product.findMany({
    where: { id: { in: payload.items.map(item => item.productId) } }
  });

  const productMap = new Map(products.map(product => [product.id, product]));

  for (const item of payload.items) {
    const product = productMap.get(item.productId);

    if (!product) {
      return failInventory(event, `Product not found: ${item.productId}`);
    }

    if (product.stock < item.quantity) {
      return failInventory(event, `Insufficient stock for ${item.productId}`);
    }
  }

  const reservedItems = await prisma.$transaction(async tx => {
    const reservations = [];

    for (const item of payload.items) {
      const product = await tx.product.findUniqueOrThrow({
        where: { id: item.productId }
      });

      const updatedProduct = await tx.product.update({
        where: { id: item.productId },
        data: { stock: product.stock - item.quantity }
      });

      await tx.stockReservation.create({
        data: {
          orderId: payload.orderId,
          productId: item.productId,
          quantity: item.quantity,
          status: ReservationStatuses.Reserved,
          correlationId: event.correlationId
        }
      });

      reservations.push({
        productId: item.productId,
        quantity: item.quantity,
        previousStock: product.stock,
        currentStock: updatedProduct.stock
      });
    }

    return reservations;
  });

  const reservedEvent = createEvent(Events.InventoryReserved, event.correlationId, {
    orderId: payload.orderId,
    userId: payload.userId,
    reservedItems
  });

  await recordInventoryEvent(payload.orderId, reservedEvent);
  return reservedEvent;
}

export async function getInventoryHealth() {
  const products = await prisma.product.count();
  const reservations = await prisma.stockReservation.count();

  return {
    service: "inventory-service",
    status: "ok",
    products,
    reservations,
    timestamp: new Date().toISOString()
  };
}

async function failInventory(event: BaseEvent<PaymentCompletedPayload>, reason: string) {
  const payload = event.payload;

  await prisma.stockReservation.createMany({
    data: payload.items.map(item => ({
      orderId: payload.orderId,
      productId: item.productId,
      quantity: item.quantity,
      status: ReservationStatuses.Failed,
      correlationId: event.correlationId
    }))
  });

  const failedEvent = createEvent(Events.InventoryFailed, event.correlationId, {
    orderId: payload.orderId,
    userId: payload.userId,
    amount: payload.amount,
    paymentId: payload.paymentId,
    reason
  });

  await recordInventoryEvent(payload.orderId, failedEvent);
  return failedEvent;
}

async function recordInventoryEvent(orderId: string, event: BaseEvent<any>) {
  await prisma.inventoryEvent.create({
    data: {
      orderId,
      eventType: event.eventType,
      payload: event as unknown as Prisma.JsonObject,
      correlationId: event.correlationId
    }
  });
}
