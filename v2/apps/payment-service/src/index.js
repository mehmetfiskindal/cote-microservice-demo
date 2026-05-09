const cote = require("cote");
const { SERVICE_COMMANDS } = require("../../../packages/contracts/commands");
const { ORDER_EVENTS } = require("../../../packages/contracts/events");
const { log, error } = require("../../../packages/shared/logger");

const SERVICE_NAME = "payment-service";
const payments = [];

const paymentResponder = new cote.Responder({
  name: "Payment Service Responder",
  key: "payment"
});

const paymentSubscriber = new cote.Subscriber({
  name: "Payment Service Subscriber",
  subscribesTo: [ORDER_EVENTS.ORDER_CREATED]
});

const paymentPublisher = new cote.Publisher({
  name: "Payment Service Publisher",
  broadcasts: [ORDER_EVENTS.PAYMENT_COMPLETED, ORDER_EVENTS.PAYMENT_FAILED]
});

log(SERVICE_NAME, "Payment Service started", {
  listeningFor: ORDER_EVENTS.ORDER_CREATED
});

paymentResponder.on(SERVICE_COMMANDS.PAYMENT_HEALTH_CHECK, async () => ({
  service: SERVICE_NAME,
  status: "ok",
  payments: payments.length,
  timestamp: new Date().toISOString()
}));

paymentSubscriber.on(ORDER_EVENTS.ORDER_CREATED, async (event) => {
  log(SERVICE_NAME, "Received order created event", {
    orderId: event.orderId,
    correlationId: event.correlationId,
    amount: event.totalPrice
  });

  try {
    await new Promise(resolve => setTimeout(resolve, 500));

    const isPaymentSuccessful = Math.random() > 0.3;

    if (!isPaymentSuccessful) {
      const failedEvent = {
        correlationId: event.correlationId,
        orderId: event.orderId,
        userId: event.userId,
        amount: event.totalPrice,
        reason: "Payment provider rejected the transaction",
        failedAt: new Date().toISOString()
      };

      paymentPublisher.publish(ORDER_EVENTS.PAYMENT_FAILED, failedEvent);
      log(SERVICE_NAME, "Payment failed", failedEvent);
      return;
    }

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

    const completedEvent = {
      correlationId: event.correlationId,
      orderId: event.orderId,
      userId: event.userId,
      items: event.items,
      paymentId: payment.paymentId,
      amount: payment.amount,
      paidAt: payment.paidAt
    };

    paymentPublisher.publish(ORDER_EVENTS.PAYMENT_COMPLETED, completedEvent);
    log(SERVICE_NAME, "Payment completed", completedEvent);
  } catch (err) {
    error(SERVICE_NAME, "Payment processing crashed", {
      orderId: event.orderId,
      correlationId: event.correlationId,
      error: err.message
    });
  }
});
