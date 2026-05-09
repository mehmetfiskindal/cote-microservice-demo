import crypto from "node:crypto";

export function createCorrelationId() {
  return crypto.randomUUID();
}

export function createEventId() {
  return crypto.randomUUID();
}
