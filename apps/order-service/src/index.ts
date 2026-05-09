import "dotenv/config";
const cote = require("cote");
const express = require("express");

import { Events } from "../../../packages/contracts/src";
import { log } from "../../../packages/shared/src";
import { registerOrderHandlers } from "./handlers/orderHandlers";
import { startOutboxPublisher } from "./publishers/outboxPublisher";
import { prisma } from "./repositories/orderRepository";

const SERVICE_NAME = "order-service";

const responder = new cote.Responder({
  name: "V3 Order Service Responder",
  key: "order"
});

const publisher = new cote.Publisher({
  name: "V3 Order Service Publisher",
  broadcasts: [
    Events.OrderCreated,
    Events.OrderCompleted,
    Events.OrderFailed,
    Events.PaymentRefundRequested
  ]
});

const subscriber = new cote.Subscriber({
  name: "V3 Order Service Subscriber",
  subscribesTo: [
    Events.PaymentCompleted,
    Events.PaymentFailed,
    Events.InventoryReserved,
    Events.InventoryFailed,
    Events.PaymentRefunded,
    Events.NotificationSent
  ]
});

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.get("/health", (_req: any, res: any) => {
  res.json({ status: "UP", service: SERVICE_NAME, timestamp: new Date().toISOString() });
});

registerOrderHandlers(responder, subscriber);
startOutboxPublisher(prisma, publisher);

app.listen(PORT, () => {
  log(SERVICE_NAME, `Order Service started on port ${PORT}`);
});
