const state = {
  apiBase: localStorage.getItem('ezfixDesktopApiBase') || 'https://api.ezfix.cz/api',
  token: localStorage.getItem('ezfixDesktopToken') || '',
  orders: [],
  detailsById: new Map(),
  catalog: null,
  activeTab: 'orders',
  expandedOrderId: null,
  inventoryEditMode: false,
  inventoryDraft: null,
  knownOrderIds: new Set(),
  notificationsEnabled: localStorage.getItem('ezfixDesktopNotifEnabled') !== 'false',
  notificationSound: localStorage.getItem('ezfixDesktopNotifSound') !== 'false',
  pollIntervalMs: Number(localStorage.getItem('ezfixDesktopPollMs') || 30000),
  pollTimer: null
};

const loginPanel = document.getElementById('loginPanel');
const dashboard = document.getElementById('dashboard');
const connState = document.getElementById('connState');
const appVersion = document.getElementById('appVersion');
const ordersTableBody = document.getElementById('ordersTableBody');
const toast = document.getElementById('toast');

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatMoney(value) {
  const amount = Number(value || 0);
  const safe = Number.isFinite(amount) ? amount : 0;
  return `${safe.toFixed(2)} Kč`;
}

function toOrderTypeLabel(type) {
  if (type === '3d-printing') return '3D tisk';
  if (type === 'custom-pc') return 'Vlastní PC';
  if (type === 'other') return 'Ostatní';
  return 'Opravy';
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

function getOrderItems(orderId) {
  const details = state.detailsById.get(String(orderId));
  return Array.isArray(details?.items) ? details.items : [];
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
    const isExpanded = state.expandedOrderId === String(order.id);
    const items = getOrderItems(order.id);

    const detailRow = isExpanded
      ? `
        <tr class="details-row">
          <td colspan="7">
            <div class="order-details">
              <h4>Objednávka ${escapeHtml(order.order_number || order.id)}</h4>
              <div class="order-meta">
                <span>E-mail: ${escapeHtml(order.customer_email || '-')}</span>
                <span>Telefon: ${escapeHtml(order.customer_phone || '-')}</span>
                <span>Adresa: ${escapeHtml(order.customer_address || '-')}</span>
              </div>
              ${items.length > 0 ? `
                <ul>
                  ${items.map((item) => `
                    <li>
                      ${escapeHtml(item.device || 'item')} / ${escapeHtml(item.brand || '-')}
                      ${escapeHtml(item.model || '-')}
                      - ${escapeHtml(item.repair_name || item.repair_type || 'servis')}
                      - ${formatMoney(item.price || 0)}
                    </li>
                  `).join('')}
                </ul>
              ` : '<div class="small">Tato objednávka nemá položky k zobrazení.</div>'}
            </div>
          </td>
        </tr>
      `
      : '';

    return `
      <tr>
        <td><button class="details-btn" data-order-toggle="${order.id}">${isExpanded ? 'Skryt' : 'Otevřít'}</button></td>
        <td>${escapeHtml(order.order_number || order.id)}</td>
        <td>${escapeHtml(order.customer_name || '-')}</td>
        <td>${escapeHtml(order.status || '-')}</td>
        <td>${escapeHtml(toOrderTypeLabel(type))}</td>
        <td>${formatMoney(order.total)}</td>
        <td>${formatDate(order.created_at)}</td>
      </tr>
      ${detailRow}
    `;
  }).join('');

  ordersTableBody.querySelectorAll('[data-order-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      const targetId = String(button.getAttribute('data-order-toggle') || '');
      state.expandedOrderId = state.expandedOrderId === targetId ? null : targetId;
      renderOrders();
    });
  });
}

function cloneCatalog(catalog) {
  return JSON.parse(JSON.stringify(catalog || {}));
}

function ensureInventoryArrays(catalog) {
  if (!catalog.printing || typeof catalog.printing !== 'object') {
    catalog.printing = {};
  }
  if (!Array.isArray(catalog.printing.printers)) catalog.printing.printers = [];
  if (!Array.isArray(catalog.printing.filaments)) catalog.printing.filaments = [];
  if (!Array.isArray(catalog.printing.otherItems)) catalog.printing.otherItems = [];
  if (!Array.isArray(catalog.printing.usedShopItems)) catalog.printing.usedShopItems = [];
}

