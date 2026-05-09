import { createStore } from '@geajs/core';

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
}

export interface ServiceHealth {
  name: string;
  status: "UP" | "DOWN";
  uptime: number;
  lastSeen: string;
}

export interface TimelineEvent {
  event: string;
  timestamp: string;
  service: string;
}

export interface OrderTimeline {
  orderId: string;
  correlationId: string;
  status: string;
  events: TimelineEvent[];
  createdAt: string;
}

const defaultMetrics: Metrics = {
  totalOrders: 0,
  completedOrders: 0,
  failedOrders: 0,
  paymentFailureRate: 0,
  inventoryFailureRate: 0,
  averageResponseTime: 0,
  activeServices: 0,
  ordersPerMinute: 0,
  paymentSuccessCount: 0,
  paymentFailureCount: 0,
  inventoryFailureCount: 0
};

export const metricsStore = createStore({
  metrics: { ...defaultMetrics },
  services: [] as ServiceHealth[],
  timelines: [] as OrderTimeline[],
  activeTab: "overview",
  loading: false,
  setMetrics(m: Metrics) {
    this.metrics = m;
  },
  setServices(s: ServiceHealth[]) {
    this.services = s;
  },
  setTimelines(t: OrderTimeline[]) {
    this.timelines = t;
  },
  setTab(tab: string) {
    this.activeTab = tab;
  },
  setLoading(l: boolean) {
    this.loading = l;
  }
});