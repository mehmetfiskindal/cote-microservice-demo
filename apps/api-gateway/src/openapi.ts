export const openApiDocument = {
  openapi: "3.0.0",
  info: {
    title: "Order Processing Microservices V3",
    version: "1.0.0",
    description: "Express API Gateway for a cote.js, Prisma and PostgreSQL microservice demo."
  },
  paths: {
    "/health": {
      get: {
        summary: "Service health",
        responses: { 200: { description: "All services are healthy" }, 503: { description: "A dependency is unavailable" } }
      }
    },
    "/orders": {
      get: {
        summary: "List orders",
        responses: { 200: { description: "Orders" } }
      },
      post: {
        summary: "Create order",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateOrderRequest" }
            }
          }
        },
        responses: {
          201: { description: "Order created" },
          400: { description: "Validation error" }
        }
      }
    },
    "/orders/{id}": {
      get: {
        summary: "Get order",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Order" }, 404: { description: "Not found" } }
      }
    },
    "/orders/{id}/timeline": {
      get: {
        summary: "Get order event timeline",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Timeline" }, 404: { description: "Not found" } }
      }
    }
  },
  components: {
    schemas: {
      CreateOrderRequest: {
        type: "object",
        required: ["userId", "items"],
        properties: {
          userId: { type: "string", example: "user-1" },
          simulatePaymentFailure: { type: "boolean", example: false },
          simulateInventoryFailure: { type: "boolean", example: false },
          items: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              required: ["productId", "quantity", "price"],
              properties: {
                productId: { type: "string", example: "product-1" },
                quantity: { type: "integer", minimum: 1, example: 2 },
                price: { type: "number", minimum: 0.01, example: 100 }
              }
            }
          }
        }
      }
    }
  }
};
