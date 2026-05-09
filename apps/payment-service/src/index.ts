import "dotenv/config";
const cote = require("cote");
const express = require("express");

import { Events } from "../../../packages/contracts/src";
import { log } from "../../../packages/shared/src";
import { registerPaymentSubscribers } from "./subscribers/paymentSubscribers";

const SERVICE_NAME = "payment-service";

const responder = new cote.Responder({
  name: "V3 Payment Service Responder",
  key: "payment"
});

const subscriber = new cote.Subscriber({
  name: "V3 Payment Service Subscriber",
  subscribesTo: [
    Events.OrderCreated,
    Events.PaymentRefundRequested
  ]
});

const publisher = new cote.Publisher({
  name: "V3 Payment Service Publisher",
  broadcasts: [
    Events.PaymentCompleted,
    Events.PaymentFailed,
    Events.PaymentRefunded
  ]
});

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());

app.get("/health", (_req: any, res: any) => {
  res.json({ status: "UP", service: SERVICE_NAME, timestamp: new Date().toISOString() });
});

registerPaymentSubscribers(responder, subscriber, publisher);

app.listen(PORT, () => {
  log(SERVICE_NAME, `Payment Service started on port ${PORT}`);
});
