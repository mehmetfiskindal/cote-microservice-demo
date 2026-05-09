import "dotenv/config";
const cote = require("cote");
const express = require("express");

import { Events } from "../../../packages/contracts/src";
import { log, logError } from "../../../packages/shared/src";
import { seedInventory } from "./repositories/inventoryRepository";
import { registerInventorySubscribers } from "./subscribers/inventorySubscribers";

const SERVICE_NAME = "inventory-service";

const responder = new cote.Responder({
  name: "V3 Inventory Service Responder",
  key: "inventory"
});

const subscriber = new cote.Subscriber({
  name: "V3 Inventory Service Subscriber",
  subscribesTo: [Events.PaymentCompleted]
});

const publisher = new cote.Publisher({
  name: "V3 Inventory Service Publisher",
  broadcasts: [
    Events.InventoryReserved,
    Events.InventoryFailed
  ]
});

const app = express();
const PORT = process.env.PORT || 3003;

app.use(express.json());

app.get("/health", (_req: any, res: any) => {
  res.json({ status: "UP", service: SERVICE_NAME, timestamp: new Date().toISOString() });
});

registerInventorySubscribers(responder, subscriber, publisher);

seedInventory()
  .then(() => {
    app.listen(PORT, () => {
      log(SERVICE_NAME, `Inventory Service started on port ${PORT}`);
    });
  })
  .catch(err => logError(SERVICE_NAME, "Inventory seed failed", { error: err.message }));
