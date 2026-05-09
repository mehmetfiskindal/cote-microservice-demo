import { Router } from "express";
import { ServiceHealth } from "../../../../packages/contracts/src/monitoring";

export const servicesRouter = Router();

const SERVICE_CONFIG = [
  { name: "api-gateway", healthUrl: "http://api-gateway:3000/health" },
  { name: "order-service", healthUrl: "http://order-service:3001/health" },
  { name: "payment-service", healthUrl: "http://payment-service:3002/health" },
  { name: "inventory-service", healthUrl: "http://inventory-service:3003/health" },
  { name: "notification-service", healthUrl: "http://notification-service:3004/health" }
];

const serviceStartTimes: Record<string, number> = {};

servicesRouter.get("/", async (_req, res) => {
  const services: ServiceHealth[] = [];
  const now = Date.now();

  await Promise.all(
    SERVICE_CONFIG.map(async (config) => {
      const startTime = Date.now();
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const response = await fetch(config.healthUrl, { signal: controller.signal });
        clearTimeout(timeout);

        if (response.ok) {
          if (!serviceStartTimes[config.name]) {
            serviceStartTimes[config.name] = now;
          }
          services.push({
            name: config.name,
            status: "UP",
            uptime: Math.floor((now - serviceStartTimes[config.name]) / 1000),
            lastSeen: new Date().toISOString(),
            responseTime: Date.now() - startTime
          });
        } else {
          services.push({
            name: config.name,
            status: "DOWN",
            uptime: serviceStartTimes[config.name]
              ? Math.floor((now - serviceStartTimes[config.name]) / 1000)
              : 0,
            lastSeen: new Date().toISOString()
          });
        }
      } catch {
        services.push({
          name: config.name,
          status: "DOWN",
          uptime: serviceStartTimes[config.name]
            ? Math.floor((now - serviceStartTimes[config.name]) / 1000)
            : 0,
          lastSeen: new Date().toISOString()
        });
      }
    })
  );

  services.sort((a, b) => a.name.localeCompare(b.name));
  res.json(services);
});