const cote = require("cote");
const crypto = require("crypto");

// In-memory orders storage
const orders = [];

// Create cote Responder
const orderResponder = new cote.Responder({
  name: "Order Service Responder",
  key: "order"
});

// Create cote Publisher
const orderPublisher = new cote.Publisher({
  name: "Order Service Publisher",
  broadcasts: ["order.created"]
});

console.log("╔════════════════════════════════════════════════════════╗");
console.log("║          📦 Order Service Started                      ║");
console.log("╠════════════════════════════════════════════════════════╣");
console.log("║  Waiting for requests...                               ║");
console.log("╚════════════════════════════════════════════════════════╝");

// Handle get all orders request
orderResponder.on("getOrders", async (req) => {
  console.log("[Order Service] Fetching all orders");
  return {
    message: "Orders retrieved successfully",
    count: orders.length,
    orders
  };
});

// Handle get order by ID request
orderResponder.on("getOrder", async (req) => {
  const { orderId } = req.payload;
  console.log(`[Order Service] Fetching order: ${orderId}`);

  const order = orders.find(o => o.id === orderId);

  if (!order) {
    return {
      message: "Order not found",
      order: null
    };
  }

  return {
    message: "Order retrieved successfully",
    order
  };
});

// Handle create order request
orderResponder.on("createOrder", async (req) => {
  const { userId, items, totalPrice } = req.payload;

  console.log("[Order Service] Creating new order for user:", userId);

  // Create new order
  const order = {
    id: crypto.randomUUID(),
    userId,
    items,
    totalPrice,
    status: "CREATED",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Save order
  orders.push(order);

  console.log("[Order Service] ✓ Order created:", order.id);

  // Publish event
  orderPublisher.publish("order.created", {
    orderId: order.id,
    userId: order.userId,
    items: order.items,
    totalPrice: order.totalPrice,
    createdAt: order.createdAt
  });

  console.log("[Order Service] 📢 Event published: order.created");

  return {
    message: "Order created successfully",
    order
  };
});