function createInventoryItem(kind) {
  const stamp = Date.now();
  if (kind === 'printers') {
    return { id: `printer-${stamp}`, name: 'Nová tiskarna', active: true };
  }
  if (kind === 'filaments') {
    return { id: `filament-${stamp}`, name: 'Nový filament', active: true };
  }
  if (kind === 'usedShopItems') {
    return { id: `used-${stamp}`, name: 'Nová bazarová polozka', price: 0, active: true };
  }
  return { id: `item-${stamp}`, name: 'Nová polozka', price: 0, active: true };
}

function buildInventoryList(listId, list, kind) {
  const html = list
    .filter((x) => x && (state.inventoryEditMode || x.active !== false))
    .map((item, index) => {
      const name = escapeHtml(item.name || item.id || 'Položka');
      const price = Number(item.price || 0);
      const safePrice = Number.isFinite(price) ? price : 0;

      if (!state.inventoryEditMode) {
        const suffix = kind === 'otherItems' || kind === 'usedShopItems'
          ? ` - ${formatMoney(safePrice)}`
          : '';
        return `<li>${name}${suffix}</li>`;
      }

      return `
        <li class="inventory-edit-item">
          <div class="inventory-edit-row">
            <input data-inv-kind="${kind}" data-inv-index="${index}" data-field="name" value="${escapeHtml(item.name || '')}" placeholder="Název" />
            <input data-inv-kind="${kind}" data-inv-index="${index}" data-field="price" type="number" step="0.01" value="${safePrice}" placeholder="Cena" />
            <input data-inv-kind="${kind}" data-inv-index="${index}" data-field="active" value="${item.active === false ? 'false' : 'true'}" placeholder="true/false" />
          </div>
          <div class="inventory-item-sub">${escapeHtml(item.id || '')}</div>
          <button class="inventory-remove-btn" data-inv-remove="${kind}" data-inv-index="${index}">Smazat</button>
        </li>
      `;
    }).join('');

  document.getElementById(listId).innerHTML = html || '<li>Žádné položky</li>';
}

function renderInventory() {
  const sourceCatalog = state.inventoryEditMode ? state.inventoryDraft : state.catalog;
  const printing = sourceCatalog?.printing || {};
  const printers = Array.isArray(printing.printers) ? printing.printers : [];
  const filaments = Array.isArray(printing.filaments) ? printing.filaments : [];
  const otherItems = Array.isArray(printing.otherItems) ? printing.otherItems : [];
  const usedItems = Array.isArray(printing.usedShopItems) ? printing.usedShopItems : [];

  document.querySelectorAll('[data-inv-add]').forEach((button) => {
    button.classList.toggle('hidden', !state.inventoryEditMode);
  });

  buildInventoryList('printersList', printers, 'printers');
  buildInventoryList('filamentsList', filaments, 'filaments');
  buildInventoryList('otherItemsList', otherItems, 'otherItems');
  buildInventoryList('usedItemsList', usedItems, 'usedShopItems');

  if (state.inventoryEditMode) {
    document.querySelectorAll('[data-inv-kind]').forEach((input) => {
      input.addEventListener('input', () => {
        const kind = input.getAttribute('data-inv-kind');
        const index = Number(input.getAttribute('data-inv-index'));
        const field = input.getAttribute('data-field');
        if (!kind || !field || !Number.isFinite(index)) return;

        const list = state.inventoryDraft?.printing?.[kind];
        if (!Array.isArray(list) || !list[index]) return;

        if (field === 'price') {
          const parsed = Number(input.value);
          list[index][field] = Number.isFinite(parsed) ? parsed : 0;
          return;
        }

        if (field === 'active') {
          list[index][field] = String(input.value).trim().toLowerCase() !== 'false';
          return;
        }

        list[index][field] = input.value;
      });
    });

    document.querySelectorAll('[data-inv-remove]').forEach((button) => {
      button.addEventListener('click', () => {
        const kind = button.getAttribute('data-inv-remove');
        const index = Number(button.getAttribute('data-inv-index'));
        const list = state.inventoryDraft?.printing?.[kind || ''];
        if (!Array.isArray(list) || !Number.isFinite(index) || index < 0 || index >= list.length) return;
        list.splice(index, 1);
        renderInventory();
      });
    });

    document.querySelectorAll('[data-inv-add]').forEach((button) => {
      button.addEventListener('click', () => {
        const kind = button.getAttribute('data-inv-add');
        if (!kind || !state.inventoryDraft) return;
        ensureInventoryArrays(state.inventoryDraft);
        const list = state.inventoryDraft.printing[kind];
        if (!Array.isArray(list)) return;
        list.push(createInventoryItem(kind));
        renderInventory();
      });
    });
  }
}

