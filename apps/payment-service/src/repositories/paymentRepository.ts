import { Prisma, PrismaClient } from "../generated/prisma";
import { Events, PaymentStatuses } from "../../../../packages/contracts/src";
import { BaseEvent, OrderCreatedPayload, PaymentRefundRequestedPayload } from "../../../../packages/contracts/src";
import { createEvent } from "../../../../packages/shared/src";

export const prisma = new PrismaClient();

export async function processPayment(event: BaseEvent<OrderCreatedPayload>) {
  const payload = event.payload;

  const payment = await prisma.payment.upsert({
    where: { orderId: payload.orderId },
    update: {
      amount: payload.totalPrice,
      status: PaymentStatuses.Pending,
      correlationId: event.correlationId
    },
    create: {
      orderId: payload.orderId,
      amount: payload.totalPrice,
      status: PaymentStatuses.Pending,
      correlationId: event.correlationId
    }
  });

  const shouldFail = payload.simulatePaymentFailure
    || (process.env.ENABLE_RANDOM_PAYMENT_FAILURE === "true" && Math.random() > 0.8);

  for (let attemptNumber = 1; attemptNumber <= 3; attemptNumber += 1) {
    if (!shouldFail) {
      await prisma.paymentAttempt.create({
        data: {
          paymentId: payment.id,
          orderId: payload.orderId,
          attemptNumber,
          status: "SUCCESS"
        }
      });

      const updated = await prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatuses.Completed }
      });

      const completedEvent = createEvent(Events.PaymentCompleted, event.correlationId, {
        orderId: payload.orderId,
        userId: payload.userId,
        amount: payload.totalPrice,
        paymentId: updated.id,
        items: payload.items,
        simulateInventoryFailure: payload.simulateInventoryFailure
      });

      await recordPaymentEvent(updated.id, payload.orderId, completedEvent);
      return completedEvent;
    }

    await prisma.paymentAttempt.create({
      data: {
        paymentId: payment.id,
        orderId: payload.orderId,
        attemptNumber,
        status: "FAILED",
        errorMessage: "Simulated payment provider failure"
      }
    });
  }

  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: { status: PaymentStatuses.Failed }
  });

  const failedEvent = createEvent(Events.PaymentFailed, event.correlationId, {
    orderId: payload.orderId,
    userId: payload.userId,
    amount: payload.totalPrice,
    reason: "Payment failed after 3 attempts"
  });

  await recordPaymentEvent(updated.id, payload.orderId, failedEvent);
  return failedEvent;
}

export async function refundPayment(event: BaseEvent<PaymentRefundRequestedPayload>) {
  const payment = await prisma.payment.findUnique({
    where: { orderId: event.payload.orderId }
  });

  if (!payment) {
    const failedEvent = createEvent(Events.PaymentFailed, event.correlationId, {
      orderId: event.payload.orderId,
      userId: event.payload.userId,
      amount: event.payload.amount,
      reason: "Refund requested but payment record was not found"
    });
    await recordPaymentEvent(null, event.payload.orderId, failedEvent);
    return failedEvent;
  }

  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: { status: PaymentStatuses.Refunded }
  });

  const refundedEvent = createEvent(Events.PaymentRefunded, event.correlationId, {
    orderId: event.payload.orderId,
    userId: event.payload.userId,
    amount: event.payload.amount,
    paymentId: updated.id,
    refundId: `refund-${Date.now()}`
  });

  await recordPaymentEvent(updated.id, event.payload.orderId, refundedEvent);
  return refundedEvent;
}

export async function getPaymentHealth() {
  const payments = await prisma.payment.count();
  const attempts = await prisma.paymentAttempt.count();

  return {
    service: "payment-service",
    status: "ok",
    payments,
    attempts,
    timestamp: new Date().toISOString()
  };
}

async function recordPaymentEvent(paymentId: string | null, orderId: string, event: BaseEvent<any>) {
  await prisma.paymentEvent.create({
    data: {
      paymentId,
      orderId,
      eventType: event.eventType,
      payload: event as unknown as Prisma.JsonObject,
      correlationId: event.correlationId
    }
  });
}
