import { Events } from "./events";

export type TimelineEvent =
  | "order.created"
  | "payment.completed"
  | "inventory.reserved"
  | "order.completed"
  | "notification.sent"
  | "payment.failed"
  | "inventory.failed"
  | "payment.refund_requested"
  | "payment.refunded"
  | "order.failed";

export const TimelineEventOrder: TimelineEvent[] = [
  "order.created",
  "payment.completed",
  "inventory.reserved",
  "order.completed",
  "notification.sent"
];

export const FailureTimelineEventOrder: TimelineEvent[] = [
  "order.created",
  "payment.failed",
  "inventory.failed",
  "payment.refund_requested",
  "payment.refunded",
  "order.failed",
  "notification.sent"
];

export interface ServiceHealth {
  name: string;
  status: "UP" | "DOWN";
  uptime: number;
  lastSeen: string;
  responseTime?: number;
}

export interface OrderTimeline {
  orderId: string;
  correlationId: string;
  status: string;
  events: TimelineEventEntry[];
  createdAt: string;
  completedAt?: string;
}

export interface TimelineEventEntry {
  event: TimelineEvent;
  timestamp: string;
  service: string;
  payload?: Record<string, unknown>;
}

export interface LogEntry {
  id: string;
  service: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  orderId?: string;
  correlationId?: string;
  eventType?: string;
  timestamp: string;
}

export interface Metrics {
  totalOrders: number;
  completedOrders: number;
  failedOrders: number;
  paymentFailureRate: number;
  inventoryFailureRate: number;
  averageResponseTime: number;
  activeServices: number;
  ordersPerMinute: number;
  paymentSuccessCount: number;
  paymentFailureCount: number;
  inventoryFailureCount: number;
  serviceUptimes: Record<string, number>;
}

export interface MetricsStreamEvent {
  type: "metrics" | "order_created" | "order_completed" | "order_failed" | "service_status";
  data: Metrics | { orderId: string; correlationId: string; timestamp: string } | ServiceHealth;
  timestamp: string;
}

export type {
  Events
};