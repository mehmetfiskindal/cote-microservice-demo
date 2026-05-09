import { Request, Response } from "express";
import { Metrics, MetricsStreamEvent } from "../../../../packages/contracts/src/monitoring";
import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

export function createMetricsStream() {
  return async (req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    res.flushHeaders();

    const sendEvent = (event: MetricsStreamEvent) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    const interval = setInterval(async () => {
      try {
        const metrics = await calculateMetrics();
        sendEvent({
          type: "metrics",
          data: metrics,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        console.error("Metrics stream error:", err);
      }
    }, 3000);

    const orderInterval = setInterval(async () => {
      try {
        const recentOrder = await prisma.order.findFirst({
          orderBy: { createdAt: "desc" }
        });

        if (recentOrder) {
          sendEvent({
            type: "order_created",
            data: {
              orderId: recentOrder.id,
              correlationId: recentOrder.correlationId,
              timestamp: recentOrder.createdAt.toISOString()
            },
            timestamp: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error("Order stream error:", err);
      }
    }, 5000);

    req.on("close", () => {
      clearInterval(interval);
      clearInterval(orderInterval);
    });
  };
}

async function calculateMetrics(): Promise<Metrics> {
  const orders = await prisma.order.findMany();
  const events = await prisma.orderEvent.findMany();

  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => o.status === "COMPLETED").length;
  const failedOrders = orders.filter(o => o.status === "FAILED").length;

  const paymentFailedEvents = events.filter(e => e.eventType === "payment.failed").length;
  const inventoryFailedEvents = events.filter(e => e.eventType === "inventory.failed").length;

  const paymentFailureRate = totalOrders > 0 ? (paymentFailedEvents / totalOrders) * 100 : 0;
  const inventoryFailureRate = totalOrders > 0 ? (inventoryFailedEvents / totalOrders) * 100 : 0;

  const ordersLastMinute = await getOrdersLastMinute();

  return {
    totalOrders,
    completedOrders,
    failedOrders,
    paymentFailureRate,
    inventoryFailureRate,
    averageResponseTime: 0,
    activeServices: 5,
    ordersPerMinute: ordersLastMinute,
    paymentSuccessCount: events.filter(e => e.eventType === "payment.completed").length,
    paymentFailureCount: paymentFailedEvents,
    inventoryFailureCount: inventoryFailedEvents,
    serviceUptimes: {
      "api-gateway": 3600,
      "order-service": 3600,
      "payment-service": 3600,
      "inventory-service": 3600,
      "notification-service": 3600
    }
  };
}

async function getOrdersLastMinute(): Promise<number> {
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
  return prisma.order.count({
    where: { createdAt: { gte: oneMinuteAgo } }
  });
}