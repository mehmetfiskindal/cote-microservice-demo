import "dotenv/config";
const cote = require("cote");

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

registerPaymentSubscribers(responder, subscriber, publisher);

log(SERVICE_NAME, "Payment Service started");
