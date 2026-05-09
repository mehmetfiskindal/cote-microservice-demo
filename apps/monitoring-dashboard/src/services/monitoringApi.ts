const API_BASE = "http://localhost:4000/monitoring";

export async function fetchServices() {
  const res = await fetch(`${API_BASE}/services`);
  return res.json();
}

export async function fetchOrderTimelines(limit = 20) {
  const res = await fetch(`${API_BASE}/orders/timeline?limit=${limit}`);
  return res.json();
}

export async function fetchOrderTimeline(orderId: string) {
  const res = await fetch(`${API_BASE}/orders/${orderId}/timeline`);
  return res.json();
}

export async function fetchLogs(params: { service?: string; correlationId?: string; orderId?: string }) {
  const searchParams = new URLSearchParams();
  if (params.service) searchParams.set("service", params.service);
  if (params.correlationId) searchParams.set("correlationId", params.correlationId);
  if (params.orderId) searchParams.set("orderId", params.orderId);
  const res = await fetch(`${API_BASE}/logs?${searchParams}`);
  return res.json();
}

export async function fetchMetrics() {
  const res = await fetch(`${API_BASE}/metrics`);
  return res.json();
}

export function createMetricsStream(callback: (data: any) => void) {
  const eventSource = new EventSource(`${API_BASE}/metrics/stream`);

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      callback(data);
    } catch (e) {
      console.error("Failed to parse SSE data:", e);
    }
  };

  eventSource.onerror = () => {
    console.error("SSE connection error");
  };

  return () => {
    eventSource.close();
  };
}