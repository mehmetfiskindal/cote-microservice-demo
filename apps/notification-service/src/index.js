const cote = require("cote");

// Create cote Subscriber
const notificationSubscriber = new cote.Subscriber({
  name: "Notification Service Subscriber",
  subscribesTo: ["order.created"]
});

// In-memory notifications log
const notifications = [];

console.log("╔════════════════════════════════════════════════════════╗");
console.log("║          📧 Notification Service Started               ║");
console.log("╠════════════════════════════════════════════════════════╣");
console.log("║  Listening for order.created events...                 ║");
console.log("╚════════════════════════════════════════════════════════╝");

// Handle order.created event
notificationSubscriber.on("order.created", async (event) => {
  console.log("[Notification Service] 📨 Received order.created event");
  console.log("[Notification Service]   Order ID:", event.orderId);
  console.log("[Notification Service]   User ID:", event.userId);

  try {
    console.log("[Notification Service] Sending notifications...");

    // Simulate sending email notification
    const emailNotification = {
      type: "email",
      notificationId: `notif-${Date.now()}`,
      orderId: event.orderId,
      userId: event.userId,
      subject: `Order Confirmation #${event.orderId}`,
      message: `Your order for $${event.totalPrice} has been received and is being processed.`,
      sentAt: new Date().toISOString()
    };

    notifications.push(emailNotification);

    console.log("[Notification Service]   ✓ Email sent to user:", event.userId);
    console.log("[Notification Service]     Subject:", emailNotification.subject);
    console.log("[Notification Service]     Message:", emailNotification.message);

    // Simulate sending SMS notification
    const smsNotification = {
      type: "sms",
      notificationId: `sms-${Date.now()}`,
      orderId: event.orderId,
      userId: event.userId,
      message: `Order #${event.orderId.slice(-8)} confirmed! Total: $${event.totalPrice}`,
      sentAt: new Date().toISOString()
    };

    notifications.push(smsNotification);

    console.log("[Notification Service]   ✓ SMS sent");
    console.log("[Notification Service]     Message:", smsNotification.message);

    console.log("[Notification Service] ✓ All notifications sent successfully");
    console.log("─".repeat(50));

  } catch (error) {
    console.error("[Notification Service] ✗ Notification sending failed:", error.message);
  }
});
