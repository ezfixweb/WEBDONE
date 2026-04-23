function getDefaultLabelTemplate() {
  return {
    header: 'EZFix',
    footer: 'Dekuji za objednavku',
    widthMm: 58,
    heightMm: 38,
    fontSize: 11,
    showPhone: true,
    showDate: true
  };
}

function loadLabelTemplateFromStorage() {
  const fallback = getDefaultLabelTemplate();
  try {
    const raw = localStorage.getItem('ezfixDesktopLabelTemplate');
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return fallback;

    return {
      header: String(parsed.header || fallback.header),
      footer: String(parsed.footer || fallback.footer),
      widthMm: Number.isFinite(Number(parsed.widthMm)) ? Number(parsed.widthMm) : fallback.widthMm,
      heightMm: Number.isFinite(Number(parsed.heightMm)) ? Number(parsed.heightMm) : fallback.heightMm,
      fontSize: Number.isFinite(Number(parsed.fontSize)) ? Number(parsed.fontSize) : fallback.fontSize,
      showPhone: Boolean(parsed.showPhone),
      showDate: Boolean(parsed.showDate)
    };
  } catch {
    return fallback;
  }
}

const state = {
  apiBase: 'https://api.ezfix.cz/api',
  token: localStorage.getItem('ezfixDesktopToken') || '',
  orders: [],
  detailsById: new Map(),
  catalog: null,
  activeTab: 'orders',
  expandedOrderId: null,
  fullscreenOrderId: null,
  inventoryEditMode: false,
  inventoryDraft: null,
  knownOrderIds: new Set(),
  currentUser: null,
  users: [],
  chatSessions: [],
  activeChatSessionId: null,
  chatAiCollapsed: true,
  notificationsEnabled: localStorage.getItem('ezfixDesktopNotifEnabled') !== 'false',
  notificationSound: localStorage.getItem('ezfixDesktopNotifSound') !== 'false',
  pollIntervalMs: Number(localStorage.getItem('ezfixDesktopPollMs') || 30000),
  pollTimer: null,
  availablePrinters: [],
  fullPrintPrinter: localStorage.getItem('ezfixDesktopFullPrintPrinter') || '',
  receiptPrinter: localStorage.getItem('ezfixDesktopReceiptPrinter') || '',
  labelPrinter: localStorage.getItem('ezfixDesktopLabelPrinter') || '',
  labelTemplate: loadLabelTemplateFromStorage(),
  inventoryCollapsed: getDefaultInventoryCollapsed(),
  inventoryEditKind: null,
  catalogEditorMode: 'easy',
  easyCatalogListVisible: false,
  inventorySearchQuery: '',
  easyCatalogEditIndex: null,
  customEasyCatalogCategories: new Map(),
  easyCatalogShowAddCategoryForm: false,
  easyCatalogNewCategoryName: ''
};

const loginPanel = document.getElementById('loginPanel');
const dashboard = document.getElementById('dashboard');
const connState = document.getElementById('connState');
const appVersion = document.getElementById('appVersion');
const ordersTableBody = document.getElementById('ordersTableBody');
const toast = document.getElementById('toast');
const usersTabBtn = document.getElementById('usersTabBtn');
const catalogTabBtn = document.getElementById('catalogTabBtn');
const chatsTabBtn = document.getElementById('chatsTabBtn');
const ordersTabBtn = document.getElementById('ordersTabBtn');
const inventoryTabBtn = document.getElementById('inventoryTabBtn');
const usersHint = document.getElementById('usersHint');
const usersTableBody = document.getElementById('usersTableBody');
const orderOpsPanel = document.getElementById('orderOpsPanel');
const inventoryEditStatus = document.getElementById('inventoryEditStatus');
const manualOrderOpsBlock = document.getElementById('manualOrderOpsBlock');
const invoiceOpsBlock = document.getElementById('invoiceOpsBlock');
const toggleManualOrderFormBtn = document.getElementById('toggleManualOrderFormBtn');
const toggleInvoiceFormBtn = document.getElementById('toggleInvoiceFormBtn');
const orderFullscreenModal = document.getElementById('orderFullscreenModal');
const orderFullscreenContent = document.getElementById('orderFullscreenContent');
const statusChangePopup = document.getElementById('statusChangePopup');
const editUserModal = document.getElementById('editUserModal');
const mainLayout = document.querySelector('.main');
const appShell = document.querySelector('.app-shell');
const authStateText = document.getElementById('authStateText');
const topActionButtonIds = ['refreshBtn', 'exportCsvBtn', 'exportExcelBtn', 'printBtn', 'logoutBtn'];

const ORDER_STATUSES = ['pending', 'waiting', 'in-progress', 'delivering', 'completed', 'delivered', 'cancelled'];
const EASY_CATALOG_KIND_LABELS = {
  printers: 'Tiskárny',
  filaments: 'Filamenty',
  pcBuildParts: 'PC díly',
  otherItems: 'Ostatní položky',
  otherCustomItems: 'Další (Other)',
  usedShopItems: 'Bazar'
};

function getDefaultInventoryCollapsed() {
  return {
    printersList: true,
    filamentsList: true,
    pcBuildPartsList: true,
    otherItemsList: true,
    otherCustomItemsList: true,
    usedItemsList: true
  };
}

function canManageOrders() {
  const role = String(state.currentUser?.role || '').toLowerCase();
  return role === 'worker' || role === 'manager' || role === 'owner';
}

function hasPermission(permission) {
  if (!permission) return false;
  const role = String(state.currentUser?.role || '').toLowerCase();
  if (role === 'owner') return true;

  const permissions = Array.isArray(state.currentUser?.permissions)
    ? state.currentUser.permissions.map((item) => String(item || '').toLowerCase())
    : [];

  if (permissions.includes(permission)) return true;

  if (permission === 'catalog') return role === 'manager';
  if (permission === 'chats') return role === 'worker' || role === 'manager';
  return false;
}

function canAccessCatalog() {
  return hasPermission('catalog');
}

function canAccessChats() {
  return hasPermission('chats');
}

function statusLabel(status) {
  const map = {
    pending: 'Čeká na potvrzení',
    waiting: 'Čeká',
    'in-progress': 'Rozpracováno',
    delivering: 'Doručování',
    completed: 'Dokončeno',
    delivered: 'Doručeno',
    cancelled: 'Zrušeno'
  };
  return map[String(status || '').toLowerCase()] || String(status || '-');
}

