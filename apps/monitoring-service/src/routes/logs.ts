import { Router } from "express";
import { PrismaClient } from "../generated/prisma";
import { LogEntry } from "../../../../packages/contracts/src/monitoring";

export const logsRouter = Router();

const prisma = new PrismaClient();

logsRouter.get("/", async (req, res) => {
  const {
    service,
    level,
    correlationId,
    orderId,
    limit = "100"
  } = req.query;

  const where: any = {};

  if (correlationId) {
    where.correlationId = correlationId as string;
  }

  if (orderId) {
    where.orderId = orderId as string;
  }

  if (service || level) {
    where.AND = [];
    if (service) {
      where.AND.push({
        eventType: { contains: service as string, mode: "insensitive" }
      });
    }
  }

  const events = await prisma.orderEvent.findMany({
    where,
    take: parseInt(limit as string),
    orderBy: { createdAt: "desc" }
  });

  const logs: LogEntry[] = events.map(event => ({
    id: event.id,
    service: getServiceFromEvent(event.eventType),
    level: getLevelFromEvent(event.eventType),
    message: formatEventMessage(event.eventType, event.payload as Record<string, unknown>),
    orderId: event.orderId,
    correlationId: event.correlationId,
    eventType: event.eventType,
    timestamp: event.createdAt.toISOString()
  }));

  if (service) {
    return res.json(logs.filter(log => log.service === service));
  }

  res.json(logs);
});

function getServiceFromEvent(eventType: string): string {
  if (eventType.startsWith("order.")) return "order-service";
  if (eventType.startsWith("payment.")) return "payment-service";
  if (eventType.startsWith("inventory.")) return "inventory-service";
  if (eventType.startsWith("notification.")) return "notification-service";
  return "unknown";
}

function getLevelFromEvent(eventType: string): LogEntry["level"] {
  if (eventType.includes("failed") || eventType.includes("refund")) return "error";
  if (eventType.includes("reserved") || eventType.includes("completed")) return "info";
  return "debug";
}

function formatEventMessage(eventType: string, payload: Record<string, unknown>): string {
  const orderId = payload?.orderId || payload?.id || "";
  return `${eventType} ${orderId ? `(order: ${orderId})` : ""}`.trim();
}