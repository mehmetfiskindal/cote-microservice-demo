const cote = require("cote");

// Create cote Subscriber
const paymentSubscriber = new cote.Subscriber({
  name: "Payment Service Subscriber",
  subscribesTo: ["order.created"]
});

// In-memory payments storage
const payments = [];

console.log("╔════════════════════════════════════════════════════════╗");
console.log("║          💳 Payment Service Started                    ║");
console.log("╠════════════════════════════════════════════════════════╣");
console.log("║  Listening for order.created events...                 ║");
console.log("╚════════════════════════════════════════════════════════╝");

// Handle order.created event
paymentSubscriber.on("order.created", async (event) => {
  console.log("[Payment Service] 📨 Received order.created event");
  console.log("[Payment Service]   Order ID:", event.orderId);
  console.log("[Payment Service]   Amount:", event.totalPrice);

  try {
    // Simulate payment processing
    console.log("[Payment Service] Processing payment...");

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Create payment record
    const payment = {
      paymentId: `pay-${Date.now()}`,
      orderId: event.orderId,
      userId: event.userId,
      status: "PAID",
      amount: event.totalPrice,
      currency: "USD",
      paymentMethod: "credit_card",
      paidAt: new Date().toISOString()
    };

    payments.push(payment);

    console.log("[Payment Service] ✓ Payment processed successfully");
    console.log("[Payment Service]   Payment ID:", payment.paymentId);
    console.log("[Payment Service]   Status:", payment.status);
    console.log("[Payment Service]   Amount:", payment.amount);
    console.log("─".repeat(50));

  } catch (error) {
    console.error("[Payment Service] ✗ Payment processing failed:", error.message);
  }
});
