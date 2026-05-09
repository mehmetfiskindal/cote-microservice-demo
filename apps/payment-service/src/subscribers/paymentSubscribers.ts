import { Commands, Events } from "../../../../packages/contracts/src";
import { log, logError } from "../../../../packages/shared/src";
import { getPaymentHealth, processPayment, refundPayment } from "../repositories/paymentRepository";

const SERVICE_NAME = "payment-service";

export function registerPaymentSubscribers(responder: any, subscriber: any, publisher: any) {
  responder.on(Commands.PaymentHealth, getPaymentHealth);

  subscriber.on(Events.OrderCreated, async (event: any) => {
    try {
      log(SERVICE_NAME, "Order created received", {
        orderId: event.payload.orderId,
        correlationId: event.correlationId
      });

      const resultEvent = await processPayment(event);
      publisher.publish(resultEvent.eventType, resultEvent);

      log(SERVICE_NAME, "Payment flow event published", {
        eventType: resultEvent.eventType,
        orderId: resultEvent.payload.orderId,
        correlationId: resultEvent.correlationId
      });
    } catch (err) {
      const error = err as Error;
      logError(SERVICE_NAME, "Payment processing failed unexpectedly", {
        correlationId: event.correlationId,
        error: error.message
      });
    }
  });

  subscriber.on(Events.PaymentRefundRequested, async (event: any) => {
    try {
      log(SERVICE_NAME, "Refund requested received", {
        orderId: event.payload.orderId,
        correlationId: event.correlationId
      });

      const refundedEvent = await refundPayment(event);
      publisher.publish(refundedEvent.eventType, refundedEvent);

      log(SERVICE_NAME, "Refund event published", {
        eventType: refundedEvent.eventType,
        orderId: refundedEvent.payload.orderId,
        correlationId: refundedEvent.correlationId
      });
    } catch (err) {
      const error = err as Error;
      logError(SERVICE_NAME, "Refund failed unexpectedly", {
        correlationId: event.correlationId,
        error: error.message
      });
    }
  });
}
