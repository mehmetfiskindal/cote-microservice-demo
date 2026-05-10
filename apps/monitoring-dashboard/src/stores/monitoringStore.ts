export const metricsStore = {
  metrics: {
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
  },
  services: [],
  timelines: [],
  activeTab: "overview",
  loading: false,
  listeners: [],

  subscribe(fn) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  },

  notify() {
    this.listeners.forEach(fn => fn());
  },

  setMetrics(m) {
    this.metrics = m;
    this.notify();
  },

  setServices(s) {
    this.services = s;
    this.notify();
  },

  setTimelines(t) {
    this.timelines = t;
    this.notify();
  },

  setTab(tab) {
    this.activeTab = tab;
    this.notify();
  },

  setLoading(l) {
    this.loading = l;
    this.notify();
  }
};