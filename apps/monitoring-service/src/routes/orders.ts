import { Router } from "express";
import { PrismaClient } from "../generated/prisma";
import { TimelineEventEntry, OrderTimeline } from "../../../../packages/contracts/src/monitoring";

export const ordersRouter = Router();

const prisma = new PrismaClient();

ordersRouter.get("/timeline", async (req, res) => {
  const limit = parseInt(req.query.limit as string) || 20;

  const orders = await prisma.order.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      events: {
        orderBy: { createdAt: "asc" }
      }
    }
  });

  const timelines: OrderTimeline[] = orders.map(order => ({
    orderId: order.id,
    correlationId: order.correlationId,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    completedAt: order.updatedAt.toISOString(),
    events: order.events.map(event => ({
      event: event.eventType as TimelineEventEntry["event"],
      timestamp: event.createdAt.toISOString(),
      service: getServiceFromEvent(event.eventType),
      payload: event.payload as Record<string, unknown>
    }))
  }));

  res.json(timelines);
});

ordersRouter.get("/:id/timeline", async (req, res) => {
  const { id } = req.params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      events: {
        orderBy: { createdAt: "asc" }
      }
    }
  });

  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  const timeline: OrderTimeline = {
    orderId: order.id,
    correlationId: order.correlationId,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    completedAt: order.updatedAt.toISOString(),
    events: order.events.map(event => ({
      event: event.eventType as TimelineEventEntry["event"],
      timestamp: event.createdAt.toISOString(),
      service: getServiceFromEvent(event.eventType),
      payload: event.payload as Record<string, unknown>
    }))
  };

  res.json(timeline);
});

function getServiceFromEvent(eventType: string): string {
  if (eventType.startsWith("order.")) return "order-service";
  if (eventType.startsWith("payment.")) return "payment-service";
  if (eventType.startsWith("inventory.")) return "inventory-service";
  if (eventType.startsWith("notification.")) return "notification-service";
  return "unknown";
}