import { Router } from "express";
import { Commands } from "../../../../packages/contracts/src";
import { createCorrelationId, logError } from "../../../../packages/shared/src";
import { orderRequester } from "../clients/coteClients";
import { createOrderSchema } from "../validators/orderValidator";

const SERVICE_NAME = "api-gateway";

export const orderRoutes = Router();

orderRoutes.get("/", async (_req, res) => {
  try {
    const result = await orderRequester.send({
      type: Commands.GetOrders
    });

    res.status(200).json(result);
  } catch (err) {
    const error = err as Error;
    logError(SERVICE_NAME, "Could not fetch orders", { error: error.message });
    res.status(500).json({ message: "Could not fetch orders", error: error.message });
  }
});

orderRoutes.post("/", async (req, res) => {
  const parsed = createOrderSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Validation failed",
      issues: parsed.error.issues.map(issue => ({
        path: issue.path.join("."),
        message: issue.message
      }))
    });
  }

  const correlationId = createCorrelationId();

  try {
    const result = await orderRequester.send({
      type: Commands.CreateOrder,
      payload: {
        ...parsed.data,
        correlationId
      }
    });

    res.status(201).json(result);
  } catch (err) {
    const error = err as Error;
    logError(SERVICE_NAME, "Could not create order", {
      correlationId,
      error: error.message
    });
    res.status(500).json({
      message: "Could not create order",
      correlationId,
      error: error.message
    });
  }
});

orderRoutes.get("/:id", async (req, res) => {
  try {
    const result = await orderRequester.send({
      type: Commands.GetOrder,
      payload: { orderId: req.params.id }
    });

    if (!result.order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json(result);
  } catch (err) {
    const error = err as Error;
    logError(SERVICE_NAME, "Could not fetch order", {
      orderId: req.params.id,
      error: error.message
    });
    res.status(500).json({ message: "Could not fetch order", error: error.message });
  }
});

orderRoutes.get("/:id/timeline", async (req, res) => {
  try {
    const result = await orderRequester.send({
      type: Commands.GetOrderTimeline,
      payload: { orderId: req.params.id }
    });

    if (!result.events.length) {
      return res.status(404).json({
        message: "Order timeline not found",
        orderId: req.params.id,
        events: []
      });
    }

    res.status(200).json(result);
  } catch (err) {
    const error = err as Error;
    logError(SERVICE_NAME, "Could not fetch order timeline", {
      orderId: req.params.id,
      error: error.message
    });
    res.status(500).json({ message: "Could not fetch timeline", error: error.message });
  }
});
