const crypto = require("crypto");
const express = require("express");
const cors = require("cors");
const cote = require("cote");
const swaggerUi = require("swagger-ui-express");
const { z } = require("zod");
const { ORDER_COMMANDS, SERVICE_COMMANDS } = require("../../../packages/contracts/commands");
const { log, error } = require("../../../packages/shared/logger");

const SERVICE_NAME = "api-gateway";
const app = express();

const createOrderSchema = z.object({
  userId: z.string().min(1),
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().min(1)
  })).min(1),
  totalPrice: z.number().positive()
});

const openApiDocument = {
  openapi: "3.0.0",
  info: {
    title: "Cote.js Microservice Demo API",
    version: "1.0.0",
    description: "Express API Gateway for an event-driven order processing demo."
  },
  paths: {
    "/health": {
      get: {
        summary: "Gateway and order service health",
        responses: { 200: { description: "Health status" } }
      }
    },
    "/orders": {
      get: {
        summary: "List orders",
        responses: { 200: { description: "Orders" } }
      },
      post: {
        summary: "Create order",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateOrderRequest" }
            }
          }
        },
        responses: {
          201: { description: "Order created" },
          400: { description: "Validation error" }
        }
      }
    },
    "/orders/{id}": {
      get: {
        summary: "Get order by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Order" },
          404: { description: "Order not found" }
        }
      }
    },
    "/orders/{id}/timeline": {
      get: {
        summary: "Get event timeline for an order",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Order timeline" } }
      }
    }
  },
  components: {
    schemas: {
      CreateOrderRequest: {
        type: "object",
        required: ["userId", "items", "totalPrice"],
        properties: {
          userId: { type: "string", example: "user-1" },
          items: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              required: ["productId", "quantity"],
              properties: {
                productId: { type: "string", example: "product-1" },
                quantity: { type: "integer", minimum: 1, example: 2 }
              }
            }
          },
          totalPrice: { type: "number", minimum: 0.01, example: 500 }
        }
      }
    }
  }
};

app.use(cors());
app.use(express.json());
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

const orderRequester = new cote.Requester({
  name: "API Gateway Order Requester",
  key: "order"
});

const paymentRequester = new cote.Requester({
  name: "API Gateway Payment Requester",
  key: "payment"
});

const inventoryRequester = new cote.Requester({
  name: "API Gateway Inventory Requester",
  key: "inventory"
});

const notificationRequester = new cote.Requester({
  name: "API Gateway Notification Requester",
  key: "notification"
});

async function getDependencyHealth(name, requester, type) {
  try {
    return [name, await requester.send({ type })];
  } catch (err) {
    return [name, {
      status: "unavailable",
      error: err.message,
      timestamp: new Date().toISOString()
    }];
  }
}

app.get("/health", async (req, res) => {
  const dependencyEntries = await Promise.all([
    getDependencyHealth("orderService", orderRequester, ORDER_COMMANDS.HEALTH_CHECK),
    getDependencyHealth("paymentService", paymentRequester, SERVICE_COMMANDS.PAYMENT_HEALTH_CHECK),
    getDependencyHealth("inventoryService", inventoryRequester, SERVICE_COMMANDS.INVENTORY_HEALTH_CHECK),
    getDependencyHealth("notificationService", notificationRequester, SERVICE_COMMANDS.NOTIFICATION_HEALTH_CHECK)
  ]);

  const dependencies = Object.fromEntries(dependencyEntries);
  const isHealthy = Object.values(dependencies).every(dependency => dependency.status === "ok");

  if (!isHealthy) {
    error(SERVICE_NAME, "Health check degraded", { dependencies });
  }

  res.status(isHealthy ? 200 : 503).json({
    service: SERVICE_NAME,
    status: isHealthy ? "ok" : "degraded",
    dependencies,
    timestamp: new Date().toISOString()
  });
});

app.get("/orders", async (req, res) => {
  try {
    const result = await orderRequester.send({
      type: ORDER_COMMANDS.GET_ORDERS
    });
    res.status(200).json(result);
  } catch (err) {
    error(SERVICE_NAME, "Could not fetch orders", { error: err.message });
    res.status(500).json({
      message: "Could not fetch orders",
      error: err.message
    });
  }
});

app.post("/orders", async (req, res) => {
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

  const correlationId = crypto.randomUUID();

  try {
    log(SERVICE_NAME, "Received order creation request", { correlationId });

    const result = await orderRequester.send({
      type: ORDER_COMMANDS.CREATE_ORDER,
      payload: {
        ...parsed.data,
        correlationId
      }
    });

    res.status(201).json(result);
  } catch (err) {
    error(SERVICE_NAME, "Order could not be created", {
      correlationId,
      error: err.message
    });
    res.status(500).json({
      message: "Order could not be created",
      correlationId,
      error: err.message
    });
  }
});

app.get("/orders/:id", async (req, res) => {
  try {
    const result = await orderRequester.send({
      type: ORDER_COMMANDS.GET_ORDER,
      payload: { orderId: req.params.id }
    });

    if (!result.order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json(result);
  } catch (err) {
    error(SERVICE_NAME, "Could not fetch order", {
      orderId: req.params.id,
      error: err.message
    });
    res.status(500).json({
      message: "Could not fetch order",
      error: err.message
    });
  }
});

app.get("/orders/:id/timeline", async (req, res) => {
  try {
    const result = await orderRequester.send({
      type: ORDER_COMMANDS.GET_ORDER_TIMELINE,
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
    error(SERVICE_NAME, "Could not fetch order timeline", {
      orderId: req.params.id,
      error: err.message
    });
    res.status(500).json({
      message: "Could not fetch order timeline",
      error: err.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  log(SERVICE_NAME, "API Gateway started", {
    port: PORT,
    docs: `http://localhost:${PORT}/docs`
  });
});
