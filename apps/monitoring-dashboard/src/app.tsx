import { Component } from '@geajs/core';
import { metricsStore } from './stores/monitoringStore';
import { fetchMetrics, fetchServices, fetchOrderTimelines, createMetricsStream } from './services/monitoringApi';
import './styles.css';

export default class App extends Component {
  intervals: number[] = [];

  async onMount() {
    await this.loadData();

    const unsub = createMetricsStream((event) => {
      if (event.type === 'metrics') {
        metricsStore.setMetrics(event.data);
      }
    });

    this.intervals.push(unsub as any);
  }

  async onUnmount() {
    this.intervals.forEach(i => {
      if (typeof i === 'function') i();
    });
  }

  async loadData() {
    metricsStore.setLoading(true);
    try {
      const [metrics, services, timelines] = await Promise.all([
        fetchMetrics(),
        fetchServices(),
        fetchOrderTimelines(20)
      ]);
      metricsStore.setMetrics(metrics);
      metricsStore.setServices(services);
      metricsStore.setTimelines(timelines);
    } catch (e) {
      console.error('Failed to load data:', e);
    }
    metricsStore.setLoading(false);
  }

  template() {
    const tab = metricsStore.activeTab;
    const loading = metricsStore.loading;

    return (
      <div class="dashboard">
        <nav class="nav">
          <div class="nav-brand">Microservice Monitor</div>
          <div class="nav-tabs">
            <button class={tab === 'overview' ? 'active' : ''} on:click={() => metricsStore.setTab('overview')}>Overview</button>
            <button class={tab === 'services' ? 'active' : ''} on:click={() => metricsStore.setTab('services')}>Services</button>
            <button class={tab === 'timeline' ? 'active' : ''} on:click={() => metricsStore.setTab('timeline')}>Orders Timeline</button>
            <button class={tab === 'logs' ? 'active' : ''} on:click={() => metricsStore.setTab('logs')}>Logs</button>
            <button class={tab === 'metrics' ? 'active' : ''} on:click={() => metricsStore.setTab('metrics')}>Metrics</button>
          </div>
        </nav>

        <main class="content">
          {loading && <div class="loading">Loading...</div>}

          {tab === 'overview' && <OverviewPage />}
          {tab === 'services' && <ServicesPage />}
          {tab === 'timeline' && <TimelinePage />}
          {tab === 'logs' && <LogsPage />}
          {tab === 'metrics' && <MetricsPage />}
        </main>
      </div>
    );
  }
}

class OverviewPage extends Component {
  template() {
    const m = metricsStore.metrics;
    const s = metricsStore.services;

    return (
      <div class="page">
        <h2>System Overview</h2>
        <div class="cards-grid">
          <div class="card">
            <div class="card-label">Total Orders</div>
            <div class="card-value">{m.totalOrders}</div>
          </div>
          <div class="card success">
            <div class="card-label">Completed</div>
            <div class="card-value">{m.completedOrders}</div>
          </div>
          <div class="card error">
            <div class="card-label">Failed</div>
            <div class="card-value">{m.failedOrders}</div>
          </div>
          <div class="card">
            <div class="card-label">Payment Failure Rate</div>
            <div class="card-value">{m.paymentFailureRate.toFixed(1)}%</div>
          </div>
          <div class="card">
            <div class="card-label">Inventory Failure Rate</div>
            <div class="card-value">{m.inventoryFailureRate.toFixed(1)}%</div>
          </div>
          <div class="card">
            <div class="card-label">Orders/Min</div>
            <div class="card-value">{m.ordersPerMinute}</div>
          </div>
          <div class="card">
            <div class="card-label">Active Services</div>
            <div class="card-value">{s.filter((svc: any) => svc.status === 'UP').length}/{s.length}</div>
          </div>
        </div>
      </div>
    );
  }
}

