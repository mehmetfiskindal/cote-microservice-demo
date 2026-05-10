import { metricsStore } from './stores/monitoringStore';
import { fetchMetrics, fetchServices, fetchOrderTimelines, createMetricsStream } from './services/monitoringApi';
import './styles.css';

const API_BASE = "http://localhost:4000/monitoring";

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

function renderApp() {
  const tab = metricsStore.activeTab;
  const loading = metricsStore.loading;

  const nav = document.querySelector('nav');
  if (nav) {
    const buttons = nav.querySelectorAll('button');
    buttons.forEach(btn => {
      const btnTab = btn.textContent?.toLowerCase().replace(' ', '').replace('orderstimeline', 'timeline');
      const isActive = tab === btnTab || (btnTab === 'overview' && tab === 'overview');
      btn.classList.toggle('active', isActive);
    });
  }

  const main = document.querySelector('main');
  if (!main) return;

  if (loading) {
    main.innerHTML = '<div class="loading">Loading...</div>';
    return;
  }

  if (tab === 'overview') {
    renderOverview(main);
  } else if (tab === 'services') {
    renderServices(main);
  } else if (tab === 'timeline') {
    renderTimeline(main);
  } else if (tab === 'logs') {
    renderLogs(main);
  } else if (tab === 'metrics') {
    renderMetrics(main);
  }
}

function renderOverview(container) {
  const m = metricsStore.metrics;
  const s = metricsStore.services;
  const activeCount = s.filter((svc: any) => svc.status === 'UP').length;

  container.innerHTML = `
    <div class="page">
      <h2>System Overview</h2>
      <div class="cards-grid">
        <div class="card">
          <div class="card-label">Total Orders</div>
          <div class="card-value">${m.totalOrders}</div>
        </div>
        <div class="card success">
          <div class="card-label">Completed</div>
          <div class="card-value">${m.completedOrders}</div>
        </div>
        <div class="card error">
          <div class="card-label">Failed</div>
          <div class="card-value">${m.failedOrders}</div>
        </div>
        <div class="card">
          <div class="card-label">Payment Failure Rate</div>
          <div class="card-value">${m.paymentFailureRate.toFixed(1)}%</div>
        </div>
        <div class="card">
          <div class="card-label">Inventory Failure Rate</div>
          <div class="card-value">${m.inventoryFailureRate.toFixed(1)}%</div>
        </div>
        <div class="card">
          <div class="card-label">Orders/Min</div>
          <div class="card-value">${m.ordersPerMinute}</div>
        </div>
        <div class="card">
          <div class="card-label">Active Services</div>
          <div class="card-value">${activeCount}/${s.length}</div>
        </div>
      </div>
    </div>
  `;
}

