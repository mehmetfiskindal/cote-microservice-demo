# 🚀 Cote.js Microservice Demo

This project demonstrates a basic event-driven microservice architecture using **Node.js**, **Express.js**, and **Cote.js**.

## 📋 Overview

This demo showcases a complete order processing system with multiple microservices communicating through event-driven architecture. It's perfect for learning microservices concepts and can be showcased in your portfolio.

## 🏗️ Architecture

```
┌─────────────────┐
│   Client/Postman │
└────────┬────────┘
         │ HTTP Request
         ▼
┌────────────────────────┐
│     API Gateway        │ (Express.js - Port 3000)
│   - HTTP Endpoints     │
│   - Request Routing    │
└────────┬───────────────┘
         │ cote.js Request/Response
         ▼
┌────────────────────────┐
│    Order Service       │ (cote.js Responder)
│   - Order Creation     │
│   - Event Publishing   │
└────────┬───────────────┘
         │ cote.js Publish/Subscribe
         ▼
┌──────────────┬──────────────┬──────────────┐
│   Payment    │  Inventory   │ Notification │
│   Service    │   Service    │   Service    │
│ - Payment    │ - Stock      │ - Email      │
│   Processing │   Updates    │ - SMS        │
└──────────────┴──────────────┴──────────────┘
```

## 🛠️ Services

### 1. API Gateway (`apps/api-gateway`)
- **Technology:** Express.js
- **Port:** 3000
- **Role:** External HTTP interface
- **Endpoints:**
  - `GET /health` - Health check
  - `GET /orders` - Get all orders
  - `GET /orders/:id` - Get order by ID
  - `POST /orders` - Create new order

### 2. Order Service (`apps/order-service`)
- **Technology:** cote.js Responder + Publisher
- **Role:** Order business logic
- **Features:**
  - Create orders
  - Store orders in memory
  - Publish `order.created` events

### 3. Payment Service (`apps/payment-service`)
- **Technology:** cote.js Subscriber
- **Role:** Payment processing simulation
- **Features:**
  - Listen for `order.created` events
  - Simulate payment processing
  - Log payment results

### 4. Inventory Service (`apps/inventory-service`)
- **Technology:** cote.js Subscriber
- **Role:** Stock management simulation
- **Features:**
  - Listen for `order.created` events
  - Update stock levels
  - Log inventory changes

### 5. Notification Service (`apps/notification-service`)
- **Technology:** cote.js Subscriber
- **Role:** User notification simulation
- **Features:**
  - Listen for `order.created` events
  - Simulate email notifications
  - Simulate SMS notifications

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository:**
```bash
git clone <your-repo-url>
cd cote-microservice-demo
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start all services:**
```bash
npm run dev
```

This will start all 5 services concurrently with hot reload using nodemon.

### Alternative: Start services individually

```bash
# Terminal 1 - API Gateway
npm run dev:api

# Terminal 2 - Order Service
npm run dev:order

# Terminal 3 - Payment Service
npm run dev:payment

# Terminal 4 - Inventory Service
npm run dev:inventory

# Terminal 5 - Notification Service
npm run dev:notification
```

## 🧪 Testing

### 1. Health Check
```bash
curl http://localhost:3000/health
```

### 2. Create an Order
```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-1",
    "items": [
      {
        "productId": "product-1",
        "quantity": 2
      },
      {
        "productId": "product-2",
        "quantity": 1
      }
    ],
    "totalPrice": 1500
  }'
```

### 3. Get All Orders
```bash
curl http://localhost:3000/orders
```

### 4. Get Specific Order
```bash
curl http://localhost:3000/orders/<order-id>
```

## 📊 Expected Output

When you create an order, you should see logs from all services:

```
# API Gateway
[API Gateway] Received order creation request

# Order Service
[Order Service] Creating new order for user: user-1
[Order Service] ✓ Order created: <uuid>
[Order Service] 📢 Event published: order.created

# Payment Service
[Payment Service] 📨 Received order.created event
[Payment Service] Processing payment...
[Payment Service] ✓ Payment processed successfully

