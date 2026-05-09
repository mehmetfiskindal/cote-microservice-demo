const cote = require("cote");

export const orderRequester = new cote.Requester({
  name: "V3 API Gateway Order Requester",
  key: "order"
});

export const paymentRequester = new cote.Requester({
  name: "V3 API Gateway Payment Requester",
  key: "payment"
});

export const inventoryRequester = new cote.Requester({
  name: "V3 API Gateway Inventory Requester",
  key: "inventory"
});

export const notificationRequester = new cote.Requester({
  name: "V3 API Gateway Notification Requester",
  key: "notification"
});
