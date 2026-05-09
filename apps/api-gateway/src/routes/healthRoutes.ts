import { Router } from "express";
import { Commands } from "../../../../packages/contracts/src";
import {
  inventoryRequester,
  notificationRequester,
  orderRequester,
  paymentRequester
} from "../clients/coteClients";

export const healthRoutes = Router();

async function getDependencyHealth(name: string, requester: any, type: string) {
  try {
    return [name, await requester.send({ type })];
  } catch (err) {
    const error = err as Error;
    return [name, {
      status: "unavailable",
      error: error.message,
      timestamp: new Date().toISOString()
    }];
  }
}

healthRoutes.get("/", async (_req, res) => {
  const dependencyEntries = await Promise.all([
    getDependencyHealth("orderService", orderRequester, Commands.OrderHealth),
    getDependencyHealth("paymentService", paymentRequester, Commands.PaymentHealth),
    getDependencyHealth("inventoryService", inventoryRequester, Commands.InventoryHealth),
    getDependencyHealth("notificationService", notificationRequester, Commands.NotificationHealth)
  ]);

  const dependencies = Object.fromEntries(dependencyEntries);
  const isHealthy = Object.values(dependencies).every((dependency: any) => dependency.status === "ok");

  res.status(isHealthy ? 200 : 503).json({
    service: "api-gateway",
    status: isHealthy ? "ok" : "degraded",
    dependencies,
    timestamp: new Date().toISOString()
  });
});
