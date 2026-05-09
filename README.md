# Cote.js Microservice Demo

## Why this project exists

This project is a portfolio-friendly Node.js microservice demo. It does not claim to be a production microservice platform; instead, it demonstrates the core communication patterns behind microservice systems with a small order-processing flow.

The demo uses Express.js as the external API Gateway and cote.js for internal service communication. It includes request/response messaging, publish/subscribe events, shared message contracts, correlation IDs, failure simulation, order lifecycle tracking, structured logs, Swagger docs, validation, and Docker-based service orchestration.

## Architecture

```txt
Client
  |
  v
API Gateway - Express.js
  |
  | request/response: order.create
  v
Order Service - cote Responder + Publisher + Subscriber
  |
  +--> order.created
          |
          v
      Payment Service
          |
          +--> payment.completed
          |       |
          |       v
          |   Inventory Service
          |       |
          |       +--> inventory.reserved
          |               |
          |               v
          |           Order Service updates order to COMPLETED
          |               |
          |               +--> order.completed
          |                       |
          |                       v
          |                   Notification Service
          |
          +--> payment.failed
                  |
                  v
              Order Service updates order to FAILED
                  |
                  +--> order.failed
                          |
                          v
                      Notification Service
```

## Services

| Service | Role | Communication |
| --- | --- | --- |
| `api-gateway` | External HTTP interface, request validation, Swagger docs | Express + cote Requester |
| `order-service` | Order state machine and in-memory event timeline | cote Responder, Publisher, Subscriber |
| `payment-service` | Simulated payment processing with random failure | cote Subscriber + Publisher |
| `inventory-service` | Stock reservation after successful payment | cote Subscriber + Publisher |
| `notification-service` | Completion/failure notification simulation | cote Subscriber + Publisher |

## Communication patterns

The services communicate through shared message contracts in `packages/contracts` instead of direct imports between service folders or HTTP calls between internal services.

```txt
packages/contracts/
  commands.js
  events.js
```

The API Gateway uses request/response commands such as `order.create` and `order.getById`. Domain changes are propagated through events such as `order.created`, `payment.completed`, `inventory.reserved`, `order.completed`, and `order.failed`.

## Event flow

Successful order flow:

```txt
order.created
payment.completed
inventory.reserved
order.completed
notification.sent
```

Failed payment flow:

```txt
order.created
payment.failed
order.failed
notification.sent
```

Failed inventory flow:

```txt
order.created
payment.completed
inventory.failed
order.failed
notification.sent
```

## Order statuses

```txt
PENDING
PAYMENT_COMPLETED
INVENTORY_RESERVED
COMPLETED
FAILED
```

## Failure flow

The payment service intentionally fails some requests:

```js
const isPaymentSuccessful = Math.random() > 0.3;
```

This makes the demo useful for showing how an event-driven system reacts when part of the flow fails. The order service records the failure event, updates the order status to `FAILED`, and publishes `order.failed` so the notification service can react.

## Correlation IDs and logs

Every `POST /orders` request receives a `correlationId` from the API Gateway. That ID is carried through every command/event and appears in structured JSON logs.

Example log:

```json
{
  "service": "payment-service",
  "message": "Payment completed",
  "orderId": "order-id",
  "correlationId": "correlation-id",
  "timestamp": "2026-05-10T12:00:00.000Z"
}
```

This demonstrates the basic idea behind distributed tracing without adding a full tracing stack.

## API endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/health` | Gateway and order-service health |
| `GET` | `/docs` | Swagger UI |
| `POST` | `/orders` | Create an order |
| `GET` | `/orders` | List orders |
| `GET` | `/orders/:id` | Get one order |
| `GET` | `/orders/:id/timeline` | Get event timeline for one order |

## How to run

### Local development

```bash
npm install
npm run dev
```

### Docker Compose

```bash
docker compose up --build
```

Then open:

```txt
http://localhost:3000/docs
```

## Example requests

Create an order:

```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-1",
    "items": [
      {
        "productId": "product-1",
        "quantity": 2
      }
    ],
    "totalPrice": 500
  }'
```

Get the order:

```bash
curl http://localhost:3000/orders/<order-id>
```

Get the event timeline:

```bash
curl http://localhost:3000/orders/<order-id>/timeline
```

Validation example:

```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "",
    "items": [],
    "totalPrice": 0
  }'
```

## Project structure

```txt
cote-microservis-demo/
  apps/
    api-gateway/
    order-service/
    payment-service/
    inventory-service/
    notification-service/
  packages/
    contracts/
      commands.js
      events.js
    shared/
      logger.js
  Dockerfile
  docker-compose.yml
  package.json
```

## Why cote.js?

This demo uses cote.js to explore zero-configuration service communication in Node.js. It is useful for learning request/response and publish/subscribe patterns without setting up a heavier broker first.

In production systems, alternatives such as RabbitMQ, Kafka, Redis Pub/Sub, NATS, or AWS SNS/SQS can also be used depending on durability, scalability, ordering, throughput, and operational needs.

## What I learned

- How to expose one HTTP API Gateway while keeping internal services decoupled.
- How to model request/response commands separately from publish/subscribe events.
- Why shared contracts matter in event-driven systems.
- How correlation IDs help trace one business flow across multiple services.
- How failure events affect order state and downstream notifications.
- Why an event timeline is useful for debugging distributed workflows.

## Possible improvements

- Persist orders and events with PostgreSQL + Prisma.
- Add retry and dead-letter simulations.
- Add authentication at the API Gateway.
- Add integration tests that boot all services.
- Replace in-memory event storage with durable event persistence.
- Compare the same flow with RabbitMQ, Kafka, NATS, or Redis Streams.

## Portfolio description

```txt
A Node.js microservice demo using Express.js as an API Gateway and cote.js for internal service communication. The project demonstrates request/response messaging, publish/subscribe events, order lifecycle tracking, correlation IDs, failure simulation and Docker-based service orchestration.
```

Turkish version:

```txt
Express.js API Gateway ve cote.js servis iletişimi kullanılarak geliştirilmiş event-driven microservice demo projesi. Sipariş oluşturma, ödeme simülasyonu, stok rezervasyonu, bildirim gönderimi, correlation ID, event timeline ve hata senaryolarını içerir.
```
