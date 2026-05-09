const cote = require("cote");

// Create cote Subscriber
const inventorySubscriber = new cote.Subscriber({
  name: "Inventory Service Subscriber",
  subscribesTo: ["order.created"]
});

// Mock inventory data
const inventory = {
  "product-1": { name: "Laptop", stock: 100 },
  "product-2": { name: "Mouse", stock: 200 },
  "product-3": { name: "Keyboard", stock: 150 },
  "product-4": { name: "Monitor", stock: 80 }
};

console.log("╔════════════════════════════════════════════════════════╗");
console.log("║          📦 Inventory Service Started                  ║");
console.log("╠════════════════════════════════════════════════════════╣");
console.log("║  Listening for order.created events...                 ║");
console.log("╚════════════════════════════════════════════════════════╝");

// Handle order.created event
inventorySubscriber.on("order.created", async (event) => {
  console.log("[Inventory Service] 📨 Received order.created event");
  console.log("[Inventory Service]   Order ID:", event.orderId);
  console.log("[Inventory Service]   Items count:", event.items.length);

  try {
    console.log("[Inventory Service] Updating inventory...");

    // Process each item in the order
    for (const item of event.items) {
      const productId = item.productId;
      const quantity = item.quantity;

      if (inventory[productId]) {
        const beforeStock = inventory[productId].stock;
        inventory[productId].stock -= quantity;

        console.log(`[Inventory Service]   ↓ ${productId} (${inventory[productId].name})`);
        console.log(`[Inventory Service]     Stock: ${beforeStock} → ${inventory[productId].stock}`);

        if (inventory[productId].stock < 10) {
          console.log(`[Inventory Service]     ⚠️  Low stock warning!`);
        }
      } else {
        console.log(`[Inventory Service]   ✗ Product not found: ${productId}`);
      }
    }

    console.log("[Inventory Service] ✓ Inventory updated successfully");
    console.log("─".repeat(50));

  } catch (error) {
    console.error("[Inventory Service] ✗ Inventory update failed:", error.message);
  }
});
