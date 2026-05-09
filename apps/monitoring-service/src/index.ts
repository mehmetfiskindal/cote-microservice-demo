import "dotenv/config";
import express from "express";
import cors from "cors";
import { servicesRouter } from "./routes/services";
import { ordersRouter } from "./routes/orders";
import { logsRouter } from "./routes/logs";
import { metricsRouter } from "./routes/metrics";
import { createMetricsStream } from "./services/metricsStream";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use("/monitoring/services", servicesRouter);
app.use("/monitoring/orders", ordersRouter);
app.use("/monitoring/logs", logsRouter);
app.use("/monitoring/metrics", metricsRouter);

app.get("/monitoring/metrics/stream", createMetricsStream);

app.get("/health", (_, res) => {
  res.json({ status: "UP", service: "monitoring-service" });
});

app.listen(PORT, () => {
  console.log(`Monitoring service running on port ${PORT}`);
});