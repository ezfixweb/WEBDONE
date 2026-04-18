const state = {
  apiBase: localStorage.getItem('ezfixDesktopApiBase') || 'https://api.ezfix.cz/api',
  token: localStorage.getItem('ezfixDesktopToken') || '',
  orders: [],
  detailsById: new Map(),
  catalog: null,
  activeTab: 'orders'
};

const loginPanel = document.getElementById('loginPanel');
const dashboard = document.getElementById('dashboard');
const connState = document.getElementById('connState');
const appVersion = document.getElementById('appVersion');
const ordersTableBody = document.getElementById('ordersTableBody');

function formatMoney(value) {
  const amount = Number(value || 0);
  const safe = Number.isFinite(amount) ? amount : 0;
  return `${safe.toFixed(2)} Kč`;
}

function formatDate(value) {
  const date = new Date(value || '');
  if (!Number.isFinite(date.getTime())) return '-';
  return date.toLocaleString('cs-CZ');
}

function getAuthHeader() {
  return state.token ? { Authorization: `Bearer ${state.token}` } : {};
}

async function apiFetch(endpoint, options = {}) {
  const response = await fetch(`${state.apiBase}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      ...getAuthHeader()
    }
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    throw new Error(data.message || `API error (${response.status})`);
  }
  return data;
}

function classifyOrder(details) {
  const items = Array.isArray(details?.items) ? details.items : [];
  const devices = new Set(items.map((item) => String(item.device || '').toLowerCase()));
  if ([...devices].some((d) => d === 'printing' || d === '3d-printing')) return '3d-printing';
  if ([...devices].some((d) => d === 'custompc')) return 'custom-pc';
  if ([...devices].some((d) => d === 'other' || d === 'other-item')) return 'other';
  return 'repairs';
}

async function loadDetailsForOrders(orders) {
  const jobs = orders.map(async (order) => {
    try {
      const detail = await apiFetch(`/orders/${order.id}`);
      state.detailsById.set(String(order.id), detail.order || {});
    } catch {
      state.detailsById.set(String(order.id), {});
    }
  });
  await Promise.all(jobs);
}

function getFilteredOrders() {
  const status = document.getElementById('statusFilter').value;
  const type = document.getElementById('typeFilter').value;

  return state.orders.filter((order) => {
    if (status !== 'all' && String(order.status) !== status) return false;
    if (type !== 'all') {
      const details = state.detailsById.get(String(order.id));
      const orderType = classifyOrder(details);
      if (orderType !== type) return false;
    }
    return true;
  });
}

function updateSummaryCards(filtered) {
  document.getElementById('totalOrders').textContent = String(state.orders.length);
  const revenue = filtered.reduce((sum, o) => sum + Number(o.total || 0), 0);
  document.getElementById('filteredRevenue').textContent = formatMoney(revenue);

  const printingCount = filtered.filter((order) => {
    const details = state.detailsById.get(String(order.id));
    return classifyOrder(details) === '3d-printing';
  }).length;
  document.getElementById('printingOrders').textContent = String(printingCount);
}

function renderOrders() {
  const filtered = getFilteredOrders();
  updateSummaryCards(filtered);

  ordersTableBody.innerHTML = filtered.map((order) => {
    const details = state.detailsById.get(String(order.id));
    const type = classifyOrder(details);
    return `
      <tr>
        <td>${order.order_number || order.id}</td>
        <td>${order.customer_name || '-'}</td>
        <td>${order.status || '-'}</td>
        <td>${type}</td>
        <td>${formatMoney(order.total)}</td>
        <td>${formatDate(order.created_at)}</td>
      </tr>
    `;
  }).join('');
}

function renderInventory() {
  const printing = state.catalog?.printing || {};
  const printers = Array.isArray(printing.printers) ? printing.printers : [];
  const filaments = Array.isArray(printing.filaments) ? printing.filaments : [];
  const otherItems = Array.isArray(printing.otherItems) ? printing.otherItems : [];
  const usedItems = Array.isArray(printing.usedShopItems) ? printing.usedShopItems : [];

  document.getElementById('printersList').innerHTML = printers
    .filter((x) => x.active !== false)
    .map((item) => `<li>${item.name || item.id}</li>`)
    .join('') || '<li>None</li>';

  document.getElementById('filamentsList').innerHTML = filaments
    .filter((x) => x.active !== false)
    .map((item) => `<li>${item.name || item.id}</li>`)
    .join('') || '<li>None</li>';

  document.getElementById('otherItemsList').innerHTML = otherItems
    .filter((x) => x.active !== false)
    .map((item) => `<li>${item.name || 'Item'} - ${formatMoney(item.price || 0)}</li>`)
    .join('') || '<li>None</li>';

  document.getElementById('usedItemsList').innerHTML = usedItems
    .filter((x) => x.active !== false)
    .map((item) => `<li>${item.name || 'Used device'} - ${formatMoney(item.price || 0)}</li>`)
    .join('') || '<li>None</li>';
}

async function loadDashboardData() {
  const [ordersResult, catalogResult] = await Promise.all([
    apiFetch('/orders'),
    apiFetch('/catalog')
  ]);

  state.orders = Array.isArray(ordersResult.orders) ? ordersResult.orders : [];
  state.catalog = catalogResult.catalog || {};
  state.detailsById.clear();
  await loadDetailsForOrders(state.orders);

  renderOrders();
  renderInventory();
}

function setConnectedUi(connected) {
  loginPanel.classList.toggle('hidden', connected);
  dashboard.classList.toggle('hidden', !connected);
  connState.textContent = connected ? 'Connected' : 'Disconnected';
  connState.style.color = connected ? '#22c55e' : '#38bdf8';
}

function switchTab(tab) {
  state.activeTab = tab;
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  document.querySelectorAll('.tab-content').forEach((panel) => {
    const shouldShow = panel.id === `${tab}Tab`;
    panel.classList.toggle('active', shouldShow);
    panel.classList.toggle('hidden', !shouldShow);
  });
}

async function onLoginSubmit(event) {
  event.preventDefault();
  const loginError = document.getElementById('loginError');
  loginError.textContent = '';

  try {
    state.apiBase = document.getElementById('apiBase').value.trim().replace(/\/$/, '');
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    localStorage.setItem('ezfixDesktopApiBase', state.apiBase);

    const result = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      headers: { Authorization: '' }
    });

    state.token = result.token;
    localStorage.setItem('ezfixDesktopToken', state.token);
    setConnectedUi(true);
    await loadDashboardData();
  } catch (error) {
    loginError.textContent = error.message || 'Login failed';
  }
}

async function bootstrap() {
  appVersion.textContent = `${window.ezfixDesktop.appName} v${window.ezfixDesktop.appVersion}`;
  document.getElementById('apiBase').value = state.apiBase;

  document.getElementById('loginForm').addEventListener('submit', onLoginSubmit);
  document.getElementById('refreshBtn').addEventListener('click', async () => {
    if (!state.token) return;
    try {
      await loadDashboardData();
    } catch (error) {
      alert(error.message || 'Refresh failed');
    }
  });

  document.getElementById('logoutBtn').addEventListener('click', () => {
    state.token = '';
    localStorage.removeItem('ezfixDesktopToken');
    setConnectedUi(false);
  });

  document.getElementById('printBtn').addEventListener('click', () => {
    window.print();
  });

  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  document.getElementById('statusFilter').addEventListener('change', renderOrders);
  document.getElementById('typeFilter').addEventListener('change', renderOrders);

  switchTab('orders');

  if (state.token) {
    try {
      await apiFetch('/auth/me');
      setConnectedUi(true);
      await loadDashboardData();
      return;
    } catch {
      state.token = '';
      localStorage.removeItem('ezfixDesktopToken');
    }
  }

  setConnectedUi(false);
}

bootstrap();