function renderServices(container) {
  const services = metricsStore.services;
  
  if (services.length === 0) {
    container.innerHTML = `
      <div class="page">
        <h2>Services</h2>
        <div class="services-list">
          <div class="empty">No services available</div>
        </div>
      </div>
    `;
    return;
  }

  const rows = services.map((svc: any) => `
    <div class="service-row ${svc.status === 'DOWN' ? 'down' : ''}">
      <span class="service-name">${svc.name}</span>
      <span class="service-status ${svc.status.toLowerCase()}">${svc.status}</span>
      <span class="service-uptime">Uptime: ${formatUptime(svc.uptime)}</span>
      <span class="service-lastseen">Last seen: ${formatTime(svc.lastSeen)}</span>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="page">
      <h2>Services</h2>
      <div class="services-list">${rows}</div>
    </div>
  `;
}

function renderTimeline(container) {
  const timelines = metricsStore.timelines;
  
  if (timelines.length === 0) {
    container.innerHTML = `
      <div class="page">
        <h2>Orders Timeline</h2>
        <div class="timeline-list">
          <div class="empty">No orders yet</div>
        </div>
      </div>
    `;
    return;
  }

  const items = timelines.map((tl: any) => {
    const steps = tl.events.map((evt: any, i: number) => {
      const stepClass = evt.event.includes('failed') ? 'error' : evt.event.includes('completed') ? 'success' : '';
      const line = i < tl.events.length - 1 ? '<div class="step-line"></div>' : '';
      return `
        <div class="step ${stepClass}">
          <div class="step-dot"></div>
          ${line}
          <div class="step-content">
            <span class="step-event">${evt.event}</span>
            <span class="step-time">${formatTime(evt.timestamp)}</span>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="timeline-item ${tl.status === 'FAILED' ? 'failed' : ''}">
        <div class="timeline-header">
          <span class="timeline-order-id">Order: ${tl.orderId.slice(0, 8)}...</span>
          <span class="timeline-corr-id">Corr: ${tl.correlationId.slice(0, 8)}...</span>
          <span class="timeline-status ${tl.status.toLowerCase()}">${tl.status}</span>
        </div>
        <div class="timeline-steps">${steps}</div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="page">
      <h2>Orders Timeline</h2>
      <div class="timeline-list">${items}</div>
    </div>
  `;
}

function renderLogs(container) {
  container.innerHTML = `
    <div class="page">
      <h2>Logs</h2>
      <div class="logs-list">
        <div class="empty">No logs available</div>
      </div>
    </div>
  `;
}

function renderMetrics(container) {
  const m = metricsStore.metrics;
  const successRate = m.totalOrders > 0 ? ((m.completedOrders / m.totalOrders) * 100).toFixed(1) : 0;
  const failureRate = m.totalOrders > 0 ? ((m.failedOrders / m.totalOrders) * 100).toFixed(1) : 0;

  container.innerHTML = `
    <div class="page">
      <h2>Metrics</h2>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-title">Orders Per Minute</div>
          <div class="metric-value">${m.ordersPerMinute}</div>
        </div>
        <div class="metric-card">
          <div class="metric-title">Payment Success</div>
          <div class="metric-value">${m.paymentSuccessCount}</div>
        </div>
        <div class="metric-card error">
          <div class="metric-title">Payment Failures</div>
          <div class="metric-value">${m.paymentFailureCount}</div>
        </div>
        <div class="metric-card error">
          <div class="metric-title">Inventory Failures</div>
          <div class="metric-value">${m.inventoryFailureCount}</div>
        </div>
        <div class="metric-card">
          <div class="metric-title">Success Rate</div>
          <div class="metric-value">${successRate}%</div>
        </div>
        <div class="metric-card">
          <div class="metric-title">Failure Rate</div>
          <div class="metric-value">${failureRate}%</div>
        </div>
      </div>
    </div>
  `;
}

function initApp() {
  const root = document.getElementById('app');
  if (!root) return;

  root.innerHTML = `
    <div class="dashboard">
      <nav class="nav">
        <div class="nav-brand">Microservice Monitor</div>
        <div class="nav-tabs">
          <button id="btn-overview" class="active">Overview</button>
          <button id="btn-services">Services</button>
          <button id="btn-timeline">Orders Timeline</button>
          <button id="btn-logs">Logs</button>
          <button id="btn-metrics">Metrics</button>
        </div>
      </nav>
      <main class="content">
        <div class="loading">Loading...</div>
      </main>
    </div>
  `;

  document.getElementById('btn-overview')?.addEventListener('click', () => metricsStore.setTab('overview'));
  document.getElementById('btn-services')?.addEventListener('click', () => metricsStore.setTab('services'));
  document.getElementById('btn-timeline')?.addEventListener('click', () => metricsStore.setTab('timeline'));
  document.getElementById('btn-logs')?.addEventListener('click', () => metricsStore.setTab('logs'));
  document.getElementById('btn-metrics')?.addEventListener('click', () => metricsStore.setTab('metrics'));

  metricsStore.subscribe(renderApp);

  async function loadData() {
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

  loadData();

  createMetricsStream((event) => {
    if (event.type === 'metrics') {
      metricsStore.setMetrics(event.data);
    }
  });
}

initApp();