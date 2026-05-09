import { BaseEvent, EventName } from "../../contracts/src";
import { createEventId } from "./correlation";

export function createEvent<TPayload>(
  eventType: EventName,
  correlationId: string,
  payload: TPayload
): BaseEvent<TPayload> {
  return {
    eventId: createEventId(),
    eventType,
    correlationId,
    occurredAt: new Date().toISOString(),
    payload
  };
}
