# Order Processing Microservices V3

V3 is a TypeScript microservice demo using Express.js, cote.js, PostgreSQL, Prisma and Docker Compose. The goal is to show more than "services emitting events": each service owns its own data, failure paths are explicit, and the inventory failure path triggers a refund compensation flow.

A custom monitoring dashboard built with Gea.js provides real-time observability into the system.

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

---

Monitoring Service <--- (reads from order-db)
  |
  v
Monitoring Dashboard (Gea.js)
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
- **Custom monitoring dashboard with real-time SSE streaming**

## Services

| Service | Responsibility | Database | Port |
| --- | --- | --- | --- |
| `api-gateway` | HTTP routing, validation, correlation ID | none | 3000 |
| `order-service` | Order creation, state machine, timeline, outbox | `order_db` | 3001 |
| `payment-service` | Payment simulation, retry attempts, refunds | `payment_db` | 3002 |
| `inventory-service` | Product stock and reservations | `inventory_db` | 3003 |
| `notification-service` | Mock notification records | `notification_db` | 3004 |
| `monitoring-service` | Aggregates health, logs, metrics, timelines | reads from `order_db` | 4000 |
| `monitoring-dashboard` | Gea.js reactive UI for monitoring | - | 5173 |

## Monitoring Dashboard

Built a custom monitoring dashboard for the event-driven microservice system. The dashboard visualizes:

- **Service Health** — Real-time status (UP/DOWN) and uptime for all services
- **Order Timeline** — Visual flow of orders through the system with success/failure paths
- **Structured Logs** — Filterable log entries with correlation ID tracing
- **Metrics** — Real-time streaming charts for orders per minute, success/failure rates
- **SSE Streaming** — Server-Sent Events for live data updates

### Dashboard Screens

1. **Overview** — KPI cards: total orders, completed, failed, failure rates, orders/min
2. **Services** — Service health list with status, uptime, last seen
3. **Orders Timeline** — Vertical stepper visualization of order event flows
4. **Logs** — Searchable logs with service/level/correlationId filters
5. **Metrics** — Real-time streaming charts with historical mini-graphs

### Dashboard Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/monitoring/services` | All services health status |
| `GET` | `/monitoring/orders/timeline` | Last N order timelines |
| `GET` | `/monitoring/orders/:id/timeline` | Single order timeline |
| `GET` | `/monitoring/logs` | Filtered log entries |
| `GET` | `/monitoring/metrics` | Aggregated metrics |
| `GET` | `/monitoring/metrics/stream` | SSE real-time metrics stream |

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

Services:

- API Gateway: http://localhost:3000/docs
- Monitoring Dashboard: http://localhost:5173

## Local Development

Run PostgreSQL databases first, then:

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run db:push
npm run dev
```

To run the monitoring dashboard separately:

```bash
cd apps/monitoring-dashboard
npm install
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
Built an event-driven Node.js microservice demo using Express.js, cote.js, PostgreSQL, Prisma and Docker Compose. Implemented service-to-service communication, publish/subscribe event flow, distributed order lifecycle tracking, correlation IDs, failure simulation and compensation logic for refund scenarios. Added a custom monitoring dashboard built with Gea.js for real-time observability, visualizing service health, order timelines, structured logs, and metrics via SSE streaming.
```