function syncKnownOrderIds(orders, notify) {
  const currentIds = new Set(orders.map((o) => String(o.id)));

  if (notify && state.knownOrderIds.size > 0) {
    let newCount = 0;
    currentIds.forEach((id) => {
      if (!state.knownOrderIds.has(id)) newCount += 1;
    });
    if (newCount > 0) {
      showToast(`Nové objednávky: ${newCount}`);
      playNotificationTone();
    }
  }

  state.knownOrderIds = currentIds;
}

async function loadDashboardData(options = {}) {
  const { silent = false, notifyOnNew = false } = options;
  const [ordersResult, catalogResult] = await Promise.all([
    apiFetch('/orders'),
    apiFetch('/catalog')
  ]);

  const nextOrders = Array.isArray(ordersResult.orders) ? ordersResult.orders : [];
  syncKnownOrderIds(nextOrders, notifyOnNew && state.notificationsEnabled);
  state.orders = nextOrders;
  state.catalog = catalogResult.catalog || {};
  state.detailsById.clear();
  await loadDetailsForOrders(state.orders);

  renderOrders();

  if (!state.inventoryEditMode) {
    state.inventoryDraft = cloneCatalog(state.catalog);
  }
  renderInventory();

  if (!silent) {
    showToast('Panel byl obnoven');
  }
}

