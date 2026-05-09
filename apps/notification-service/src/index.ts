import "dotenv/config";
const cote = require("cote");

import { Events } from "../../../packages/contracts/src";
import { log } from "../../../packages/shared/src";
import { registerNotificationSubscribers } from "./subscribers/notificationSubscribers";

const SERVICE_NAME = "notification-service";

const responder = new cote.Responder({
  name: "V3 Notification Service Responder",
  key: "notification"
});

const subscriber = new cote.Subscriber({
  name: "V3 Notification Service Subscriber",
  subscribesTo: [
    Events.OrderCompleted,
    Events.OrderFailed,
    Events.PaymentRefunded
  ]
});

const publisher = new cote.Publisher({
  name: "V3 Notification Service Publisher",
  broadcasts: [Events.NotificationSent]
});

registerNotificationSubscribers(responder, subscriber, publisher);

log(SERVICE_NAME, "Notification Service started");
