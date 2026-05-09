import { Commands, Events } from "../../../../packages/contracts/src";
import { log, logError } from "../../../../packages/shared/src";
import { getInventoryHealth, reserveInventory } from "../repositories/inventoryRepository";

const SERVICE_NAME = "inventory-service";

export function registerInventorySubscribers(responder: any, subscriber: any, publisher: any) {
  responder.on(Commands.InventoryHealth, getInventoryHealth);

  subscriber.on(Events.PaymentCompleted, async (event: any) => {
    try {
      log(SERVICE_NAME, "Payment completed received", {
        orderId: event.payload.orderId,
        correlationId: event.correlationId
      });

      const resultEvent = await reserveInventory(event);
      publisher.publish(resultEvent.eventType, resultEvent);

      log(SERVICE_NAME, "Inventory event published", {
        eventType: resultEvent.eventType,
        orderId: resultEvent.payload.orderId,
        correlationId: resultEvent.correlationId
      });
    } catch (err) {
      const error = err as Error;
      logError(SERVICE_NAME, "Inventory reservation failed unexpectedly", {
        correlationId: event.correlationId,
        error: error.message
      });
    }
  });
}
