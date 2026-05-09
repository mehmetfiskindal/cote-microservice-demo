import { PrismaClient } from "../generated/prisma";
import { log, logError } from "../../../../packages/shared/src";

const SERVICE_NAME = "order-service";

export function startOutboxPublisher(prisma: PrismaClient, publisher: any) {
  setInterval(async () => {
    const events = await prisma.outboxEvent.findMany({
      where: { processed: false },
      orderBy: { createdAt: "asc" },
      take: 10
    });

    for (const event of events) {
      try {
        publisher.publish(event.eventType, event.payload);
        await prisma.outboxEvent.update({
          where: { id: event.id },
          data: {
            processed: true,
            processedAt: new Date()
          }
        });

        log(SERVICE_NAME, "Outbox event published", {
          eventType: event.eventType,
          correlationId: event.correlationId
        });
      } catch (err) {
        const error = err as Error;
        logError(SERVICE_NAME, "Outbox publish failed", {
          eventType: event.eventType,
          correlationId: event.correlationId,
          error: error.message
        });
      }
    }
  }, 3000);
}