class ServicesPage extends Component {
  template() {
    const services = metricsStore.services;

    return (
      <div class="page">
        <h2>Services</h2>
        <div class="services-list">
          {services.length === 0 && <div class="empty">No services available</div>}
          {services.map((svc: any) => (
            <div class={`service-row ${svc.status === 'DOWN' ? 'down' : ''}`}>
              <span class="service-name">{svc.name}</span>
              <span class={`service-status ${svc.status.toLowerCase()}`}>{svc.status}</span>
              <span class="service-uptime">Uptime: {formatUptime(svc.uptime)}</span>
              <span class="service-lastseen">Last seen: {formatTime(svc.lastSeen)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
}

class TimelinePage extends Component {
  template() {
    const timelines = metricsStore.timelines;

    return (
      <div class="page">
        <h2>Orders Timeline</h2>
        <div class="timeline-list">
          {timelines.length === 0 && <div class="empty">No orders yet</div>}
          {timelines.map((tl: any) => (
            <div class={`timeline-item ${tl.status === 'FAILED' ? 'failed' : ''}`}>
              <div class="timeline-header">
                <span class="timeline-order-id">Order: {tl.orderId.slice(0, 8)}...</span>
                <span class="timeline-corr-id">Corr: {tl.correlationId.slice(0, 8)}...</span>
                <span class={`timeline-status ${tl.status.toLowerCase()}`}>{tl.status}</span>
              </div>
              <div class="timeline-steps">
                {tl.events.map((evt: any, i: number) => (
                  <div class={`step ${evt.event.includes('failed') ? 'error' : evt.event.includes('completed') ? 'success' : ''}`}>
                    <div class="step-dot"></div>
                    {i < tl.events.length - 1 && <div class="step-line"></div>}
                    <div class="step-content">
                      <span class="step-event">{evt.event}</span>
                      <span class="step-time">{formatTime(evt.timestamp)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
}

class LogsPage extends Component {
  state = { filter: '', serviceFilter: '' };

  template() {
    const timelines = metricsStore.timelines;
    const filter = this.state.filter;
    const serviceFilter = this.state.serviceFilter;

    const logs = timelines
      .flatMap((tl: any) =>
        tl.events.map((evt: any) => ({
          ...evt,
          orderId: tl.orderId,
          correlationId: tl.correlationId,
          level: evt.event.includes('failed') ? 'error' : evt.event.includes('completed') ? 'info' : 'debug'
        }))
      )
      .filter((log: any) => {
        if (serviceFilter && log.service !== serviceFilter) return false;
        if (filter) {
          const searchStr = `${log.event} ${log.orderId} ${log.correlationId}`.toLowerCase();
          if (!searchStr.includes(filter.toLowerCase())) return false;
        }
        return true;
      })
      .slice(0, 50);

    return (
      <div class="page">
        <h2>Logs</h2>
        <div class="filters">
          <input
            type="text"
            placeholder="Search by event, orderId, correlationId..."
            value={filter}
            on:input={(e: any) => this.state.filter = e.target.value}
          />
          <select on:change={(e: any) => this.state.serviceFilter = e.target.value}>
            <option value="">All Services</option>
            <option value="order-service">Order</option>
            <option value="payment-service">Payment</option>
            <option value="inventory-service">Inventory</option>
            <option value="notification-service">Notification</option>
          </select>
        </div>
        <div class="logs-list">
          {logs.length === 0 && <div class="empty">No logs found</div>}
          {logs.map((log: any) => (
            <div class={`log-entry ${log.level}`}>
              <span class="log-time">{formatTime(log.timestamp)}</span>
              <span class="log-service">{log.service}</span>
              <span class={`log-level ${log.level}`}>{log.level}</span>
              <span class="log-message">{log.event}</span>
              <span class="log-meta">Order: {log.orderId?.slice(0, 8)}...</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
}

class MetricsPage extends Component {
  state = { history: [] as any[] };

  onMount() {
    const unsub = createMetricsStream((event) => {
      if (event.type === 'metrics') {
        this.state.history = [...this.state.history.slice(-29), event.data];
        if (this.state.history.length > 30) {
          this.state.history = this.state.history.slice(-30);
        }
      }
    });
    this.intervals.push(unsub as any);
  }

  template() {
    const m = metricsStore.metrics;
    const history = this.state.history;

    return (
      <div class="page">
        <h2>Metrics</h2>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-title">Orders Per Minute</div>
            <div class="metric-value">{m.ordersPerMinute}</div>
            {history.length > 1 && (
              <div class="mini-chart">
                {history.map((h, i) => (
                  <div class="chart-bar" style={`height: ${Math.min(h.ordersPerMinute * 10, 100)}%`}></div>
                ))}
              </div>
            )}
          </div>
          <div class="metric-card">
            <div class="metric-title">Payment Success</div>
            <div class="metric-value">{m.paymentSuccessCount}</div>
          </div>
          <div class="metric-card error">
            <div class="metric-title">Payment Failures</div>
            <div class="metric-value">{m.paymentFailureCount}</div>
          </div>
          <div class="metric-card error">
            <div class="metric-title">Inventory Failures</div>
            <div class="metric-value">{m.inventoryFailureCount}</div>
          </div>
          <div class="metric-card">
            <div class="metric-title">Success Rate</div>
            <div class="metric-value">
              {m.totalOrders > 0 ? ((m.completedOrders / m.totalOrders) * 100).toFixed(1) : 0}%
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-title">Failure Rate</div>
            <div class="metric-value">
              {m.totalOrders > 0 ? ((m.failedOrders / m.totalOrders) * 100).toFixed(1) : 0}%
            </div>
          </div>
        </div>
      </div>
    );
  }
}

function formatUptime(seconds: number): string {
  if (!seconds) return '0s';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
}

function formatTime(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString();
}