# Inventory Service
[Inventory Service] 📨 Received order.created event
[Inventory Service] Updating inventory...
[Inventory Service] ✓ Inventory updated successfully

# Notification Service
[Notification Service] 📨 Received order.created event
[Notification Service] Sending notifications...
[Notification Service]   ✓ Email sent to user: user-1
[Notification Service]   ✓ SMS sent
[Notification Service] ✓ All notifications sent successfully
```

## 🐳 Docker Support

You can also run the entire system with Docker Compose:

```bash
# Build and start all services
docker-compose up --build

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📚 Key Concepts Demonstrated

### 1. **API Gateway Pattern**
- Single entry point for clients
- Request routing to internal services
- Protocol translation (HTTP → cote.js)

### 2. **Request/Response Pattern**
- API Gateway sends request to Order Service
- Order Service responds with result
- Synchronous communication

### 3. **Publish/Subscribe Pattern**
- Order Service publishes events
- Multiple services subscribe to events
- Asynchronous, decoupled communication

### 4. **Event-Driven Architecture**
- Services react to events
- Loose coupling between services
- Independent scaling

### 5. **Service Discovery**
- Automatic service discovery with cote.js
- No manual IP/port configuration
- Zero-configuration networking

## 📁 Project Structure

```
cote-microservice-demo/
│
├── package.json                 # Root package.json with all scripts
├── docker-compose.yml          # Docker orchestration
├── Dockerfile                  # Docker image definition
├── README.md                   # This file
│
└── apps/
    ├── api-gateway/            # HTTP API Gateway
    │   └── src/
    │       └── index.js
    │
    ├── order-service/          # Order business logic
    │   └── src/
    │       └── index.js
    │
    ├── payment-service/        # Payment processing
    │   └── src/
    │       └── index.js
    │
    ├── inventory-service/      # Inventory management
    │   └── src/
    │       └── index.js
    │
    └── notification-service/   # Notifications
        └── src/
            └── index.js
```

## 🔧 Technologies Used

- **Node.js** - Runtime environment
- **Express.js** - Web framework for API Gateway
- **Cote.js** - Microservices toolkit (request/response + pub/sub)
- **Concurrently** - Run multiple services simultaneously
- **Nodemon** - Hot reload during development
- **Redis** - Optional discovery backend (via Docker)

## 🎯 Learning Outcomes

After working with this demo, you'll understand:

✅ How microservices communicate internally
✅ API Gateway pattern and its benefits
✅ Request/Response vs Publish/Subscribe patterns
✅ Event-driven architecture principles
✅ Service decoupling and independence
✅ Zero-configuration service discovery
✅ How to trace requests through multiple services

## 🚀 Next Steps

To extend this demo:

1. **Add Database**: Replace in-memory storage with PostgreSQL + Prisma
2. **Add Authentication**: JWT-based auth in API Gateway
3. **Add Validation**: Input validation using Joi or Zod
4. **Add Error Handling**: Implement retry logic and dead letter queues
5. **Add Metrics**: Integrate with Prometheus/Grafana
6. **Compare with Other Tools**: Implement same architecture using RabbitMQ, Redis Pub/Sub, or NATS

## 📝 License

MIT

## 🤝 Contributing

Feel free to fork and extend this demo. It's meant to be a learning resource!

---

## 💼 Portfolio Usage

You can add this project to your portfolio with the following description:

> **Node.js Microservices Demo**
>
> Built a microservice architecture using Node.js, Express.js, and Cote.js. Implemented an API Gateway pattern with request/response communication and an event-driven system using publish/subscribe patterns. The system handles order processing across multiple independent services (Order, Payment, Inventory, Notification) with automatic service discovery and zero-configuration networking.
>
> **Key Features:**
> - API Gateway for external communication
> - Event-driven architecture with pub/sub
> - Service-to-service communication via cote.js
> - Docker containerization
> - Hot reload development environment

---

Happy coding! 🎉
