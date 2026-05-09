const cote = require("cote");
const { SERVICE_COMMANDS } = require("../../../packages/contracts/commands");
const { ORDER_EVENTS } = require("../../../packages/contracts/events");
const { log, error } = require("../../../packages/shared/logger");

const SERVICE_NAME = "notification-service";
const notifications = [];

const notificationResponder = new cote.Responder({
  name: "Notification Service Responder",
  key: "notification"
});

const notificationSubscriber = new cote.Subscriber({
  name: "Notification Service Subscriber",
  subscribesTo: [ORDER_EVENTS.ORDER_COMPLETED, ORDER_EVENTS.ORDER_FAILED]
});

const notificationPublisher = new cote.Publisher({
  name: "Notification Service Publisher",
  broadcasts: [ORDER_EVENTS.NOTIFICATION_SENT]
});

log(SERVICE_NAME, "Notification Service started", {
  listeningFor: [ORDER_EVENTS.ORDER_COMPLETED, ORDER_EVENTS.ORDER_FAILED]
});

notificationResponder.on(SERVICE_COMMANDS.NOTIFICATION_HEALTH_CHECK, async () => ({
  service: SERVICE_NAME,
  status: "ok",
  notifications: notifications.length,
  timestamp: new Date().toISOString()
}));

function createNotification(eventType, event) {
  const isFailed = eventType === ORDER_EVENTS.ORDER_FAILED;

  return {
    notificationId: `notif-${Date.now()}`,
    type: "email",
    orderId: event.orderId,
    userId: event.userId,
    subject: isFailed
      ? `Order Failed #${event.orderId}`
      : `Order Completed #${event.orderId}`,
    message: isFailed
      ? `Your order could not be completed. Reason: ${event.reason}`
      : `Your order has been completed successfully.`,
    sentAt: new Date().toISOString()
  };
}

async function sendNotification(eventType, event) {
  try {
    const notification = createNotification(eventType, event);
    notifications.push(notification);

    const sentEvent = {
      correlationId: event.correlationId,
      orderId: event.orderId,
      userId: event.userId,
      sourceEvent: eventType,
      notificationId: notification.notificationId,
      channel: notification.type,
      sentAt: notification.sentAt
    };

    notificationPublisher.publish(ORDER_EVENTS.NOTIFICATION_SENT, sentEvent);
    log(SERVICE_NAME, "Notification sent", sentEvent);
  } catch (err) {
    error(SERVICE_NAME, "Notification sending failed", {
      orderId: event.orderId,
      correlationId: event.correlationId,
      error: err.message
    });
  }
}

notificationSubscriber.on(ORDER_EVENTS.ORDER_COMPLETED, event => {
  sendNotification(ORDER_EVENTS.ORDER_COMPLETED, event);
});

notificationSubscriber.on(ORDER_EVENTS.ORDER_FAILED, event => {
  sendNotification(ORDER_EVENTS.ORDER_FAILED, event);
});
