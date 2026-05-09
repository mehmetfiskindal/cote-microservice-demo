import "dotenv/config";
const cote = require("cote");

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

registerInventorySubscribers(responder, subscriber, publisher);

seedInventory()
  .then(() => log(SERVICE_NAME, "Inventory Service started"))
  .catch(err => logError(SERVICE_NAME, "Inventory seed failed", { error: err.message }));