function statusClass(status) {
  return String(status || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
}

function statusPillHtml(status) {
  const cls = statusClass(status);
  return `<span class="order-status-pill ${cls}">${escapeHtml(statusLabel(status))}</span>`;
}

function statusOptionsHtml(currentStatus) {
  return ORDER_STATUSES.map((status) => {
    const selected = String(currentStatus || '') === status ? 'selected' : '';
    return `<option value="${status}" ${selected}>${statusLabel(status)}</option>`;
  }).join('');
}

function patchLocalOrderStatus(orderId, status) {
  const id = String(orderId);
  const target = state.orders.find((order) => String(order.id) === id);
  if (target) {
    target.status = status;
  }

  const detail = state.detailsById.get(id);
  if (detail) {
    detail.status = status;
    state.detailsById.set(id, detail);
  }
}

async function updateOrderStatus(orderId, nextStatus) {
  if (!canManageOrders()) {
    showToast('Nemáte oprávnění měnit stav objednávek');
    return;
  }

  const current = state.orders.find((order) => String(order.id) === String(orderId));
  const previousStatus = current?.status;
  if (String(previousStatus || '') === String(nextStatus || '')) {
    showToast('Stav objednávky je už nastaven na tuto hodnotu');
    return;
  }

  await apiFetch(`/orders/${orderId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: nextStatus })
  });

  patchLocalOrderStatus(orderId, nextStatus);
  renderOrders();
  renderOrderFullscreen();
  showToast('Stav objednávky byl změněn a e-mail byl odeslán backendem');

  const orderNumber = current?.order_number || current?.id || orderId;
  showStatusChangePopup(`Objednávka ${orderNumber}: ${statusLabel(previousStatus)} -> ${statusLabel(nextStatus)}`);
}

function showStatusChangePopup(message) {
  statusChangePopup.textContent = message;
  statusChangePopup.classList.remove('hidden');
  window.clearTimeout(showStatusChangePopup._timer);
  showStatusChangePopup._timer = window.setTimeout(() => {
    statusChangePopup.classList.add('hidden');
  }, 3600);
}

function renderOrderFullscreen() {
  if (!state.fullscreenOrderId) {
    orderFullscreenContent.innerHTML = '';
    return;
  }

  const order = state.orders.find((x) => String(x.id) === String(state.fullscreenOrderId));
  if (!order) {
    orderFullscreenContent.innerHTML = '<p>Objednávka nebyla nalezena.</p>';
    return;
  }

  const details = state.detailsById.get(String(order.id)) || {};
  const items = getOrderItems(order.id);
  const canEditStatus = canManageOrders();

  orderFullscreenContent.innerHTML = `
    <div class="overlay-meta">
      <div><strong>Objednávka:</strong><br>${escapeHtml(order.order_number || order.id)}</div>
      <div><strong>Zákazník:</strong><br>${escapeHtml(order.customer_name || '-')}</div>
      <div><strong>Vytvořeno:</strong><br>${formatDate(order.created_at)}</div>
      <div><strong>E-mail:</strong><br>${escapeHtml(order.customer_email || '-')}</div>
      <div><strong>Telefon:</strong><br>${escapeHtml(order.customer_phone || '-')}</div>
      <div><strong>Adresa:</strong><br>${escapeHtml(order.customer_address || '-')}</div>
      <div><strong>Stav:</strong><br>${statusPillHtml(order.status)}</div>
      <div><strong>Typ:</strong><br>${escapeHtml(toOrderTypeLabel(classifyOrder(details)))}</div>
      <div><strong>Celkem:</strong><br>${formatMoney(order.total)}</div>
    </div>

    ${createOrderActionButtons(order.id)}

    ${canEditStatus ? `
      <div class="status-edit">
        <strong>Změna stavu:</strong>
        <select id="orderStatusSelectModal-${order.id}">
          ${statusOptionsHtml(order.status)}
        </select>
        <button data-order-status-save="${order.id}" data-select-id="orderStatusSelectModal-${order.id}">Uložit stav + e-mail</button>
      </div>
    ` : ''}

    <div class="overlay-items">
      ${items.length > 0 ? items.map((item) => `
        <div class="overlay-item">
          <div><strong>Zařízení:</strong> ${escapeHtml(item.device || '-')}</div>
          <div><strong>Značka/Model:</strong> ${escapeHtml(item.brand || '-')} ${escapeHtml(item.model || '-')}</div>
          <div><strong>Služba:</strong> ${escapeHtml(item.repair_name || item.repair_type || 'servis')}</div>
          <div><strong>Cena:</strong> ${formatMoney(item.price || 0)}</div>
        </div>
      `).join('') : '<p>Tato objednávka nemá položky.</p>'}
    </div>
  `;

  orderFullscreenContent.querySelectorAll('[data-order-status-save]').forEach((button) => {
    button.addEventListener('click', async () => {
      const targetId = button.getAttribute('data-order-status-save');
      const selectId = button.getAttribute('data-select-id');
      const select = selectId ? document.getElementById(selectId) : null;
      if (!targetId || !select) return;
      button.disabled = true;
      try {
        await updateOrderStatus(targetId, select.value);
      } catch (error) {
        alert(error.message || 'Změna stavu selhala');
      } finally {
        button.disabled = false;
      }
    });
  });

  bindOrderActionButtons(orderFullscreenContent);
}

function openOrderFullscreen(orderId) {
  state.fullscreenOrderId = String(orderId);
  renderOrderFullscreen();
  orderFullscreenModal.classList.remove('hidden');
}

function closeOrderFullscreen() {
  state.fullscreenOrderId = null;
  orderFullscreenModal.classList.add('hidden');
  orderFullscreenContent.innerHTML = '';
}

function isOwner() {
  return String(state.currentUser?.role || '').toLowerCase() === 'owner';
}

function formatRoleLabel(role) {
  const normalized = String(role || '').toLowerCase();
  if (normalized === 'owner') return 'owner';
  if (normalized === 'manager') return 'manager';
  if (normalized === 'worker') return 'worker';
  return 'customer';
}

function refreshOwnerUiVisibility() {
  const owner = isOwner();
  usersTabBtn.classList.toggle('hidden', !owner);
  usersHint.textContent = owner
    ? 'Přidejte další přihlášení pro tým (worker / manager / customer).'
    : 'Tato sekce je dostupná pouze pro roli owner.';

  if (!owner && state.activeTab === 'users') {
    switchTab('orders');
  }
}

function refreshFeatureTabsVisibility() {
  const showCatalog = canAccessCatalog();
  const showChats = canAccessChats();

  if (catalogTabBtn) {
    catalogTabBtn.classList.toggle('hidden', !showCatalog);
  }

  if (chatsTabBtn) {
    chatsTabBtn.classList.toggle('hidden', !showChats);
  }

  if (!showCatalog && state.activeTab === 'catalog') {
    switchTab('orders');
  }

  if (!showChats && state.activeTab === 'chats') {
    switchTab('orders');
  }
}

function refreshBaseTabsVisibility(connected) {
  if (ordersTabBtn) {
    ordersTabBtn.classList.toggle('hidden', !connected);
  }
  if (inventoryTabBtn) {
    inventoryTabBtn.classList.toggle('hidden', !connected);
  }
}

function setTopbarButtonsEnabled(connected) {
  topActionButtonIds.forEach((id) => {
    const button = document.getElementById(id);
    if (!button) return;
    button.disabled = !connected;
  });
}

function refreshOrderOpsVisibility() {
  const canManage = canManageOrders();
  if (!orderOpsPanel) return;
  orderOpsPanel.classList.toggle('hidden', !canManage);
}

function setOrderOpsFormPanel(panel) {
  if (!manualOrderOpsBlock || !invoiceOpsBlock || !toggleManualOrderFormBtn || !toggleInvoiceFormBtn) return;

  const showManual = panel === 'manual';
  const showInvoice = panel === 'invoice';

  manualOrderOpsBlock.classList.toggle('hidden', !showManual);
  invoiceOpsBlock.classList.toggle('hidden', !showInvoice);
  toggleManualOrderFormBtn.classList.toggle('active', showManual);
  toggleInvoiceFormBtn.classList.toggle('active', showInvoice);
}

function closeOrderOpsModals() {
  setOrderOpsFormPanel(null);

  const manualError = document.getElementById('createManualOrderError');
  const invoiceError = document.getElementById('createInvoiceError');
  if (manualError) manualError.textContent = '';
  if (invoiceError) invoiceError.textContent = '';
}

function closeVisibleOverlayByPriority() {
  if (manualOrderOpsBlock && !manualOrderOpsBlock.classList.contains('hidden')) {
    closeOrderOpsModals();
    return true;
  }
  if (invoiceOpsBlock && !invoiceOpsBlock.classList.contains('hidden')) {
    closeOrderOpsModals();
    return true;
  }
  if (orderFullscreenModal && !orderFullscreenModal.classList.contains('hidden')) {
    closeOrderFullscreen();
    return true;
  }
  if (editUserModal && !editUserModal.classList.contains('hidden')) {
    closeEditUserModal();
    return true;
  }
  return false;
}

function handleGlobalEscape(event) {
  if (event.key !== 'Escape') return;
  const didClose = closeVisibleOverlayByPriority();
  if (didClose) {
    event.preventDefault();
    event.stopPropagation();
  }
}

function renderPrinterSelect(selectId, selectedValue) {
  const select = document.getElementById(selectId);
  if (!select) return;

  const printers = Array.isArray(state.availablePrinters) ? state.availablePrinters : [];
  const uniquePrinters = [...new Set(printers.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'cs'));

  const options = ['<option value="">Výchozí systémová tiskárna</option>'];
  if (selectedValue && !uniquePrinters.includes(selectedValue)) {
    options.push(`<option value="${escapeHtml(selectedValue)}">${escapeHtml(selectedValue)} (uložená)</option>`);
  }

  uniquePrinters.forEach((printerName) => {
    options.push(`<option value="${escapeHtml(printerName)}">${escapeHtml(printerName)}</option>`);
  });

  select.innerHTML = options.join('');
  select.value = selectedValue || '';
}

function renderPrinterSettings() {
  renderPrinterSelect('fullPrintPrinter', state.fullPrintPrinter);
  renderPrinterSelect('receiptPrinter', state.receiptPrinter);
  renderPrinterSelect('labelPrinter', state.labelPrinter);
}

function renderLabelTemplateEditor() {
  const template = state.labelTemplate || getDefaultLabelTemplate();
  const headerInput = document.getElementById('labelHeaderInput');
  const footerInput = document.getElementById('labelFooterInput');
  const widthInput = document.getElementById('labelWidthMmInput');
  const heightInput = document.getElementById('labelHeightMmInput');
  const fontSizeInput = document.getElementById('labelFontSizeInput');
  const showPhoneInput = document.getElementById('labelShowPhoneInput');
  const showDateInput = document.getElementById('labelShowDateInput');
  const previewBox = document.getElementById('labelPreviewBox');

  if (headerInput) headerInput.value = String(template.header || '');
  if (footerInput) footerInput.value = String(template.footer || '');
  if (widthInput) widthInput.value = String(template.widthMm || 58);
  if (heightInput) heightInput.value = String(template.heightMm || 38);
  if (fontSizeInput) fontSizeInput.value = String(template.fontSize || 11);
  if (showPhoneInput) showPhoneInput.checked = Boolean(template.showPhone);
  if (showDateInput) showDateInput.checked = Boolean(template.showDate);

  if (previewBox) {
    const preview = [
      String(template.header || 'EZFix'),
      'Objednavka EZF-... ',
      'Zakaznik: Jan Novak',
      template.showPhone ? 'Tel: +420...' : '',
      template.showDate ? 'Datum: 23. 4. 2026' : '',
      String(template.footer || '')
    ].filter(Boolean).join('\n');
    previewBox.textContent = preview;
    previewBox.style.fontSize = `${Math.max(8, Math.min(18, Number(template.fontSize || 11)))}px`;
  }
}

function persistLabelTemplate() {
  localStorage.setItem('ezfixDesktopLabelTemplate', JSON.stringify(state.labelTemplate || getDefaultLabelTemplate()));
}

function clampNumber(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function updateLabelTemplateFromForm() {
  const template = state.labelTemplate || getDefaultLabelTemplate();
  const headerInput = document.getElementById('labelHeaderInput');
  const footerInput = document.getElementById('labelFooterInput');
  const widthInput = document.getElementById('labelWidthMmInput');
  const heightInput = document.getElementById('labelHeightMmInput');
  const fontSizeInput = document.getElementById('labelFontSizeInput');
  const showPhoneInput = document.getElementById('labelShowPhoneInput');
  const showDateInput = document.getElementById('labelShowDateInput');

  state.labelTemplate = {
    header: String(headerInput?.value || template.header || '').slice(0, 40),
    footer: String(footerInput?.value || template.footer || '').slice(0, 60),
    widthMm: clampNumber(widthInput?.value, 30, 120, template.widthMm || 58),
    heightMm: clampNumber(heightInput?.value, 20, 120, template.heightMm || 38),
    fontSize: clampNumber(fontSizeInput?.value, 8, 18, template.fontSize || 11),
    showPhone: Boolean(showPhoneInput?.checked),
    showDate: Boolean(showDateInput?.checked)
  };

  persistLabelTemplate();
  renderLabelTemplateEditor();
}

async function loadPrinterOptions(showFeedback = false) {
  if (!window.ezfixDesktop?.listPrinters) {
    renderPrinterSettings();
    return;
  }

  try {
    const printers = await window.ezfixDesktop.listPrinters();
    state.availablePrinters = Array.isArray(printers)
      ? printers.map((printer) => String(printer?.name || '')).filter(Boolean)
      : [];
    renderPrinterSettings();
    if (showFeedback) {
      showToast(state.availablePrinters.length > 0 ? 'Tiskárny byly načteny' : 'Nebyla nalezena žádná tiskárna');
    }
  } catch (error) {
    renderPrinterSettings();
    if (showFeedback) {
      alert(error.message || 'Načtení tiskáren selhalo');
    }
  }
}

function savePrinterSetting(storageKey, stateKey, value) {
  state[stateKey] = String(value || '');
  localStorage.setItem(storageKey, state[stateKey]);
}

function getOrderById(orderId) {
  return state.orders.find((order) => String(order.id) === String(orderId)) || null;
}

async function ensureOrderData(orderId) {
  let order = getOrderById(orderId);
  if (!order) {
    await loadDashboardData({ silent: true });
    order = getOrderById(orderId);
  }
  if (!order) {
    throw new Error('Objednávka nebyla nalezena');
  }

  let details = state.detailsById.get(String(orderId));
  if (!details) {
    const result = await apiFetch(`/orders/${orderId}`);
    details = result.order || {};
    state.detailsById.set(String(orderId), details);
  }

  return {
    order,
    details,
    items: Array.isArray(details?.items) ? details.items : []
  };
}

function createOrderActionButtons(orderId) {
  const deleteButton = canManageOrders()
    ? `<button type="button" class="danger" data-order-action="delete" data-order-id="${orderId}">Smazat</button>`
    : '';

  return `
    <div class="order-detail-actions">
      <button type="button" class="secondary" data-order-action="invoice-print" data-order-id="${orderId}">Tisk faktury</button>
      <button type="button" class="secondary" data-order-action="invoice-save" data-order-id="${orderId}">Uložit fakturu</button>
      <button type="button" class="secondary" data-order-action="receipt-print" data-order-id="${orderId}">Tisk účtenky</button>
      <button type="button" class="ghost-btn" data-order-action="label-print" data-order-id="${orderId}">Tisk štítku</button>
      ${deleteButton}
    </div>
  `;
}

function buildInvoiceDocumentHtml(order, items) {
  const lineItems = items.length > 0
    ? items.map((item, index) => `
        <tr>
          <td>${index + 1}.</td>
          <td>${escapeHtml(item.repair_name || item.repair_type || item.device || 'Položka')}</td>
          <td>${escapeHtml(item.brand || '-')} ${escapeHtml(item.model || '')}</td>
          <td style="text-align:right;">${formatMoney(item.price || 0)}</td>
        </tr>
      `).join('')
    : '<tr><td colspan="4">Objednávka neobsahuje položky.</td></tr>';

  return `<!DOCTYPE html>
  <html lang="cs">
    <head>
      <meta charset="UTF-8" />
      <title>Faktura ${escapeHtml(order.order_number || order.id)}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 32px; color: #111827; }
        .head { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 24px; }
        .card { border: 1px solid #d1d5db; border-radius: 12px; padding: 16px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border-bottom: 1px solid #e5e7eb; padding: 10px 8px; text-align: left; }
        .summary { margin-top: 20px; display: flex; justify-content: flex-end; }
        .summary-box { min-width: 220px; border: 1px solid #d1d5db; border-radius: 12px; padding: 16px; }
        h1, h2, p { margin: 0; }
        .muted { color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="head">
        <div>
          <h1>EzFix</h1>
          <p class="muted">Faktura k objednávce ${escapeHtml(order.order_number || order.id)}</p>
        </div>
        <div class="card">
          <strong>Doklad</strong><br />
          Číslo: ${escapeHtml(order.order_number || order.id)}<br />
          Datum: ${escapeHtml(formatDate(order.created_at))}<br />
          Stav: ${escapeHtml(statusLabel(order.status))}
        </div>
      </div>
      <div class="head">
        <div class="card" style="flex:1;">
          <h2>Odběratel</h2>
          <p>${escapeHtml(order.customer_name || '-')}</p>
          <p>${escapeHtml(order.customer_email || '-')}</p>
          <p>${escapeHtml(order.customer_phone || '-')}</p>
          <p>${escapeHtml(order.customer_address || '-')}</p>
        </div>
        <div class="card" style="width:280px;">
          <h2>Souhrn</h2>
          <p>Typ: ${escapeHtml(toOrderTypeLabel(classifyOrder(state.detailsById.get(String(order.id)) || {})))}</p>
          <p>Položek: ${items.length}</p>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Služba</th>
            <th>Zařízení</th>
            <th style="text-align:right;">Cena</th>
          </tr>
        </thead>
        <tbody>${lineItems}</tbody>
      </table>
      <div class="summary">
        <div class="summary-box">
          <strong>Celkem</strong>
          <div style="font-size: 24px; margin-top: 8px;">${formatMoney(order.total || 0)}</div>
        </div>
      </div>
    </body>
  </html>`;
}

function buildReceiptDocumentHtml(order, items) {
  const lineItems = items.length > 0
    ? items.map((item) => `<div class="row"><span>${escapeHtml(item.repair_name || item.repair_type || 'Položka')}</span><strong>${formatMoney(item.price || 0)}</strong></div>`).join('')
    : '<div class="row"><span>Bez položek</span><strong>0 Kč</strong></div>';

  return `<!DOCTYPE html>
  <html lang="cs">
    <head>
      <meta charset="UTF-8" />
      <title>Účtenka ${escapeHtml(order.order_number || order.id)}</title>
      <style>
        body { font-family: Arial, sans-serif; width: 72mm; margin: 0 auto; color: #111; }
        .wrap { padding: 10px 8px; }
        h1 { font-size: 18px; margin: 0 0 8px; text-align: center; }
        .muted { font-size: 11px; color: #555; text-align: center; margin-bottom: 10px; }
        .row { display: flex; justify-content: space-between; gap: 8px; font-size: 12px; margin: 6px 0; }
        .divider { border-top: 1px dashed #888; margin: 10px 0; }
        .total { font-size: 16px; font-weight: 700; }
      </style>
    </head>
    <body>
      <div class="wrap">
        <h1>EzFix</h1>
        <div class="muted">Objednávka ${escapeHtml(order.order_number || order.id)}</div>
        <div class="row"><span>Zákazník</span><strong>${escapeHtml(order.customer_name || '-')}</strong></div>
        <div class="row"><span>Datum</span><strong>${escapeHtml(formatDate(order.created_at))}</strong></div>
        <div class="divider"></div>
        ${lineItems}
        <div class="divider"></div>
        <div class="row total"><span>Celkem</span><strong>${formatMoney(order.total || 0)}</strong></div>
      </div>
    </body>
  </html>`;
}

function buildLabelDocumentHtml(order) {
  const template = state.labelTemplate || getDefaultLabelTemplate();
  const widthMm = clampNumber(template.widthMm, 30, 120, 58);
  const heightMm = clampNumber(template.heightMm, 20, 120, 38);
  const fontSize = clampNumber(template.fontSize, 8, 18, 11);
  const customer = escapeHtml(order.customer_name || '-');
  const orderNumber = escapeHtml(order.order_number || order.id || '-');
  const phone = escapeHtml(order.customer_phone || '-');
  const created = escapeHtml(formatDate(order.created_at));

  return `<!DOCTYPE html>
  <html lang="cs">
    <head>
      <meta charset="UTF-8" />
      <title>Stitek ${orderNumber}</title>
      <style>
        @page { size: ${widthMm}mm ${heightMm}mm; margin: 1.2mm; }
        html, body { margin: 0; padding: 0; }
        body { width: ${widthMm}mm; height: ${heightMm}mm; font-family: Arial, sans-serif; font-size: ${fontSize}px; color: #111; }
        .label { box-sizing: border-box; width: 100%; height: 100%; border: 1px solid #333; border-radius: 2mm; padding: 2mm; display: grid; gap: 1mm; align-content: start; }
        .head { font-weight: 700; text-align: center; border-bottom: 1px dashed #555; padding-bottom: 1mm; }
        .line { display: flex; justify-content: space-between; gap: 2mm; }
        .footer { margin-top: 1mm; text-align: center; font-size: ${Math.max(8, fontSize - 1)}px; color: #444; }
      </style>
    </head>
    <body>
      <div class="label">
        <div class="head">${escapeHtml(template.header || 'EZFix')}</div>
        <div class="line"><span>Objednavka</span><strong>${orderNumber}</strong></div>
        <div class="line"><span>Zakaznik</span><strong>${customer}</strong></div>
        ${template.showPhone ? `<div class="line"><span>Telefon</span><strong>${phone}</strong></div>` : ''}
        ${template.showDate ? `<div class="line"><span>Datum</span><strong>${created}</strong></div>` : ''}
        <div class="footer">${escapeHtml(template.footer || '')}</div>
      </div>
    </body>
  </html>`;
}

async function printHtmlDocument({ title, html, printerName }) {
  if (window.ezfixDesktop?.printHtml) {
    await window.ezfixDesktop.printHtml({ title, html, printerName: printerName || '' });
    return;
  }

  const printWindow = window.open('', '_blank', 'width=960,height=720');
  if (!printWindow) {
    throw new Error('Nepodařilo se otevřít tiskové okno');
  }
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
}

async function savePdfDocument({ title, html, defaultFileName }) {
  if (!window.ezfixDesktop?.savePdf) {
    throw new Error('Uložení PDF není v tomto prostředí dostupné');
  }
  await window.ezfixDesktop.savePdf({ title, html, defaultFileName });
}

async function printOrderInvoice(orderId) {
  const { order, items } = await ensureOrderData(orderId);
  await printHtmlDocument({
    title: `Faktura ${order.order_number || order.id}`,
    html: buildInvoiceDocumentHtml(order, items),
    printerName: state.fullPrintPrinter
  });
  showToast('Faktura byla odeslána na tisk');
}

async function saveOrderInvoicePdf(orderId) {
  const { order, items } = await ensureOrderData(orderId);
  await savePdfDocument({
    title: `Faktura ${order.order_number || order.id}`,
    html: buildInvoiceDocumentHtml(order, items),
    defaultFileName: `faktura-${String(order.order_number || order.id).replace(/[^a-zA-Z0-9-_]+/g, '-')}.pdf`
  });
  showToast('Faktura byla uložena do PDF');
}

async function printOrderReceipt(orderId) {
  const { order, items } = await ensureOrderData(orderId);
  await printHtmlDocument({
    title: `Účtenka ${order.order_number || order.id}`,
    html: buildReceiptDocumentHtml(order, items),
    printerName: state.receiptPrinter
  });
  showToast('Účtenka byla odeslána na tisk');
}

function showLabelPrintPlaceholder() {
  showToast('Tisk štítků bude doplněn později');
}

async function printOrderLabel(orderId) {
  const { order } = await ensureOrderData(orderId);
  const html = buildLabelDocumentHtml(order);
  await printHtmlDocument({
    title: `Stitek ${order.order_number || order.id}`,
    html,
    printerName: state.labelPrinter
  });
  showToast('Štítek byl odeslán na tisk');
}

async function deleteOrder(orderId) {
  if (!canManageOrders()) {
    throw new Error('Nemáte oprávnění mazat objednávky.');
  }

  const order = getOrderById(orderId);
  const label = order?.order_number || orderId;
  if (!window.confirm(`Opravdu smazat objednávku ${label}?`)) {
    return;
  }

  await apiFetch(`/orders/${orderId}`, { method: 'DELETE' });
  state.orders = state.orders.filter((item) => String(item.id) !== String(orderId));
  state.detailsById.delete(String(orderId));
  if (String(state.expandedOrderId) === String(orderId)) state.expandedOrderId = null;
  if (String(state.fullscreenOrderId) === String(orderId)) closeOrderFullscreen();
  renderOrders();
  showToast('Objednávka byla smazána');
}

function bindOrderActionButtons(root) {
  if (!root) return;

  root.querySelectorAll('[data-order-action]').forEach((button) => {
    button.addEventListener('click', async () => {
      const action = button.getAttribute('data-order-action');
      const orderId = button.getAttribute('data-order-id');
      if (!action || !orderId) return;

      button.disabled = true;
      try {
        if (action === 'invoice-print') await printOrderInvoice(orderId);
        if (action === 'invoice-save') await saveOrderInvoicePdf(orderId);
        if (action === 'receipt-print') await printOrderReceipt(orderId);
        if (action === 'label-print') await printOrderLabel(orderId);
        if (action === 'delete') await deleteOrder(orderId);
      } catch (error) {
        alert(error.message || 'Akce nad objednávkou selhala');
      } finally {
        button.disabled = false;
      }
    });
  });
}

function prettyJson(value) {
  return JSON.stringify(value ?? {}, null, 2);
}

async function loadCatalogEditor() {
  const errorEl = document.getElementById('catalogEditorError');
  const input = document.getElementById('catalogEditorInput');
  if (!input || !errorEl) return;

  errorEl.textContent = '';

  if (!canAccessCatalog()) {
    errorEl.textContent = 'Nemáte oprávnění pro správu katalogu.';
    return;
  }

  const result = await apiFetch('/catalog');
  const catalog = result.catalog || {};
  state.catalog = catalog;
  ensureInventoryArrays(state.catalog);
  normalizeInventoryPrices(state.catalog);
  input.value = prettyJson(catalog);
  renderEasyCatalogEditor();
}

async function saveCatalogEditor() {
  const errorEl = document.getElementById('catalogEditorError');
  const input = document.getElementById('catalogEditorInput');
  if (!input || !errorEl) return;

  errorEl.textContent = '';

  if (!canAccessCatalog()) {
    errorEl.textContent = 'Nemáte oprávnění pro správu katalogu.';
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(input.value || '{}');
  } catch {
    errorEl.textContent = 'Katalog JSON není validní.';
    return;
  }

  await apiFetch('/catalog', {
    method: 'PUT',
    body: JSON.stringify({ catalog: parsed })
  });

  state.catalog = parsed;
  state.inventoryDraft = cloneCatalog(parsed);
  if (state.inventoryDraft && typeof state.inventoryDraft === 'object') {
    ensureInventoryArrays(state.inventoryDraft);
    normalizeInventoryPrices(state.inventoryDraft);
  }
  renderInventory();
  renderEasyCatalogEditor();
  showToast('Katalog byl uložen');
}

function setCatalogEditorMode(mode) {
  const nextMode = mode === 'easy' ? 'easy' : 'advanced';
  state.catalogEditorMode = nextMode;
  localStorage.setItem('ezfixDesktopCatalogMode', nextMode);

  const advancedPanel = document.getElementById('catalogAdvancedPanel');
  const easyPanel = document.getElementById('catalogEasyPanel');
  const advancedBtn = document.getElementById('catalogAdvancedBtn');
  const easyBtn = document.getElementById('catalogEasyBtn');

  if (advancedPanel) advancedPanel.classList.toggle('hidden', nextMode !== 'advanced');
  if (easyPanel) easyPanel.classList.toggle('hidden', nextMode !== 'easy');
  if (advancedBtn) advancedBtn.classList.toggle('secondary', nextMode !== 'advanced');
  if (easyBtn) easyBtn.classList.toggle('secondary', nextMode !== 'easy');
}

function getEasyCatalogKind() {
  const select = document.getElementById('easyCatalogKind');
  const selected = String(select?.value || 'printers');
  if (EASY_CATALOG_KIND_LABELS[selected]) return selected;
  return 'printers';
}

function getEasyCatalogList(kind) {
  if (!state.catalog || typeof state.catalog !== 'object') {
    state.catalog = {};
  }
  ensureInventoryArrays(state.catalog);
  const printing = state.catalog?.printing || {};
  if (!Array.isArray(printing[kind])) printing[kind] = [];
  return printing[kind];
}

function renderEasyCatalogEditor() {
  const listEl = document.getElementById('easyCatalogList');
  const kindLabelEl = document.getElementById('easyCatalogKindLabel');
  const kindCountEl = document.getElementById('easyCatalogKindCount');
  const toggleBtn = document.getElementById('easyCatalogToggleListBtn');
  const addCategoryBtn = document.getElementById('easyCatalogAddCategoryBtn');
  if (!listEl || !kindLabelEl || !kindCountEl || !toggleBtn) return;

  // Zobrazit tlačítko jen když je editace zapnutá
  if (addCategoryBtn) {
    addCategoryBtn.classList.toggle('hidden', !state.inventoryEditMode);
  }

  if (!canAccessCatalog()) {
    listEl.innerHTML = '<li>Nemáte oprávnění pro easy editor katalogu.</li>';
    kindLabelEl.textContent = '-';
    kindCountEl.textContent = '0';
    return;
  }

  const kind = getEasyCatalogKind();
  const list = getEasyCatalogList(kind);

  kindLabelEl.textContent = EASY_CATALOG_KIND_LABELS[kind] || kind;
  kindCountEl.textContent = String(list.length);

  listEl.classList.toggle('hidden', !state.easyCatalogListVisible);
  toggleBtn.textContent = state.easyCatalogListVisible ? 'Skrýt položky' : 'Zobrazit položky';
  
  const cancelBtn = document.getElementById('easyCatalogCancelBtn');
  if (cancelBtn) {
    cancelBtn.classList.toggle('hidden', state.easyCatalogEditIndex === null);
  }
  
  if (!state.easyCatalogListVisible) return;

  if (list.length === 0) {
    listEl.innerHTML = '<li>Žádné položky v této sekci.</li>';
    return;
  }

  listEl.innerHTML = list.map((item, index) => {
    const name = escapeHtml(item?.name || item?.id || `Položka ${index + 1}`);
    const price = Number(item?.price || 0);
    const safePrice = Number.isFinite(price) ? price : 0;
    const activeLabel = item?.active === false ? 'Neaktivní' : 'Aktivní';
    const isEditing = state.easyCatalogEditIndex === index;
    const activeClass = isEditing ? 'easy-catalog-item-editing' : '';

    return `
      <li class="easy-catalog-item ${activeClass}" data-easy-catalog-index="${index}">
        <div class="easy-catalog-item-content">
          <strong>${name}</strong>
          <span class="small">${safePrice.toFixed(2)} Kč</span>
          <span class="small">${activeLabel}</span>
        </div>
        <div class="easy-catalog-item-actions">
          <button class="secondary easy-catalog-edit" type="button" data-easy-edit-index="${index}">Upravit</button>
          <button class="danger easy-catalog-remove" type="button" data-easy-remove-index="${index}">Smazat</button>
        </div>
      </li>
    `;
  }).join('');

  listEl.querySelectorAll('[data-easy-catalog-index]').forEach((li) => {
    li.addEventListener('click', () => {
      const index = Number(li.getAttribute('data-easy-catalog-index'));
      if (Number.isFinite(index) && index >= 0 && index < list.length) {
        state.easyCatalogEditIndex = index === state.easyCatalogEditIndex ? null : index;
        if (state.easyCatalogEditIndex !== null) {
          const item = list[index];
          document.getElementById('easyCatalogName').value = String(item?.name || '');
          document.getElementById('easyCatalogPrice').value = String(item?.price || 0);
          document.getElementById('easyCatalogActive').checked = item?.active !== false;
        }
        renderEasyCatalogEditor();
      }
    });
  });

  listEl.querySelectorAll('[data-easy-edit-index]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const index = Number(button.getAttribute('data-easy-edit-index'));
      if (Number.isFinite(index) && index >= 0 && index < list.length) {
        state.easyCatalogEditIndex = index === state.easyCatalogEditIndex ? null : index;
        if (state.easyCatalogEditIndex !== null) {
          const item = list[index];
          document.getElementById('easyCatalogName').value = String(item?.name || '');
          document.getElementById('easyCatalogPrice').value = String(item?.price || 0);
          document.getElementById('easyCatalogActive').checked = item?.active !== false;
        }
        renderEasyCatalogEditor();
      }
    });
  });

  listEl.querySelectorAll('[data-easy-remove-index]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const index = Number(button.getAttribute('data-easy-remove-index'));
      if (!Number.isFinite(index) || index < 0 || index >= list.length) return;
      if (state.easyCatalogEditIndex === index) {
        state.easyCatalogEditIndex = null;
      }
      list.splice(index, 1);
      renderInventory();
      renderEasyCatalogEditor();
    });
  });
}

function addEasyCatalogItem() {
  const errorEl = document.getElementById('easyCatalogError');
  if (errorEl) errorEl.textContent = '';

  if (!canAccessCatalog()) {
    if (errorEl) errorEl.textContent = 'Nemáte oprávnění pro easy editor katalogu.';
    return;
  }

  const nameInput = document.getElementById('easyCatalogName');
  const priceInput = document.getElementById('easyCatalogPrice');
  const activeInput = document.getElementById('easyCatalogActive');

  const name = String(nameInput?.value || '').trim();
  const price = Number(priceInput?.value || 0);
  const kind = getEasyCatalogKind();

  if (!name) {
    if (errorEl) errorEl.textContent = 'Zadejte název položky.';
    return;
  }

  if (!Number.isFinite(price) || price < 0) {
    if (errorEl) errorEl.textContent = 'Cena musí být kladné číslo nebo 0.';
    return;
  }

  const list = getEasyCatalogList(kind);
  
  if (state.easyCatalogEditIndex !== null && state.easyCatalogEditIndex >= 0 && state.easyCatalogEditIndex < list.length) {
    list[state.easyCatalogEditIndex].name = name;
    list[state.easyCatalogEditIndex].price = price;
    list[state.easyCatalogEditIndex].active = Boolean(activeInput?.checked);
  } else {
    list.push({
      id: `${kind}-${Date.now()}`,
      name,
      price,
      active: Boolean(activeInput?.checked)
    });
  }

  if (nameInput) nameInput.value = '';
  if (priceInput) priceInput.value = '0';
  state.easyCatalogEditIndex = null;

  renderInventory();
  renderEasyCatalogEditor();
}

async function saveEasyCatalogEditor() {
  const errorEl = document.getElementById('easyCatalogError');
  if (errorEl) errorEl.textContent = '';

  if (!canAccessCatalog()) {
    if (errorEl) errorEl.textContent = 'Nemáte oprávnění pro easy editor katalogu.';
    return;
  }

  try {
    ensureInventoryArrays(state.catalog || {});
    await apiFetch('/catalog', {
      method: 'PUT',
      body: JSON.stringify({ catalog: state.catalog })
    });

    const input = document.getElementById('catalogEditorInput');
    if (input) input.value = prettyJson(state.catalog);

    state.inventoryDraft = cloneCatalog(state.catalog);
    renderInventory();
    renderEasyCatalogEditor();
    showToast('Easy změny katalogu byly uloženy');
  } catch (error) {
    if (errorEl) errorEl.textContent = error.message || 'Uložení easy editoru selhalo';
  }
}

function chatStatusLabel(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'open') return 'Otevřený';
  if (normalized === 'closed') return 'Uzavřený';
  if (normalized === 'awaiting_rating') return 'Čeká na hodnocení';
  return normalized || '-';
}

function getCurrentAdminName() {
  return String(state.currentUser?.username || '').trim();
}

function getActiveChatSession() {
  return state.chatSessions.find((session) => String(session.id) === String(state.activeChatSessionId));
}

function getChatReplyLockState(session) {
  if (!session) {
    return { locked: true, reason: 'none-selected' };
  }

  const assignedAdmin = String(session.assigned_admin_name || '').trim();
  const currentAdmin = getCurrentAdminName();

  if (!assignedAdmin) {
    return { locked: true, reason: 'needs-take' };
  }

  if (assignedAdmin !== currentAdmin) {
    return { locked: true, reason: 'taken-by-other', assignedAdmin };
  }

  return { locked: false, reason: 'taken-by-current' };
}

function syncChatTakeOverlay() {
  const overlay = document.getElementById('chatTakeOverlay');
  const overlayTitle = document.getElementById('chatTakeOverlayTitle');
  const overlayInfo = document.getElementById('chatTakeOverlayInfo');
  const overlayBtn = document.getElementById('chatTakeOverlayBtn');
  const threadBlock = document.querySelector('.chat-thread-block');
  const replyInput = document.getElementById('chatReplyInput');
  const replySubmit = document.querySelector('#chatReplyForm button[type="submit"]');
  const topTakeBtn = document.getElementById('chatTakeBtn');
  if (!overlay || !overlayTitle || !overlayInfo || !overlayBtn || !threadBlock) return;

  const active = getActiveChatSession();
  const lock = getChatReplyLockState(active);
  const isLocked = lock.locked;

  overlay.classList.toggle('hidden', !isLocked);
  threadBlock.classList.toggle('chat-thread-locked', isLocked);

  if (replyInput) {
    replyInput.disabled = isLocked;
    if (isLocked) {
      replyInput.placeholder = lock.reason === 'taken-by-other'
        ? 'Tento chat je převzat jiným administrátorem.'
        : 'Pro odpověď nejprve převezměte chat.';
    } else {
      replyInput.placeholder = 'Napište odpověď...';
    }
  }

  if (replySubmit) {
    replySubmit.disabled = isLocked;
  }

  if (topTakeBtn) {
    topTakeBtn.disabled = Boolean(active && lock.reason === 'taken-by-other');
  }

  if (!isLocked) return;

  const customerName = active?.customer_name || '-';
  const customerEmail = active?.customer_email || '-';
  const helpTopic = active?.help_topic || '-';

  if (lock.reason === 'taken-by-other') {
    overlayTitle.textContent = 'Chat je již převzat';
    overlayInfo.textContent = `Klient: ${customerName} | Email: ${customerEmail} | Téma: ${helpTopic} | Převzal: ${lock.assignedAdmin}`;
    overlayBtn.textContent = 'Obsazeno';
    overlayBtn.disabled = true;
    return;
  }

  overlayTitle.textContent = 'Převzít chat';
  overlayInfo.textContent = `Klient: ${customerName} | Email: ${customerEmail} | Téma: ${helpTopic}`;
  overlayBtn.textContent = 'Převzít chat';
  overlayBtn.disabled = false;
}

function renderChatSessions() {
  const listEl = document.getElementById('chatSessionsList');
  if (!listEl) return;

  if (!canAccessChats()) {
    listEl.innerHTML = '<div class="small">Nemáte oprávnění k chat manageru.</div>';
    return;
  }

  if (!Array.isArray(state.chatSessions) || state.chatSessions.length === 0) {
    listEl.innerHTML = '<div class="small">Žádné chaty.</div>';
    return;
  }

  listEl.innerHTML = state.chatSessions.map((session) => {
    const isActive = String(state.activeChatSessionId || '') === String(session.id || '');
    const unread = Number(session.unread_count || 0);
    const title = session.customer_name || session.customer_email || session.id || 'Chat';

    return `
      <div class="chat-session-item ${isActive ? 'active' : ''}" data-chat-session="${escapeHtml(session.id)}">
        <div class="chat-session-title">${escapeHtml(title)}</div>
        <div class="chat-session-meta">
          ${escapeHtml(chatStatusLabel(session.status))}
          ${unread > 0 ? ` | Nepřečtené: ${unread}` : ''}
        </div>
        <div class="chat-session-meta">${escapeHtml(session.last_message || '-')}</div>
      </div>
    `;
  }).join('');

  listEl.querySelectorAll('[data-chat-session]').forEach((node) => {
    node.addEventListener('click', () => {
      const sessionId = node.getAttribute('data-chat-session');
      if (!sessionId) return;
      openChatSession(sessionId);
    });
  });
}

function renderChatThread() {
  const metaEl = document.getElementById('chatThreadMeta');
  const messagesEl = document.getElementById('chatMessages');
  if (!metaEl || !messagesEl) return;

  const active = getActiveChatSession();

  if (!active) {
    metaEl.textContent = 'Vyberte konverzaci vlevo.';
    messagesEl.innerHTML = '<div class="small">Bez vybraného chatu.</div>';
    syncChatTakeOverlay();
    return;
  }

  metaEl.textContent = `${active.customer_name || '-'} | ${active.customer_email || '-'} | ${chatStatusLabel(active.status)}`;

  if (!Array.isArray(state.activeChatMessages) || state.activeChatMessages.length === 0) {
    messagesEl.innerHTML = '<div class="small">Chat zatím neobsahuje zprávy.</div>';
    syncChatTakeOverlay();
    return;
  }

  messagesEl.innerHTML = state.activeChatMessages.map((msg) => {
    const senderType = String(msg.sender_type || '').toLowerCase() || 'user';
    const senderName = msg.sender_name || (senderType === 'admin' ? 'Admin' : 'Uživatel');
    return `
      <div class="chat-message ${escapeHtml(senderType)}">
        <div class="chat-message-head">${escapeHtml(senderName)} | ${formatDate(msg.created_at)}</div>
        <div>${escapeHtml(msg.message || '')}</div>
      </div>
    `;
  }).join('');

  syncChatTakeOverlay();
}

async function loadChatSessions() {
  if (!canAccessChats()) {
    state.chatSessions = [];
    state.activeChatSessionId = null;
    state.activeChatMessages = [];
    renderChatSessions();
    renderChatThread();
    return;
  }

  const result = await apiFetch('/chat/admin/sessions');
  state.chatSessions = Array.isArray(result.sessions) ? result.sessions : [];

  if (!state.activeChatSessionId && state.chatSessions.length > 0) {
    state.activeChatSessionId = String(state.chatSessions[0].id);
  }

  renderChatSessions();

  if (state.activeChatSessionId) {
    await openChatSession(state.activeChatSessionId);
  } else {
    renderChatThread();
  }
}

async function openChatSession(sessionId) {
  state.activeChatSessionId = String(sessionId || '');
  renderChatSessions();

  if (!state.activeChatSessionId) {
    state.activeChatMessages = [];
    renderChatThread();
    return;
  }

  const result = await apiFetch(`/chat/admin/sessions/${state.activeChatSessionId}/messages`);
  state.activeChatMessages = Array.isArray(result.messages) ? result.messages : [];

  if (result.session && typeof result.session === 'object') {
    state.chatSessions = state.chatSessions.map((session) => (
      String(session.id) === String(state.activeChatSessionId)
        ? { ...session, ...result.session }
        : session
    ));
  }

  renderChatThread();
}

async function sendChatReplyFromForm(event) {
  event.preventDefault();
  const errorEl = document.getElementById('chatReplyError');
  const input = document.getElementById('chatReplyInput');
  if (!errorEl || !input) return;

  errorEl.textContent = '';

  if (!state.activeChatSessionId) {
    errorEl.textContent = 'Vyberte nejdřív chat.';
    return;
  }

  const lock = getChatReplyLockState(getActiveChatSession());
  if (lock.locked) {
    errorEl.textContent = lock.reason === 'taken-by-other'
      ? 'Chat je převzat jiným administrátorem.'
      : 'Pro odpověď nejprve klikněte na Převzít chat.';
    return;
  }

  const message = input.value.trim();
  if (!message) {
    errorEl.textContent = 'Zadejte odpověď.';
    return;
  }

  await apiFetch(`/chat/admin/sessions/${state.activeChatSessionId}/reply`, {
    method: 'POST',
    body: JSON.stringify({ message })
  });

  input.value = '';
  await openChatSession(state.activeChatSessionId);
  await loadChatSessions();
  showToast('Odpověď byla odeslána');
}

async function chatAction(action) {
  if (!state.activeChatSessionId) {
    showToast('Vyberte nejdřív chat');
    return;
  }

  const sessionId = state.activeChatSessionId;
  if (action === 'take') {
    await apiFetch(`/chat/admin/sessions/${sessionId}/take`, { method: 'POST', body: JSON.stringify({}) });
    showToast('Chat byl převzat');
  } else if (action === 'close') {
    await apiFetch(`/chat/admin/sessions/${sessionId}/close`, { method: 'POST', body: JSON.stringify({}) });
    showToast('Chat byl uzavřen');
  } else if (action === 'delete') {
    await apiFetch(`/chat/admin/sessions/${sessionId}`, { method: 'DELETE' });
    showToast('Chat byl smazán');
    state.activeChatSessionId = null;
    state.activeChatMessages = [];
  }

  await loadChatSessions();
}

async function loadChatAiConfig() {
  const errorEl = document.getElementById('chatAiConfigError');
  const input = document.getElementById('chatAiConfigInput');
  if (!input || !errorEl) return;

  errorEl.textContent = '';

  if (!canAccessChats()) {
    errorEl.textContent = 'Nemáte oprávnění na AI konfiguraci chatu.';
    return;
  }

  const result = await apiFetch('/chat/admin/ai-config');
  state.chatAiConfig = result.config || {};
  input.value = prettyJson(state.chatAiConfig);
}

async function saveChatAiConfig() {
  const errorEl = document.getElementById('chatAiConfigError');
  const input = document.getElementById('chatAiConfigInput');
  if (!input || !errorEl) return;

  errorEl.textContent = '';

  let parsed;
  try {
    parsed = JSON.parse(input.value || '{}');
  } catch {
    errorEl.textContent = 'AI config JSON není validní.';
    return;
  }

  await apiFetch('/chat/admin/ai-config', {
    method: 'PUT',
    body: JSON.stringify({ config: parsed })
  });

  state.chatAiConfig = parsed;
  showToast('AI konfigurace chatu byla uložena');
}

function renderUsers() {
  if (!isOwner()) {
    usersTableBody.innerHTML = '<tr><td colspan="5">Nemáte oprávnění k zobrazení uživatelů.</td></tr>';
    return;
  }

  if (!Array.isArray(state.users) || state.users.length === 0) {
    usersTableBody.innerHTML = '<tr><td colspan="5">Žádní uživatelé.</td></tr>';
    return;
  }

  usersTableBody.innerHTML = state.users.map((user) => {
    const isSelf = Number(user.id) === Number(state.currentUser?.id);
    const isOwnerAccount = String(user.role || '').toLowerCase() === 'owner';
    const deleteDisabled = isSelf || isOwnerAccount;
    const deleteTitle = isSelf
      ? 'Nelze smazat vlastní účet'
      : (isOwnerAccount ? 'Nelze smazat účet owner' : 'Smazat uživatele');

    return `
      <tr>
        <td>${escapeHtml(user.username || '-')}</td>
        <td>${escapeHtml(user.email || '-')}</td>
        <td>${escapeHtml(formatRoleLabel(user.role))}</td>
        <td>${formatDate(user.created_at)}</td>
        <td>
          <div class="users-actions">
            <button class="secondary" data-user-edit="${user.id}">Upravit</button>
            <button class="danger" data-user-delete="${user.id}" ${deleteDisabled ? 'disabled' : ''} title="${escapeHtml(deleteTitle)}">Smazat</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  usersTableBody.querySelectorAll('[data-user-edit]').forEach((button) => {
    button.addEventListener('click', () => {
      const userId = button.getAttribute('data-user-edit');
      if (!userId) return;
      openEditUserModal(userId);
    });
  });

  usersTableBody.querySelectorAll('[data-user-delete]').forEach((button) => {
    button.addEventListener('click', async () => {
      const userId = button.getAttribute('data-user-delete');
      if (!userId) return;
      button.disabled = true;
      try {
        await deleteUserById(userId);
      } catch (error) {
        alert(error.message || 'Smazání uživatele selhalo');
        button.disabled = false;
      }
    });
  });
}

async function deleteUserById(userId) {
  if (!isOwner()) {
    showToast('Pouze owner může mazat uživatele');
    return;
  }

  await apiFetch(`/admin/users/${userId}`, {
    method: 'DELETE'
  });

  state.users = state.users.filter((user) => String(user.id) !== String(userId));
  renderUsers();
  showToast('Uživatel byl smazán');
}

async function loadUsers() {
  if (!isOwner()) {
    state.users = [];
    renderUsers();
    return;
  }

  const result = await apiFetch('/admin/users');
  state.users = Array.isArray(result.users) ? result.users : [];
  renderUsers();
}

async function createUserFromForm(event) {
  event.preventDefault();
  const errorEl = document.getElementById('createUserError');
  errorEl.textContent = '';

  if (!isOwner()) {
    errorEl.textContent = 'Pouze owner může vytvářet přihlášení.';
    return;
  }

  try {
    const username = document.getElementById('newUserUsername').value.trim();
    const email = document.getElementById('newUserEmail').value.trim();
    const password = document.getElementById('newUserPassword').value;
    const role = document.getElementById('newUserRole').value;

    await apiFetch('/admin/users', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, role })
    });

    document.getElementById('createUserForm').reset();
    document.getElementById('newUserRole').value = 'manager';
    showToast('Nové přihlášení bylo vytvořeno');
    await loadUsers();
  } catch (error) {
    errorEl.textContent = error.message || 'Vytvoření uživatele selhalo';
  }
}

function openEditUserModal(userId) {
  if (!isOwner() || !editUserModal) {
    showToast('Pouze owner může upravovat uživatele');
    return;
  }

  const user = state.users.find((item) => String(item.id) === String(userId));
  if (!user) {
    showToast('Uživatel nebyl nalezen');
    return;
  }

  const isSelf = Number(user.id) === Number(state.currentUser?.id);
  const isOwnerAccount = String(user.role || '').toLowerCase() === 'owner';
  const roleLocked = isSelf || isOwnerAccount;

  document.getElementById('editUserId').value = String(user.id);
  document.getElementById('editUserUsername').value = String(user.username || '');
  document.getElementById('editUserEmail').value = String(user.email || '');
  document.getElementById('editUserPassword').value = '';

  const roleSelect = document.getElementById('editUserRole');
  roleSelect.value = String(user.role || 'customer').toLowerCase();
  roleSelect.disabled = roleLocked;

  const roleNote = document.getElementById('editUserRoleNote');
  if (isSelf) {
    roleNote.textContent = 'U vlastního účtu nelze měnit roli.';
  } else if (isOwnerAccount) {
    roleNote.textContent = 'U účtu owner nelze měnit roli.';
  } else {
    roleNote.textContent = '';
  }

  document.getElementById('editUserError').textContent = '';
  editUserModal.classList.remove('hidden');
}

function closeEditUserModal() {
  if (!editUserModal) return;
  editUserModal.classList.add('hidden');
  document.getElementById('editUserForm').reset();
  document.getElementById('editUserRole').disabled = false;
  document.getElementById('editUserRoleNote').textContent = '';
  document.getElementById('editUserError').textContent = '';
}

async function updateUserFromForm(event) {
  event.preventDefault();
  const errorEl = document.getElementById('editUserError');
  errorEl.textContent = '';

  if (!isOwner()) {
    errorEl.textContent = 'Pouze owner může upravovat uživatele.';
    return;
  }

  const userId = document.getElementById('editUserId').value;
  const existing = state.users.find((user) => String(user.id) === String(userId));
  if (!existing) {
    errorEl.textContent = 'Uživatel nebyl nalezen.';
    return;
  }

  const nextUsername = document.getElementById('editUserUsername').value.trim();
  const nextEmailRaw = document.getElementById('editUserEmail').value.trim();
  const nextEmail = nextEmailRaw.toLowerCase();
  const nextPassword = document.getElementById('editUserPassword').value;
  const roleSelect = document.getElementById('editUserRole');
  const roleLocked = roleSelect.disabled;

  const payload = {};

  if (nextUsername && nextUsername !== String(existing.username || '')) {
    payload.username = nextUsername;
  }

  const currentEmail = String(existing.email || '').trim().toLowerCase();
  if (nextEmail !== currentEmail) {
    payload.email = nextEmail;
  }

  if (nextPassword) {
    payload.password = nextPassword;
  }

  const selectedRole = roleSelect.value;
  if (!roleLocked && selectedRole !== String(existing.role || '')) {
    payload.role = selectedRole;
  }

  if (Object.keys(payload).length === 0) {
    errorEl.textContent = 'Nejsou žádné změny k uložení.';
    return;
  }

  const submitBtn = document.querySelector('#editUserForm button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;

  try {
    const result = await apiFetch(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });

    const updatedUser = result.user || { ...existing, ...payload };
    state.users = state.users.map((user) => (
      String(user.id) === String(userId)
        ? { ...user, ...updatedUser }
        : user
    ));

    renderUsers();
    closeEditUserModal();
    showToast('Uživatel byl upraven');
  } catch (error) {
    errorEl.textContent = error.message || 'Uprava uživatele selhala';
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

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
  if (type === 'used-shop') return 'Bazar';
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

async function uploadAdminFile(file) {
  if (!file) return '';

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${state.apiBase}/uploads`, {
    method: 'POST',
    headers: {
      ...getAuthHeader()
    },
    body: formData
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    throw new Error(data.message || `Upload error (${response.status})`);
  }

  return String(data.url || '');
}

async function createManualOrderFromForm(event) {
  event.preventDefault();
  const errorEl = document.getElementById('createManualOrderError');
  errorEl.textContent = '';

  if (!canManageOrders()) {
    errorEl.textContent = 'Nemáte oprávnění vytvářet objednávky.';
    return;
  }

  const submitBtn = document.querySelector('#createManualOrderForm button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;

  try {
    const customerName = document.getElementById('manualOrderCustomerName').value.trim();
    const customerEmail = document.getElementById('manualOrderCustomerEmail').value.trim();
    const customerPhone = document.getElementById('manualOrderCustomerPhone').value.trim();
    const repairName = document.getElementById('manualOrderItemName').value.trim();
    const priceValue = Number(document.getElementById('manualOrderItemPrice').value);
    const status = document.getElementById('manualOrderStatus').value;
    const serviceType = document.getElementById('manualOrderServiceType').value;
    const notes = document.getElementById('manualOrderNotes').value.trim();
    const scanInput = document.getElementById('manualOrderInvoiceScan');
    const scanFile = scanInput?.files?.[0];

    if (!Number.isFinite(priceValue) || priceValue < 0) {
      throw new Error('Zadejte platnou cenu položky.');
    }

    let scanFileUrl = '';
    if (scanFile) {
      scanFileUrl = await uploadAdminFile(scanFile);
    }

    await apiFetch('/orders/admin/manual', {
      method: 'POST',
      body: JSON.stringify({
        customerName,
        customerEmail,
        customerPhone,
        serviceType,
        status,
        notes,
        items: [
          {
            device: 'other',
            brand: 'N/A',
            model: 'N/A',
            repairType: 'manual',
            repairName,
            price: priceValue,
            fileName: scanFileUrl
          }
        ]
      })
    });

    document.getElementById('createManualOrderForm').reset();
    document.getElementById('manualOrderStatus').value = 'pending';
    document.getElementById('manualOrderServiceType').value = 'pickup';
    closeOrderOpsModals();
    showToast('Objednávka byla vytvořena');
    await loadDashboardData({ silent: true });
  } catch (error) {
    errorEl.textContent = error.message || 'Vytvoření objednávky selhalo';
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

async function createInvoiceFromForm(event) {
  event.preventDefault();
  const errorEl = document.getElementById('createInvoiceError');
  errorEl.textContent = '';

  if (!canManageOrders()) {
    errorEl.textContent = 'Nemáte oprávnění vytvářet faktury.';
    return;
  }

  const submitBtn = document.querySelector('#createInvoiceForm button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;

  try {
    const invoiceNumber = document.getElementById('invoiceNumber').value.trim();
    const orderIdValue = document.getElementById('invoiceOrderId').value.trim();
    const customerName = document.getElementById('invoiceCustomerName').value.trim();
    const customerEmail = document.getElementById('invoiceCustomerEmail').value.trim();
    const description = document.getElementById('invoiceDescription').value.trim();
    const amount = Number(document.getElementById('invoiceAmount').value);
    const dueDate = document.getElementById('invoiceDueDate').value;
    const status = document.getElementById('invoiceStatus').value;
    const notes = document.getElementById('invoiceNotes').value.trim();
    const scanInput = document.getElementById('invoiceScanFile');
    const scanFile = scanInput?.files?.[0];

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Zadejte platnou částku faktury.');
    }

    let scanFileUrl = '';
    if (scanFile) {
      scanFileUrl = await uploadAdminFile(scanFile);
    }

    const payload = {
      invoiceNumber,
      customerName,
      customerEmail,
      description,
      amount,
      dueDate,
      status,
      notes,
      scanFileUrl
    };

    if (orderIdValue) {
      payload.orderId = Number(orderIdValue);
    }

    const result = await apiFetch('/orders/admin/invoices', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    document.getElementById('createInvoiceForm').reset();
    document.getElementById('invoiceStatus').value = 'issued';
    closeOrderOpsModals();
    const createdNumber = result?.invoice?.invoiceNumber;
    showToast(createdNumber ? `Faktura ${createdNumber} byla vytvořena` : 'Faktura byla vytvořena');
  } catch (error) {
    errorEl.textContent = error.message || 'Vytvoření faktury selhalo';
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

function getOrderItems(orderId) {
  const details = state.detailsById.get(String(orderId));
  return Array.isArray(details?.items) ? details.items : [];
}

function classifyOrder(details) {
  const items = Array.isArray(details?.items) ? details.items : [];
  const devices = new Set(items.map((item) => String(item.device || '').toLowerCase()));
  const repairTypes = new Set(items.map((item) => String(item.repair_type || item.repairType || '').toLowerCase()));
  if ([...devices].some((d) => d === 'printing' || d === '3d-printing')) return '3d-printing';
  if ([...devices].some((d) => d === 'custompc')) return 'custom-pc';
  if ([...repairTypes].some((r) => r === 'used-device' || r === 'used-shop')) return 'used-shop';
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

    const canEditStatus = canManageOrders();

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
              ${createOrderActionButtons(order.id)}
              ${canEditStatus ? `
                <div class="status-edit">
                  <strong>Změna stavu:</strong>
                  <select id="orderStatusSelectInline-${order.id}">
                    ${statusOptionsHtml(order.status)}
                  </select>
                  <button data-order-status-save="${order.id}" data-select-id="orderStatusSelectInline-${order.id}">Uložit stav + e-mail</button>
                </div>
              ` : ''}
            </div>
          </td>
        </tr>
      `
      : '';

    return `
      <tr>
        <td>
          <div class="details-actions">
            <button class="details-btn" data-order-toggle="${order.id}">${isExpanded ? 'Skryt' : 'Otevřít'}</button>
            <button class="details-btn" data-order-fullscreen="${order.id}">Celá obrazovka</button>
          </div>
        </td>
        <td>${escapeHtml(order.order_number || order.id)}</td>
        <td>${escapeHtml(order.customer_name || '-')}</td>
        <td>${statusPillHtml(order.status || '-')}</td>
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

  ordersTableBody.querySelectorAll('[data-order-fullscreen]').forEach((button) => {
    button.addEventListener('click', () => {
      const targetId = button.getAttribute('data-order-fullscreen');
      if (!targetId) return;
      openOrderFullscreen(targetId);
    });
  });

  ordersTableBody.querySelectorAll('[data-order-status-save]').forEach((button) => {
    button.addEventListener('click', async () => {
      const targetId = button.getAttribute('data-order-status-save');
      const selectId = button.getAttribute('data-select-id');
      const select = selectId ? document.getElementById(selectId) : null;
      if (!targetId || !select) return;
      button.disabled = true;
      try {
        await updateOrderStatus(targetId, select.value);
      } catch (error) {
        alert(error.message || 'Změna stavu selhala');
      } finally {
        button.disabled = false;
      }
    });
  });

  bindOrderActionButtons(ordersTableBody);
}

function cloneCatalog(catalog) {
  return JSON.parse(JSON.stringify(catalog || {}));
}

function ensureInventoryArrays(catalog) {
  if (!catalog || typeof catalog !== 'object') return;
  if (!catalog.printing || typeof catalog.printing !== 'object') {
    catalog.printing = {};
  }
  if (!Array.isArray(catalog.printing.printers)) catalog.printing.printers = [];
  if (!Array.isArray(catalog.printing.filaments)) catalog.printing.filaments = [];
  if (!Array.isArray(catalog.printing.pcBuildParts)) catalog.printing.pcBuildParts = [];
  if (!Array.isArray(catalog.printing.otherItems)) catalog.printing.otherItems = [];
  if (!Array.isArray(catalog.printing.otherCustomItems)) catalog.printing.otherCustomItems = [];
  if (!Array.isArray(catalog.printing.usedShopItems)) catalog.printing.usedShopItems = [];
}

function createPartsSeedFromComponents(components) {
  if (!components || typeof components !== 'object') return [];

  const labels = {
    cpu: 'CPU',
    motherboard: 'Základní deska',
    gpu: 'GPU',
    ram: 'RAM',
    storage: 'Úložiště',
    psu: 'Zdroj',
    case: 'Skříň',
    cooling: 'Chlazení'
  };

  return Object.entries(components).flatMap(([category, items]) => {
    if (!Array.isArray(items)) return [];
    return items.slice(0, 6).map((item, index) => {
      const itemId = String(item.id || `${category}-${index}`);
      const itemName = String(item.name || itemId);
      const label = labels[category] || category.toUpperCase();
      const parsedPrice = Number(item.price || 0);
      const safePrice = Number.isFinite(parsedPrice) ? parsedPrice : 0;

      return {
        id: `part-${itemId}`,
        name: `${label}: ${itemName}`,
        price: safePrice,
        active: true
      };
    });
  });
}

function normalizeInventoryPrices(catalog) {
  ensureInventoryArrays(catalog);
  const kinds = ['printers', 'filaments', 'pcBuildParts', 'otherItems', 'otherCustomItems', 'usedShopItems'];
  kinds.forEach((kind) => {
    const list = catalog.printing[kind];
    if (!Array.isArray(list)) return;
    list.forEach((item) => {
      if (!item || typeof item !== 'object') return;
      const parsed = Number(item.price || 0);
      item.price = Number.isFinite(parsed) ? parsed : 0;
    });
  });
}

function createInventoryItem(kind) {
  const stamp = Date.now();
  if (kind === 'printers') {
    return { id: `printer-${stamp}`, name: 'Nová tiskarna', price: 0, active: true };
  }
  if (kind === 'filaments') {
    return { id: `filament-${stamp}`, name: 'Nový filament', price: 0, active: true };
  }
  if (kind === 'pcBuildParts') {
    return { id: `pc-part-${stamp}`, name: 'Nový PC díl', price: 0, active: true };
  }
  if (kind === 'usedShopItems') {
    return { id: `used-${stamp}`, name: 'Nová bazarová polozka', price: 0, active: true };
  }
  if (kind === 'otherCustomItems') {
    return { id: `other-${stamp}`, name: 'Nová položka v Other', price: 0, active: true };
  }
  return { id: `item-${stamp}`, name: 'Nová polozka', price: 0, active: true };
}

function setTextContent(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = String(value);
}

function setInventoryListCollapsed(listId, collapsed) {
  const listEl = document.getElementById(listId);
  const button = document.querySelector(`[data-inv-toggle="${listId}"]`);
  const actions = document.querySelector(`[data-inv-actions="${listId}"]`);
  const block = listEl ? listEl.closest('.inventory-block') : null;
  if (!listEl || !button) return;

  listEl.classList.toggle('hidden', collapsed);
  if (actions) {
    actions.classList.toggle('hidden', collapsed);
  }
  if (block) {
    block.classList.toggle('inventory-block-collapsed', collapsed);
  }
  button.textContent = collapsed ? 'Zobrazit' : 'Skrýt';
  state.inventoryCollapsed[listId] = Boolean(collapsed);
}

function applyInventoryCollapseState() {
  const ids = ['printersList', 'filamentsList', 'pcBuildPartsList', 'otherItemsList', 'otherCustomItemsList', 'usedItemsList'];
  ids.forEach((listId) => {
    setInventoryListCollapsed(listId, Boolean(state.inventoryCollapsed[listId]));
  });
}

function buildInventoryList(listId, list, kind) {
  const query = String(state.inventorySearchQuery || '').trim().toLowerCase();
  const isSectionEditable = state.inventoryEditMode && state.inventoryEditKind === kind;
  const html = list
    .filter((x) => x && (state.inventoryEditMode || x.active !== false))
    .filter((x) => {
      if (!query) return true;
      const name = String(x?.name || x?.id || '').toLowerCase();
      return name.includes(query);
    })
    .map((item, index) => {
      const name = escapeHtml(item.name || item.id || 'Položka');
      const price = Number(item.price || 0);
      const safePrice = Number.isFinite(price) ? price : 0;

      if (!isSectionEditable) {
        const suffix = ` - ${formatMoney(safePrice)}`;
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
  ensureInventoryArrays(sourceCatalog || {});
  const printing = sourceCatalog?.printing || {};
  const printers = Array.isArray(printing.printers) ? printing.printers : [];
  const filaments = Array.isArray(printing.filaments) ? printing.filaments : [];
  const pcBuildParts = Array.isArray(printing.pcBuildParts) ? printing.pcBuildParts : [];
  const otherItems = Array.isArray(printing.otherItems) ? printing.otherItems : [];
  const otherCustomItems = Array.isArray(printing.otherCustomItems) ? printing.otherCustomItems : [];
  const usedItems = Array.isArray(printing.usedShopItems) ? printing.usedShopItems : [];

  const totalCount = printers.length + filaments.length + pcBuildParts.length + otherItems.length + otherCustomItems.length + usedItems.length;
  const activeCount = [printers, filaments, pcBuildParts, otherItems, otherCustomItems, usedItems]
    .flat()
    .filter((item) => item && item.active !== false)
    .length;

  setTextContent('inventoryTotalCount', totalCount);
  setTextContent('inventoryActiveCount', activeCount);
  setTextContent('printersCount', printers.length);
  setTextContent('filamentsCount', filaments.length);
  setTextContent('pcBuildPartsCount', pcBuildParts.length);
  setTextContent('otherItemsCount', otherItems.length);
  setTextContent('otherCustomItemsCount', otherCustomItems.length);
  setTextContent('usedItemsCount', usedItems.length);

  document.querySelectorAll('[data-inv-edit]').forEach((button) => {
    const kind = button.getAttribute('data-inv-edit');
    const isActive = state.inventoryEditMode && state.inventoryEditKind === kind;
    button.classList.toggle('active', isActive);
    button.textContent = 'Upravit';
  });

  if (inventoryEditStatus) {
    const EASY_CATALOG_KIND_LABELS = {
      printers: 'Tiskárny',
      filaments: 'Filamenty',
      pcBuildParts: 'PC díly',
      otherItems: 'Ostatní položky',
      otherCustomItems: 'Další (Other)',
      usedShopItems: 'Bazar'
    };
    if (state.inventoryEditMode && state.inventoryEditKind) {
      const label = EASY_CATALOG_KIND_LABELS[state.inventoryEditKind] || state.inventoryEditKind;
      inventoryEditStatus.textContent = `Upravuješ sekci: ${label}`;
      inventoryEditStatus.classList.remove('hidden');
      inventoryEditStatus.classList.add('active');
    } else {
      inventoryEditStatus.classList.add('hidden');
      inventoryEditStatus.classList.remove('active');
      inventoryEditStatus.textContent = '';
    }
  }

  document.querySelectorAll('[data-inv-add]').forEach((button) => {
    const kind = button.getAttribute('data-inv-add');
    const isActive = state.inventoryEditMode && state.inventoryEditKind === kind;
    button.classList.toggle('secondary', !isActive);
    button.onclick = () => {
      if (!kind) return;
      if (!state.inventoryEditMode || state.inventoryEditKind !== kind) {
        setInventoryEditMode(true, kind);
      }
      if (!state.inventoryDraft) return;
      ensureInventoryArrays(state.inventoryDraft);
      const list = state.inventoryDraft.printing[kind];
      if (!Array.isArray(list)) return;
      list.push(createInventoryItem(kind));
      renderInventory();
    };
  });

  buildInventoryList('printersList', printers, 'printers');
  buildInventoryList('filamentsList', filaments, 'filaments');
  buildInventoryList('pcBuildPartsList', pcBuildParts, 'pcBuildParts');
  buildInventoryList('otherItemsList', otherItems, 'otherItems');
  buildInventoryList('otherCustomItemsList', otherCustomItems, 'otherCustomItems');
  buildInventoryList('usedItemsList', usedItems, 'usedShopItems');
  applyInventoryCollapseState();

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
  }

  document.querySelectorAll('[data-inv-edit]').forEach((button) => {
    button.onclick = () => {
      const kind = button.getAttribute('data-inv-edit');
      if (!kind) return;

      const isSameKind = state.inventoryEditMode && state.inventoryEditKind === kind;
      if (isSameKind) {
        setInventoryEditMode(false);
        return;
      }

      setInventoryEditMode(true, kind);
    };
  });
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
  const [ordersResult, catalogResult, partsResult] = await Promise.all([
    apiFetch('/orders'),
    apiFetch('/catalog'),
    apiFetch('/builds/parts').catch(() => ({ components: {} }))
  ]);

  const nextOrders = Array.isArray(ordersResult.orders) ? ordersResult.orders : [];
  syncKnownOrderIds(nextOrders, notifyOnNew && state.notificationsEnabled);
  state.orders = nextOrders;
  state.catalog = catalogResult.catalog || {};
  ensureInventoryArrays(state.catalog);

  if (!Array.isArray(state.catalog.printing.pcBuildParts) || state.catalog.printing.pcBuildParts.length === 0) {
    const seededParts = createPartsSeedFromComponents(partsResult.components);
    if (seededParts.length > 0) {
      state.catalog.printing.pcBuildParts = seededParts;
    }
  }

  normalizeInventoryPrices(state.catalog);
  state.detailsById.clear();
  await loadDetailsForOrders(state.orders);

  renderOrders();
  renderOrderFullscreen();

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
  if (authStateText) {
    authStateText.textContent = connected ? 'Přihlášen' : 'Odhlášen';
  }
  if (mainLayout) {
    mainLayout.classList.toggle('login-centered', !connected);
  }
  if (appShell) {
    appShell.classList.toggle('sidebar-hidden', !connected);
  }
  refreshBaseTabsVisibility(connected);
  setTopbarButtonsEnabled(connected);
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

  if (tab === 'catalog' && canAccessCatalog()) {
    loadCatalogEditor().catch((error) => {
      const errorEl = document.getElementById('catalogEditorError');
      if (errorEl) errorEl.textContent = error.message || 'Načtení katalogu selhalo';
    });
  }

  if (tab === 'chats' && canAccessChats()) {
    Promise.all([
      loadChatSessions(),
      loadChatAiConfig()
    ]).catch((error) => {
      const errorEl = document.getElementById('chatReplyError');
      if (errorEl) errorEl.textContent = error.message || 'Načtení chat manageru selhalo';
    });
  }
}

function setInventoryEditMode(enabled, kind = null) {
  const wasInEditMode = state.inventoryEditMode;
  state.inventoryEditMode = Boolean(enabled);
  if (state.inventoryEditMode) {
    if (!wasInEditMode || !state.inventoryDraft) {
      state.inventoryDraft = cloneCatalog(state.catalog);
    }
    ensureInventoryArrays(state.inventoryDraft);
    state.inventoryEditKind = kind || state.inventoryEditKind || 'printers';
  } else {
    state.inventoryEditKind = null;
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
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const rememberDevice = document.getElementById('rememberDevice').checked;

    const result = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      headers: { Authorization: '' }
    });

    state.token = result.token;
    state.currentUser = result.user || null;
    localStorage.setItem('ezfixDesktopToken', state.token);
    
    if (rememberDevice) {
      localStorage.setItem('ezfixDesktopRememberedToken', state.token);
      localStorage.setItem('ezfixDesktopRememberedUser', username);
    } else {
      localStorage.removeItem('ezfixDesktopRememberedToken');
      localStorage.removeItem('ezfixDesktopRememberedUser');
    }
    
    state.notificationsEnabled = document.getElementById('notifEnabled').checked;
    setConnectedUi(true);
    refreshOwnerUiVisibility();
    refreshFeatureTabsVisibility();
    refreshOrderOpsVisibility();
    await loadDashboardData({ silent: true });
    await loadUsers();
    startPolling();
    showToast('Připojeno');
  } catch (error) {
    loginError.textContent = error.message || 'Přihlášení selhalo';
  }
}

async function bootstrap() {
  appVersion.textContent = `${window.ezfixDesktop.appName} v${window.ezfixDesktop.appVersion}`;
  state.inventoryCollapsed = getDefaultInventoryCollapsed();

  document.getElementById('notifEnabled').checked = state.notificationsEnabled;
  document.getElementById('notifSound').checked = state.notificationSound;
  document.getElementById('pollInterval').value = String(state.pollIntervalMs);
  renderPrinterSettings();
  renderLabelTemplateEditor();
  setCatalogEditorMode(state.catalogEditorMode);
  state.inventorySearchQuery = localStorage.getItem('ezfixDesktopInventorySearch') || '';
  const inventorySearchInput = document.getElementById('inventorySearchInput');
  if (inventorySearchInput) {
    inventorySearchInput.value = state.inventorySearchQuery;
  }

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
    state.currentUser = null;
    state.users = [];
    state.chatSessions = [];
    state.activeChatSessionId = null;
    state.activeChatMessages = [];
    localStorage.removeItem('ezfixDesktopToken');
    localStorage.removeItem('ezfixDesktopRememberedToken');
    localStorage.removeItem('ezfixDesktopRememberedUser');
    stopPolling();
    refreshOwnerUiVisibility();
    refreshFeatureTabsVisibility();
    refreshOrderOpsVisibility();
    setConnectedUi(false);
  });

  document.getElementById('printBtn').addEventListener('click', () => {
    window.print();
  });

  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  document.querySelectorAll('[data-inv-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      const listId = button.getAttribute('data-inv-toggle');
      if (!listId) return;
      const isCollapsed = Boolean(state.inventoryCollapsed[listId]);
      setInventoryListCollapsed(listId, !isCollapsed);
      localStorage.setItem('ezfixDesktopInventoryCollapsed', JSON.stringify(state.inventoryCollapsed));
    });
  });

  if (inventorySearchInput) {
    inventorySearchInput.addEventListener('input', (event) => {
      state.inventorySearchQuery = String(event.target.value || '');
      localStorage.setItem('ezfixDesktopInventorySearch', state.inventorySearchQuery);
      renderInventory();
    });
  }

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

  document.getElementById('fullPrintPrinter').addEventListener('change', (event) => {
    savePrinterSetting('ezfixDesktopFullPrintPrinter', 'fullPrintPrinter', event.target.value);
  });

  document.getElementById('receiptPrinter').addEventListener('change', (event) => {
    savePrinterSetting('ezfixDesktopReceiptPrinter', 'receiptPrinter', event.target.value);
  });

  document.getElementById('labelPrinter').addEventListener('change', (event) => {
    savePrinterSetting('ezfixDesktopLabelPrinter', 'labelPrinter', event.target.value);
  });

  [
    'labelHeaderInput',
    'labelFooterInput',
    'labelWidthMmInput',
    'labelHeightMmInput',
    'labelFontSizeInput',
    'labelShowPhoneInput',
    'labelShowDateInput'
  ].forEach((id) => {
    const input = document.getElementById(id);
    if (!input) return;
    const eventName = input.type === 'checkbox' ? 'change' : 'input';
    input.addEventListener(eventName, updateLabelTemplateFromForm);
  });

  document.getElementById('reloadPrintersBtn').addEventListener('click', async () => {
    await loadPrinterOptions(true);
  });

  document.getElementById('createUserForm').addEventListener('submit', createUserFromForm);
  document.getElementById('createManualOrderForm').addEventListener('submit', createManualOrderFromForm);
  document.getElementById('createInvoiceForm').addEventListener('submit', createInvoiceFromForm);
  if (toggleManualOrderFormBtn) {
    toggleManualOrderFormBtn.addEventListener('click', () => {
      const isOpen = manualOrderOpsBlock && !manualOrderOpsBlock.classList.contains('hidden');
      setOrderOpsFormPanel(isOpen ? null : 'manual');
    });
  }
  if (toggleInvoiceFormBtn) {
    toggleInvoiceFormBtn.addEventListener('click', () => {
      const isOpen = invoiceOpsBlock && !invoiceOpsBlock.classList.contains('hidden');
      setOrderOpsFormPanel(isOpen ? null : 'invoice');
    });
  }
  setOrderOpsFormPanel(null);
  document.getElementById('catalogReloadBtn').addEventListener('click', async () => {
    try {
      await loadCatalogEditor();
      showToast('Katalog byl načten');
    } catch (error) {
      const errorEl = document.getElementById('catalogEditorError');
      if (errorEl) errorEl.textContent = error.message || 'Načtení katalogu selhalo';
    }
  });
  document.getElementById('catalogSaveBtn').addEventListener('click', async () => {
    try {
      await saveCatalogEditor();
    } catch (error) {
      const errorEl = document.getElementById('catalogEditorError');
      if (errorEl) errorEl.textContent = error.message || 'Uložení katalogu selhalo';
    }
  });
  document.getElementById('catalogAdvancedBtn').addEventListener('click', () => {
    setCatalogEditorMode('advanced');
  });
  document.getElementById('catalogEasyBtn').addEventListener('click', () => {
    setCatalogEditorMode('easy');
    renderEasyCatalogEditor();
  });
  document.getElementById('easyCatalogKind').addEventListener('change', () => {
    renderEasyCatalogEditor();
  });
  document.getElementById('easyCatalogToggleListBtn').addEventListener('click', () => {
    state.easyCatalogListVisible = !state.easyCatalogListVisible;
    renderEasyCatalogEditor();
  });
  document.getElementById('easyCatalogAddBtn').addEventListener('click', () => {
    addEasyCatalogItem();
  });
    document.getElementById('easyCatalogAddCategoryBtn').addEventListener('click', () => {
      addEasyCatalogCategory();
    });
  document.getElementById('easyCatalogSaveBtn').addEventListener('click', async () => {
    await saveEasyCatalogEditor();
  });
  document.getElementById('easyCatalogCancelBtn').addEventListener('click', () => {
    state.easyCatalogEditIndex = null;
    const nameInput = document.getElementById('easyCatalogName');
    const priceInput = document.getElementById('easyCatalogPrice');
    const activeInput = document.getElementById('easyCatalogActive');
    if (nameInput) nameInput.value = '';
    if (priceInput) priceInput.value = '0';
    if (activeInput) activeInput.checked = true;
    renderEasyCatalogEditor();
    showToast('Editace byla zrušena');
  });
  document.getElementById('chatsRefreshBtn').addEventListener('click', async () => {
    try {
      await loadChatSessions();
      showToast('Chaty byly obnoveny');
    } catch (error) {
      const errorEl = document.getElementById('chatReplyError');
      if (errorEl) errorEl.textContent = error.message || 'Načtení chatů selhalo';
    }
  });
  document.getElementById('chatReplyForm').addEventListener('submit', async (event) => {
    try {
      await sendChatReplyFromForm(event);
    } catch (error) {
      const errorEl = document.getElementById('chatReplyError');
      if (errorEl) errorEl.textContent = error.message || 'Odeslání odpovědi selhalo';
    }
  });
  document.getElementById('chatTakeBtn').addEventListener('click', async () => {
    try {
      await chatAction('take');
    } catch (error) {
      const errorEl = document.getElementById('chatReplyError');
      if (errorEl) errorEl.textContent = error.message || 'Převzetí chatu selhalo';
    }
  });
  document.getElementById('chatTakeOverlayBtn').addEventListener('click', async () => {
    try {
      await chatAction('take');
    } catch (error) {
      const errorEl = document.getElementById('chatReplyError');
      if (errorEl) errorEl.textContent = error.message || 'Převzetí chatu selhalo';
    }
  });
  document.getElementById('chatCloseBtn').addEventListener('click', async () => {
    try {
      await chatAction('close');
    } catch (error) {
      const errorEl = document.getElementById('chatReplyError');
      if (errorEl) errorEl.textContent = error.message || 'Uzavření chatu selhalo';
    }
  });
  document.getElementById('chatDeleteBtn').addEventListener('click', async () => {
    try {
      await chatAction('delete');
    } catch (error) {
      const errorEl = document.getElementById('chatReplyError');
      if (errorEl) errorEl.textContent = error.message || 'Smazání chatu selhalo';
    }
  });
  document.getElementById('chatAiToggleBtn').addEventListener('click', () => {
    const block = document.querySelector('.chat-ai-block');
    if (!block) return;
    state.chatAiCollapsed = !state.chatAiCollapsed;
    block.classList.toggle('chat-ai-collapsed', state.chatAiCollapsed);
    const btn = document.getElementById('chatAiToggleBtn');
    if (btn) btn.textContent = state.chatAiCollapsed ? 'Rozbalít' : 'Minimalizovat';
  });
  document.getElementById('chatAiReloadBtn').addEventListener('click', async () => {
    try {
      await loadChatAiConfig();
      showToast('AI konfigurace byla načtena');
    } catch (error) {
      const errorEl = document.getElementById('chatAiConfigError');
      if (errorEl) errorEl.textContent = error.message || 'Načtení AI config selhalo';
    }
  });
  document.getElementById('chatAiSaveBtn').addEventListener('click', async () => {
    try {
      await saveChatAiConfig();
    } catch (error) {
      const errorEl = document.getElementById('chatAiConfigError');
      if (errorEl) errorEl.textContent = error.message || 'Uložení AI config selhalo';
    }
  });
  const chatAiBlock = document.querySelector('.chat-ai-block');
  if (chatAiBlock) {
    chatAiBlock.classList.toggle('chat-ai-collapsed', state.chatAiCollapsed);
  }
  const chatAiToggleBtn = document.getElementById('chatAiToggleBtn');
  if (chatAiToggleBtn) {
    chatAiToggleBtn.textContent = state.chatAiCollapsed ? 'Rozbalít' : 'Minimalizovat';
  }
  document.getElementById('editUserForm').addEventListener('submit', updateUserFromForm);
  document.getElementById('closeEditUserModalBtn').addEventListener('click', closeEditUserModal);
  document.getElementById('cancelEditUserBtn').addEventListener('click', closeEditUserModal);
  document.getElementById('closeOrderFullscreenBtn').addEventListener('click', closeOrderFullscreen);
  document.getElementById('closeManualOrderModalBtn').addEventListener('click', closeOrderOpsModals);
  document.getElementById('closeInvoiceModalBtn').addEventListener('click', closeOrderOpsModals);
  orderFullscreenModal.addEventListener('click', (event) => {
    if (event.target === orderFullscreenModal) {
      closeOrderFullscreen();
    }
  });
  if (manualOrderOpsBlock) {
    manualOrderOpsBlock.addEventListener('click', (event) => {
      if (event.target === manualOrderOpsBlock) {
        closeOrderOpsModals();
      }
    });
  }
  if (invoiceOpsBlock) {
    invoiceOpsBlock.addEventListener('click', (event) => {
      if (event.target === invoiceOpsBlock) {
        closeOrderOpsModals();
      }
    });
  }
  if (editUserModal) {
    editUserModal.addEventListener('click', (event) => {
      if (event.target === editUserModal) {
        closeEditUserModal();
      }
    });
  }
  document.addEventListener('keydown', handleGlobalEscape);
  document.getElementById('usersRefreshBtn').addEventListener('click', async () => {
    if (!state.token) return;
    try {
      await loadUsers();
      showToast('Uživatelé byli obnoveni');
    } catch (error) {
      alert(error.message || 'Načtení uživatelů selhalo');
    }
  });

  switchTab('orders');
  refreshOwnerUiVisibility();
  refreshFeatureTabsVisibility();
  refreshOrderOpsVisibility();
  renderUsers();
  await loadPrinterOptions();
  syncChatTakeOverlay();

  if (state.token) {
    try {
      const meResult = await apiFetch('/auth/me');
      state.currentUser = meResult.user || null;
      setConnectedUi(true);
      refreshOwnerUiVisibility();
      refreshFeatureTabsVisibility();
      refreshOrderOpsVisibility();
      await loadDashboardData({ silent: true });
      await loadUsers();
      startPolling();
      showToast('Relace obnovena');
      return;
    } catch {
      state.token = '';
      localStorage.removeItem('ezfixDesktopToken');
    }
  }

  // Zkusit načíst pamatovaný token
  const rememberedToken = localStorage.getItem('ezfixDesktopRememberedToken');
  const rememberedUser = localStorage.getItem('ezfixDesktopRememberedUser');
  if (rememberedToken && rememberedUser) {
    state.token = rememberedToken;
    try {
      const meResult = await apiFetch('/auth/me');
      state.currentUser = meResult.user || null;
      localStorage.setItem('ezfixDesktopToken', state.token);
      setConnectedUi(true);
      refreshOwnerUiVisibility();
      refreshFeatureTabsVisibility();
      refreshOrderOpsVisibility();
      await loadDashboardData({ silent: true });
      await loadUsers();
      startPolling();
      showToast('Automatické přihlášení úspěšné');
      return;
    } catch {
      state.token = '';
      localStorage.removeItem('ezfixDesktopRememberedToken');
      localStorage.removeItem('ezfixDesktopRememberedUser');
    }
  }

  refreshFeatureTabsVisibility();
  setConnectedUi(false);
}

bootstrap();
