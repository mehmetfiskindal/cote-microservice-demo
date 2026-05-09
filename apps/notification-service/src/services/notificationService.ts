import { PrismaClient } from "../generated/prisma";
import { BaseEvent } from "../../../../packages/contracts/src";
import { Events } from "../../../../packages/contracts/src";
import { createEvent } from "../../../../packages/shared/src";

export const prisma = new PrismaClient();

export async function createNotificationForEvent(event: BaseEvent<any>) {
  if (event.eventType === Events.OrderFailed && event.payload.requiresRefund) {
    return null;
  }

  const message = buildMessage(event);

  const notification = await prisma.notification.create({
    data: {
      userId: event.payload.userId,
      orderId: event.payload.orderId,
      type: "email",
      message,
      status: "SENT",
      correlationId: event.correlationId
    }
  });

  return createEvent(Events.NotificationSent, event.correlationId, {
    orderId: event.payload.orderId,
    userId: event.payload.userId,
    notificationId: notification.id,
    sourceEvent: event.eventType,
    channel: notification.type
  });
}

export async function getNotificationHealth() {
  const notifications = await prisma.notification.count();

  return {
    service: "notification-service",
    status: "ok",
    notifications,
    timestamp: new Date().toISOString()
  };
}

function buildMessage(event: BaseEvent<any>) {
  if (event.eventType === Events.OrderCompleted) {
    return `Order ${event.payload.orderId} completed successfully.`;
  }

  if (event.eventType === Events.PaymentRefunded) {
    return `Order ${event.payload.orderId} failed and payment ${event.payload.paymentId} was refunded.`;
  }

  return `Order ${event.payload.orderId} failed. Reason: ${event.payload.reason}`;
}
