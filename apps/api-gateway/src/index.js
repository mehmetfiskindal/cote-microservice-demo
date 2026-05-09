const express = require("express");
const cors = require("cors");
const cote = require("cote");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Create cote Requester for order service
const orderRequester = new cote.Requester({
  name: "API Gateway Order Requester",
  key: "order"
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "API Gateway is running",
    timestamp: new Date().toISOString(),
    service: "api-gateway"
  });
});

// Get all orders endpoint
app.get("/orders", async (req, res) => {
  try {
    const result = await orderRequester.send({
      type: "getOrders"
    });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      message: "Could not fetch orders",
      error: error.message
    });
  }
});

// Create order endpoint
app.post("/orders", async (req, res) => {
  try {
    const { userId, items, totalPrice } = req.body;

    // Basic validation
    if (!userId || !items || !totalPrice) {
      return res.status(400).json({
        message: "Missing required fields: userId, items, totalPrice"
      });
    }

    const result = await orderRequester.send({
      type: "createOrder",
      payload: {
        userId,
        items,
        totalPrice
      }
    });

    res.status(201).json(result);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({
      message: "Order could not be created",
      error: error.message
    });
  }
});

// Get order by ID endpoint
app.get("/orders/:id", async (req, res) => {
  try {
    const result = await orderRequester.send({
      type: "getOrder",
      payload: { orderId: req.params.id }
    });

    if (!result.order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      message: "Could not fetch order",
      error: error.message
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║          🚀 API Gateway Service Started                ║");
  console.log("╠════════════════════════════════════════════════════════╣");
  console.log(`║  Running on http://localhost:${PORT}                      ║`);
  console.log("║                                                        ║");
  console.log("║  Endpoints:                                            ║");
  console.log("║    GET  /health    - Health check                      ║");
  console.log("║    GET  /orders    - Get all orders                    ║");
  console.log("║    GET  /orders/:id - Get order by ID                  ║");
  console.log("║    POST /orders    - Create new order                  ║");
  console.log("╚════════════════════════════════════════════════════════╝");
});
