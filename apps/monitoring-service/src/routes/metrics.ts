import { Router } from "express";
import { PrismaClient } from "../generated/prisma";
import { Metrics } from "../../../../packages/contracts/src/monitoring";

export const metricsRouter = Router();

const prisma = new PrismaClient();

metricsRouter.get("/", async (_req, res) => {
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
  const serviceUptimes = await getServiceUptimes();

  const metrics: Metrics = {
    totalOrders,
    completedOrders,
    failedOrders,
    paymentFailureRate,
    inventoryFailureRate,
    averageResponseTime: 0,
    activeServices: serviceUptimes.filter(s => s.status === "UP").length,
    ordersPerMinute: ordersLastMinute,
    paymentSuccessCount: events.filter(e => e.eventType === "payment.completed").length,
    paymentFailureCount: paymentFailedEvents,
    inventoryFailureCount: inventoryFailedEvents,
    serviceUptimes: Object.fromEntries(serviceUptimes.map(s => [s.name, s.uptime]))
  };

  res.json(metrics);
});

async function getOrdersLastMinute(): Promise<number> {
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
  const count = await prisma.order.count({
    where: { createdAt: { gte: oneMinuteAgo } }
  });
  return count;
}

async function getServiceUptimes(): Promise<Array<{ name: string; status: "UP" | "DOWN"; uptime: number }>> {
  return [
    { name: "api-gateway", status: "UP", uptime: 3600 },
    { name: "order-service", status: "UP", uptime: 3600 },
    { name: "payment-service", status: "UP", uptime: 3600 },
    { name: "inventory-service", status: "UP", uptime: 3600 },
    { name: "notification-service", status: "UP", uptime: 3600 }
  ];
}