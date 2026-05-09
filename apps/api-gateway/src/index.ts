import "dotenv/config";
import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { log } from "../../../packages/shared/src";
import { healthRoutes } from "./routes/healthRoutes";
import { orderRoutes } from "./routes/orderRoutes";
import { openApiDocument } from "./openapi";

const SERVICE_NAME = "api-gateway";
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
app.use("/health", healthRoutes);
app.use("/orders", orderRoutes);

app.listen(PORT, () => {
  log(SERVICE_NAME, "API Gateway started", {
    port: PORT,
    docs: `http://localhost:${PORT}/docs`
  });
});
