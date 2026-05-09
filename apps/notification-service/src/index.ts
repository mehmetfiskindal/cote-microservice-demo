import "dotenv/config";
const cote = require("cote");
const express = require("express");

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

const app = express();
const PORT = process.env.PORT || 3004;

app.use(express.json());

app.get("/health", (_req: any, res: any) => {
  res.json({ status: "UP", service: SERVICE_NAME, timestamp: new Date().toISOString() });
});

registerNotificationSubscribers(responder, subscriber, publisher);

app.listen(PORT, () => {
  log(SERVICE_NAME, `Notification Service started on port ${PORT}`);
});