function setConnectedUi(connected) {
  loginPanel.classList.toggle('hidden', connected);
  dashboard.classList.toggle('hidden', !connected);
  connState.textContent = connected ? 'Připojeno' : 'Odpojeno';
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

function setInventoryEditMode(enabled) {
  state.inventoryEditMode = Boolean(enabled);
  if (state.inventoryEditMode) {
    state.inventoryDraft = cloneCatalog(state.catalog);
    ensureInventoryArrays(state.inventoryDraft);
  }

  document.getElementById('inventoryEditBtn').classList.toggle('hidden', state.inventoryEditMode);
  document.getElementById('inventorySaveBtn').classList.toggle('hidden', !state.inventoryEditMode);
  document.getElementById('inventoryCancelBtn').classList.toggle('hidden', !state.inventoryEditMode);
  renderInventory();
}

function makeCsvValue(value) {
  const text = String(value ?? '');
  const escaped = text.replace(/"/g, '""');
  return `"${escaped}"`;
}

function buildOrdersExportRows() {
  return getFilteredOrders().map((order) => {
    const details = state.detailsById.get(String(order.id));
    const type = classifyOrder(details);
    const items = getOrderItems(order.id)
      .map((item) => `${item.device || ''}:${item.repair_name || item.repair_type || ''}:${Number(item.price || 0).toFixed(2)}`)
      .join(' | ');

    return {
      orderId: order.order_number || order.id,
      customer: order.customer_name || '-',
      email: order.customer_email || '-',
      phone: order.customer_phone || '-',
      status: order.status || '-',
      type,
      total: Number(order.total || 0).toFixed(2),
      createdAt: formatDate(order.created_at),
      items
    };
  });
}

function downloadBlob(filename, mimeType, content) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportCsv() {
  const rows = buildOrdersExportRows();
  const headers = ['Objednávka ID', 'Zákazník', 'E-mail', 'Telefon', 'Stav', 'Typ', 'Cena', 'Vytvořeno', 'Položky'];
  const lines = [headers.map(makeCsvValue).join(',')];

  rows.forEach((row) => {
    lines.push([
      row.orderId,
      row.customer,
      row.email,
      row.phone,
      row.status,
      row.type,
      row.total,
      row.createdAt,
      row.items
    ].map(makeCsvValue).join(','));
  });

  downloadBlob(`ezfix-orders-${Date.now()}.csv`, 'text/csv;charset=utf-8;', `\ufeff${lines.join('\n')}`);
  showToast('CSV export byl vytvořen');
}

function exportExcel() {
  const rows = buildOrdersExportRows();
  if (!window.XLSX) {
    showToast('Knihovna pro Excel chybí. Spusť npm install v desktop-ez-app.');
    return;
  }

  const exportRows = rows.map((row) => ({
    'Objednávka ID': row.orderId,
    Zákazník: row.customer,
    'E-mail': row.email,
    Telefon: row.phone,
    Stav: row.status,
    Typ: toOrderTypeLabel(row.type),
    Cena: Number(row.total),
    Vytvořeno: row.createdAt,
    Položky: row.items
  }));

  const worksheet = window.XLSX.utils.json_to_sheet(exportRows);
  const workbook = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(workbook, worksheet, 'Objednávky');
  window.XLSX.writeFile(workbook, `ezfix-orders-${Date.now()}.xlsx`);
  showToast('XLSX export byl vytvořen');
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove('hidden');
  window.clearTimeout(showToast._timer);
  showToast._timer = window.setTimeout(() => {
    toast.classList.add('hidden');
  }, 2800);
}

function playNotificationTone() {
  if (!state.notificationSound) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.value = 0.05;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch {
    // Ignore audio playback limitations.
  }
}

function startPolling() {
  if (!state.notificationsEnabled) {
    stopPolling();
    return;
  }

  if (state.pollTimer) {
    window.clearInterval(state.pollTimer);
  }

  state.pollTimer = window.setInterval(async () => {
    if (!state.token) return;
    try {
      await loadDashboardData({ silent: true, notifyOnNew: true });
    } catch {
      // Keep polling even if one request fails.
    }
  }, state.pollIntervalMs);
}

function stopPolling() {
  if (!state.pollTimer) return;
  window.clearInterval(state.pollTimer);
  state.pollTimer = null;
}

async function saveInventoryDraft() {
  if (!state.inventoryDraft || typeof state.inventoryDraft !== 'object') return;
  ensureInventoryArrays(state.inventoryDraft);
  await apiFetch('/catalog', {
    method: 'PUT',
    body: JSON.stringify({ catalog: state.inventoryDraft })
  });
  state.catalog = cloneCatalog(state.inventoryDraft);
  setInventoryEditMode(false);
  showToast('Sklad byl uložen');
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
    state.notificationsEnabled = document.getElementById('notifEnabled').checked;
    setConnectedUi(true);
    await loadDashboardData({ silent: true });
    startPolling();
    showToast('Připojeno');
  } catch (error) {
    loginError.textContent = error.message || 'Přihlášení selhalo';
  }
}

async function bootstrap() {
  appVersion.textContent = `${window.ezfixDesktop.appName} v${window.ezfixDesktop.appVersion}`;
  document.getElementById('apiBase').value = state.apiBase;
  document.getElementById('notifEnabled').checked = state.notificationsEnabled;
  document.getElementById('notifSound').checked = state.notificationSound;
  document.getElementById('pollInterval').value = String(state.pollIntervalMs);

  document.getElementById('loginForm').addEventListener('submit', onLoginSubmit);
  document.getElementById('refreshBtn').addEventListener('click', async () => {
    if (!state.token) return;
    try {
      await loadDashboardData();
    } catch (error) {
      alert(error.message || 'Obnovení selhalo');
    }
  });

  document.getElementById('exportCsvBtn').addEventListener('click', () => {
    if (!state.token) return;
    exportCsv();
  });

  document.getElementById('exportExcelBtn').addEventListener('click', () => {
    if (!state.token) return;
    exportExcel();
  });

  document.getElementById('logoutBtn').addEventListener('click', () => {
    state.token = '';
    localStorage.removeItem('ezfixDesktopToken');
    stopPolling();
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

  document.getElementById('inventoryEditBtn').addEventListener('click', () => {
    setInventoryEditMode(true);
  });

  document.getElementById('inventoryCancelBtn').addEventListener('click', () => {
    setInventoryEditMode(false);
    showToast('Změny skladu byly zrušeny');
  });

  document.getElementById('inventorySaveBtn').addEventListener('click', async () => {
    try {
      await saveInventoryDraft();
    } catch (error) {
      alert(error.message || 'Uložení skladu selhalo');
    }
  });

  document.getElementById('notifEnabled').addEventListener('change', (event) => {
    state.notificationsEnabled = Boolean(event.target.checked);
    localStorage.setItem('ezfixDesktopNotifEnabled', String(state.notificationsEnabled));
    startPolling();
  });

  document.getElementById('notifSound').addEventListener('change', (event) => {
    state.notificationSound = Boolean(event.target.checked);
    localStorage.setItem('ezfixDesktopNotifSound', String(state.notificationSound));
  });

  document.getElementById('pollInterval').addEventListener('change', (event) => {
    const parsed = Number(event.target.value);
    state.pollIntervalMs = Number.isFinite(parsed) && parsed >= 15000 ? parsed : 30000;
    localStorage.setItem('ezfixDesktopPollMs', String(state.pollIntervalMs));
    startPolling();
  });

  switchTab('orders');

  if (state.token) {
    try {
      await apiFetch('/auth/me');
      setConnectedUi(true);
      await loadDashboardData({ silent: true });
      startPolling();
      showToast('Relace obnovena');
      return;
    } catch {
      state.token = '';
      localStorage.removeItem('ezfixDesktopToken');
    }
  }

  setConnectedUi(false);
}

bootstrap();
