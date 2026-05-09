import { Commands, Events } from "../../../../packages/contracts/src";
import { log, logError } from "../../../../packages/shared/src";
import { createNotificationForEvent, getNotificationHealth } from "../services/notificationService";

const SERVICE_NAME = "notification-service";

export function registerNotificationSubscribers(responder: any, subscriber: any, publisher: any) {
  responder.on(Commands.NotificationHealth, getNotificationHealth);

  subscriber.on(Events.OrderCompleted, async (event: any) => notify(event, publisher));
  subscriber.on(Events.OrderFailed, async (event: any) => notify(event, publisher));
  subscriber.on(Events.PaymentRefunded, async (event: any) => notify(event, publisher));
}

async function notify(event: any, publisher: any) {
  try {
    const notificationEvent = await createNotificationForEvent(event);

    if (!notificationEvent) {
      log(SERVICE_NAME, "Notification delayed until refund is completed", {
        eventType: event.eventType,
        orderId: event.payload.orderId,
        correlationId: event.correlationId
      });
      return;
    }

    publisher.publish(notificationEvent.eventType, notificationEvent);

    log(SERVICE_NAME, "Notification sent", {
      sourceEvent: event.eventType,
      orderId: event.payload.orderId,
      correlationId: event.correlationId
    });
  } catch (err) {
    const error = err as Error;
    logError(SERVICE_NAME, "Notification failed", {
      eventType: event.eventType,
      correlationId: event.correlationId,
      error: error.message
    });
  }
}
