# Order Processing Microservices V3

V3 is a TypeScript microservice demo using Express.js, cote.js, PostgreSQL, Prisma and Docker Compose. The goal is to show more than "services emitting events": each service owns its own data, failure paths are explicit, and the inventory failure path triggers a refund compensation flow.

## Architecture

```txt
Client
  |
  v
Express API Gateway
  |
  | cote.js request/response
  v
Order Service  ---> order-db
  |
  | order.created
  v
Payment Service ---> payment-db
  |
  | payment.completed
  v
Inventory Service ---> inventory-db
  |
  | inventory.reserved / inventory.failed
  v
Order Service
  |
  | order.completed / order.failed / payment.refund_requested
  v
Notification Service ---> notification-db
```

## What V3 Demonstrates

- TypeScript service code
- Express API Gateway with Zod validation and Swagger UI
- cote.js request/response and publish/subscribe
- Separate PostgreSQL database per service
- Prisma schemas per service
- Order lifecycle tracking and event timeline
- Correlation IDs carried through every command/event
- Payment retry attempts
- Failure simulation
- Refund compensation after inventory failure
- Simple Order Service outbox worker

## Services

| Service | Responsibility | Database |
| --- | --- | --- |
| `api-gateway` | HTTP routing, validation, correlation ID | none |
| `order-service` | Order creation, state machine, timeline, outbox | `order_db` |
| `payment-service` | Payment simulation, retry attempts, refunds | `payment_db` |
| `inventory-service` | Product stock and reservations | `inventory_db` |
| `notification-service` | Mock notification records | `notification_db` |

## Event Flow

Happy path:

```txt
order.created
payment.completed
inventory.reserved
order.completed
notification.sent
```

Payment failure:

```txt
order.created
payment.failed
order.failed
notification.sent
```

Inventory failure with compensation:

```txt
order.created
payment.completed
inventory.failed
order.failed
payment.refund_requested
payment.refunded
notification.sent
```

## API

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/health` | Checks all internal services |
| `GET` | `/docs` | Swagger UI |
| `POST` | `/orders` | Creates an order |
| `GET` | `/orders` | Lists orders |
| `GET` | `/orders/:id` | Gets one order |
| `GET` | `/orders/:id/timeline` | Gets order event timeline |

## Run with Docker Compose

```bash
docker compose up --build
```

Open Swagger:

```txt
http://localhost:3000/docs
```

## Local Development

Run PostgreSQL databases first, then:

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run db:push
npm run dev
```

## Demo Scenario 1: Successful Order

```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-1",
    "items": [
      {
        "productId": "product-1",
        "quantity": 2,
        "price": 100
      }
    ],
    "simulatePaymentFailure": false,
    "simulateInventoryFailure": false
  }'
```

Expected timeline:

```txt
order.created
payment.completed
inventory.reserved
order.completed
notification.sent
```

## Demo Scenario 2: Payment Failure

```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-1",
    "items": [
      {
        "productId": "product-1",
        "quantity": 2,
        "price": 100
      }
    ],
    "simulatePaymentFailure": true
  }'
```

Expected timeline:

```txt
order.created
payment.failed
order.failed
notification.sent
```

## Demo Scenario 3: Inventory Failure and Refund

```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-1",
    "items": [
      {
        "productId": "product-1",
        "quantity": 9999,
        "price": 100
      }
    ],
    "simulateInventoryFailure": true
  }'
```

Expected timeline:

```txt
order.created
payment.completed
inventory.failed
order.failed
payment.refund_requested
payment.refunded
notification.sent
```

## Portfolio Summary

```txt
Built an event-driven Node.js microservice demo using Express.js, cote.js, PostgreSQL, Prisma and Docker Compose. Implemented service-to-service communication, publish/subscribe event flow, distributed order lifecycle tracking, correlation IDs, failure simulation and compensation logic for refund scenarios.
```
