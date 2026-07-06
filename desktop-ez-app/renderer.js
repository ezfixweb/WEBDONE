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

function loadInventoryMovementsFromStorage() {
  try {
    const raw = localStorage.getItem('ezfixDesktopInventoryMovements');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item === 'object')
      .slice(0, 250);
  } catch {
    return [];
  }
}

function persistInventoryMovements() {
  localStorage.setItem('ezfixDesktopInventoryMovements', JSON.stringify(state.inventoryMovements || []));
}

function getDefaultInventoryDeviceLabel() {
  const base = String(window?.ezfixDesktop?.appName || 'Desktop').trim() || 'Desktop';
  const suffix = (typeof navigator !== 'undefined' && navigator.platform)
    ? String(navigator.platform).split(' ')[0]
    : 'Client';
  return `${base}-${suffix}`.replace(/\s+/g, '-');
}

function getInventoryDeviceLabel() {
  return String(state.inventoryDeviceLabel || '').trim() || getDefaultInventoryDeviceLabel();
}

const state = {
  apiBase: 'https://api.ezfix.cz/api',
  token: localStorage.getItem('ezfixDesktopToken') || '',
  orders: [],
  invoices: [],
  invoiceNumbersByOrderId: new Map(),
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
  sidebarCollapsed: localStorage.getItem('ezfixDesktopSidebarCollapsed') === 'true',
  pollTimer: null,
  availablePrinters: [],
  fullPrintPrinter: localStorage.getItem('ezfixDesktopFullPrintPrinter') || '',
  receiptPrinter: localStorage.getItem('ezfixDesktopReceiptPrinter') || '',
  labelPrinter: localStorage.getItem('ezfixDesktopLabelPrinter') || '',
  inventoryCollapsed: getDefaultInventoryCollapsed(),
  inventoryEditKind: null,
  catalogEditorMode: 'easy',
  easyCatalogListVisible: false,
  inventorySearchQuery: '',
  inventoryStockFilter: localStorage.getItem('ezfixDesktopInventoryStockFilter') || 'all',
  inventoryCompactMode: localStorage.getItem('ezfixDesktopInventoryCompactMode') === 'true',
  inventoryLastScanCode: '',
  inventoryDeviceLabel: localStorage.getItem('ezfixDesktopInventoryDeviceLabel') || getDefaultInventoryDeviceLabel(),
  inventoryMovements: loadInventoryMovementsFromStorage(),
  inventoryMovementsSynced: false,
  easyCatalogEditIndex: null,
  customEasyCatalogCategories: new Map(),
  easyCatalogShowAddCategoryForm: false,
  easyCatalogNewCategoryName: ''
};

// Simple i18n for desktop app (cs/en)
const I18N = {
  cs: {
    emailModalTitle: 'Odeslat e-mail zákazníkovi',
    close: 'Zavřít',
    cancel: 'Zrušit',
    send: 'Odeslat e-mail',
    sending: 'Odesílám...',
    defaultSubject: (orderId) => `Aktualizace objednávky ${orderId}`,
    defaultMessage: (name, orderId) => `Dobrý den ${name || ''},\n\nposíláme informaci k vaší objednávce ${orderId}.\n\nS pozdravem,\nEzFix tým`,
    missingData: 'Chybějící údaje pro odeslání e-mailu.',
    emailSent: (email) => `E-mail úspěšně odeslán na ${email}`,
    sendError: (msg) => `Chyba při odeslání: ${msg}`
  },
  en: {
    emailModalTitle: 'Send Email to Customer',
    close: 'Close',
    cancel: 'Cancel',
    send: 'Send Email',
    sending: 'Sending...',
    defaultSubject: (orderId) => `Order update ${orderId}`,
    defaultMessage: (name, orderId) => `Hi ${name || ''},\n\nwe are sending an update regarding your order ${orderId}.\n\nBest regards,\nEzFix Team`
  }
};

function getLocale() {
  const stored = localStorage.getItem('ezfixDesktopLang');
  if (stored && (stored === 'cs' || stored === 'en')) return stored;
  const nav = (typeof navigator !== 'undefined' && navigator.language) ? navigator.language : 'cs';
  return nav.startsWith('en') ? 'en' : 'cs';
}

function t(key, ...args) {
  const loc = getLocale();
  const dict = I18N[loc] || I18N.cs;
  const val = dict[key];
  if (typeof val === 'function') return val(...args);
  return val || '';
}

// Apply translations to static modal elements on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const titleEl = document.querySelector('#emailModal h3');
  if (titleEl) titleEl.textContent = t('emailModalTitle');
  const closeBtn = document.getElementById('closeEmailModalBtn');
  if (closeBtn) closeBtn.textContent = t('close');
  const cancelBtn = document.getElementById('emailCancelBtn');
  if (cancelBtn) cancelBtn.textContent = t('cancel');
  const submitBtn = document.querySelector('#emailForm button[type="submit"]');
  if (submitBtn) submitBtn.textContent = t('send');
});

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
const settingsModal = document.getElementById('settingsModal');
const toggleManualOrderFormBtn = document.getElementById('toggleManualOrderFormBtn');
const toggleInvoiceFormBtn = document.getElementById('toggleInvoiceFormBtn');
const openSettingsBtn = document.getElementById('openSettingsBtn');
const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
const orderFullscreenModal = document.getElementById('orderFullscreenModal');
const orderFullscreenContent = document.getElementById('orderFullscreenContent');
const statusChangePopup = document.getElementById('statusChangePopup');
const editUserModal = document.getElementById('editUserModal');
const mainLayout = document.querySelector('.main');
const appShell = document.querySelector('.app-shell');
const authStateText = document.getElementById('authStateText');
const topActionButtonIds = ['sidebarToggleBtn', 'refreshBtn', 'exportCsvBtn', 'exportExcelBtn', 'printBtn', 'openSettingsBtn', 'logoutBtn'];

const ORDER_STATUSES = ['pending', 'waiting', 'in-progress', 'delivering', 'completed', 'delivered', 'cancelled'];
const EASY_CATALOG_KIND_LABELS = {
  printers: 'Tiskárny',
  filaments: 'Filamenty',
  pcBuildParts: 'PC díly',
  otherItems: 'Ostatní položky',
  otherCustomItems: 'Další (Other)',
  usedShopItems: 'Bazar'
};

const INVENTORY_SECTION_CONFIG = [
  { kind: 'printers', listId: 'printersList', label: 'Tiskárny' },
  { kind: 'filaments', listId: 'filamentsList', label: 'Filamenty' },
  { kind: 'pcBuildParts', listId: 'pcBuildPartsList', label: 'PC díly' },
  { kind: 'otherItems', listId: 'otherItemsList', label: 'Ostatní položky' },
  { kind: 'otherCustomItems', listId: 'otherCustomItemsList', label: 'Další (Other)' },
  { kind: 'usedShopItems', listId: 'usedItemsList', label: 'Bazar' }
];

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

const USER_PERMISSION_OPTIONS = [
  { key: 'orders', label: 'Objednávky' },
  { key: 'catalog', label: 'Katalog / sklad' },
  { key: 'chats', label: 'Chat' },
  { key: 'credentials', label: 'Správa účtů' }
];

function getDefaultPermissionsForRole(role) {
  const normalized = String(role || '').toLowerCase();
  if (normalized === 'owner') return USER_PERMISSION_OPTIONS.map((item) => item.key);
  if (normalized === 'manager') return ['orders', 'catalog', 'chats'];
  if (normalized === 'worker') return ['orders', 'chats'];
  return [];
}

function normalizePermissionSelection(role, permissions = []) {
  const normalizedRole = String(role || '').toLowerCase();
  const allowed = new Set(getDefaultPermissionsForRole(normalizedRole));
  const source = Array.isArray(permissions) ? permissions : [];
  const selection = source
    .map((item) => String(item || '').trim().toLowerCase())
    .filter((item) => allowed.has(item));

  if (normalizedRole === 'owner') {
    return USER_PERMISSION_OPTIONS.map((item) => item.key);
  }

  return Array.from(new Set(selection));
}

function formatPermissionLabel(permission) {
  const found = USER_PERMISSION_OPTIONS.find((item) => item.key === String(permission || '').toLowerCase());
  return found ? found.label : String(permission || '');
}

function formatAccessSummary(user) {
  const permissions = normalizePermissionSelection(user.role, user.permissions || []);
  const labels = permissions.map((permission) => formatPermissionLabel(permission)).filter(Boolean);
  if (user.mobile_app_access !== false) {
    labels.push('Mobil');
  }
  return labels.length > 0 ? labels.join(', ') : 'Bez přístupu';
}

function getPermissionSelection(prefix) {
  return USER_PERMISSION_OPTIONS
    .map((item) => item.key)
    .filter((permission) => {
      const input = document.getElementById(`${prefix}Permission${permission[0].toUpperCase()}${permission.slice(1)}`);
      return Boolean(input?.checked);
    });
}

function applyPermissionSelection(prefix, permissions = [], role = 'manager') {
  const selection = normalizePermissionSelection(role, permissions);
  USER_PERMISSION_OPTIONS.forEach((item) => {
    const input = document.getElementById(`${prefix}Permission${item.key[0].toUpperCase()}${item.key.slice(1)}`);
    if (!input) return;
    if (item.key === 'credentials' && String(role || '').toLowerCase() !== 'owner') {
      input.checked = false;
      input.disabled = true;
      return;
    }
    input.disabled = false;
    input.checked = selection.includes(item.key);
  });
}

function applyMobileAppAccess(prefix, role = 'manager', value = null) {
  const input = document.getElementById(`${prefix}MobileAppAccess`);
  if (!input) return;
  input.disabled = false;
  input.checked = value === null ? String(role || '').toLowerCase() !== 'customer' : Boolean(value);
}

function syncUserAccessControls(prefix, role = 'manager', permissions = [], mobileAppAccess = null) {
  applyPermissionSelection(prefix, permissions, role);
  applyMobileAppAccess(prefix, role, mobileAppAccess);
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

function applySidebarVisibility(connected = Boolean(state.token)) {
  const shouldHideSidebar = !connected || state.sidebarCollapsed;
  if (appShell) {
    appShell.classList.toggle('sidebar-hidden', shouldHideSidebar);
  }
  if (sidebarToggleBtn) {
    const actionLabel = state.sidebarCollapsed ? 'Rozbalit menu' : 'Sbalit menu';
    sidebarToggleBtn.textContent = '☰';
    sidebarToggleBtn.setAttribute('aria-label', actionLabel);
    sidebarToggleBtn.setAttribute('title', 'Menu');
    sidebarToggleBtn.setAttribute('aria-pressed', String(state.sidebarCollapsed));
  }
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

function openSettingsModal() {
  if (!settingsModal) return;
  settingsModal.classList.remove('hidden');
}

function closeSettingsModal() {
  if (!settingsModal) return;
  settingsModal.classList.add('hidden');
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
  if (settingsModal && !settingsModal.classList.contains('hidden')) {
    closeSettingsModal();
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
      <button type="button" class="secondary" data-order-action="details-print" data-order-id="${orderId}">Tisk detailů</button>
      <button type="button" class="secondary" data-order-action="invoice-print" data-order-id="${orderId}">Tisk faktury</button>
      <button type="button" class="secondary" data-order-action="invoice-save" data-order-id="${orderId}">Uložit fakturu</button>
      <button type="button" class="secondary" data-order-action="receipt-print" data-order-id="${orderId}">Tisk účtenky</button>
      <button type="button" class="ghost-btn" data-order-action="label-print" data-order-id="${orderId}">Tisk štítku</button>
      <button type="button" class="secondary" data-order-action="email" data-order-id="${orderId}">Odeslat e-mail</button>
      ${deleteButton}
    </div>
  `;
}

/* Email modal functions for desktop app */
function showEmailModal() {
  const modal = document.getElementById('emailModal');
  if (modal) {
    modal.classList.remove('hidden');
  }
}

function closeEmailModal() {
  const modal = document.getElementById('emailModal');
  if (modal) {
    modal.classList.add('hidden');
  }
  const form = document.getElementById('emailForm');
  if (form) form.reset();
  window.currentEmailOrderId = null;
  window.currentCustomerEmail = null;
}

async function emailCustomer(orderId, customerEmail, customerName) {
  try {
    // Ensure we have freshest data
    await ensureOrderData(orderId);
  } catch (err) {
    console.warn('Unable to ensure order data before email:', err);
  }

  window.currentEmailOrderId = orderId;
  window.currentCustomerEmail = customerEmail || '';

  const subjectInput = document.getElementById('emailSubject');
  const messageInput = document.getElementById('emailMessage');
  const toInput = document.getElementById('emailTo');
  const nameInput = document.getElementById('emailCustomerName');

  if (toInput) toInput.value = customerEmail || '';
  if (nameInput) nameInput.value = customerName || '';
  if (subjectInput) subjectInput.value = t('defaultSubject', orderId);
  if (messageInput) messageInput.value = t('defaultMessage', customerName, orderId);

  const messageDiv = document.getElementById('emailFormMessage');
  if (messageDiv) messageDiv.textContent = '';

  showEmailModal();
}

document.addEventListener('click', (e) => {
  if (e.target && e.target.id === 'closeEmailModalBtn') closeEmailModal();
  if (e.target && e.target.id === 'emailCancelBtn') closeEmailModal();
});

document.getElementById('emailForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const orderId = window.currentEmailOrderId;
  const customerEmail = window.currentCustomerEmail || document.getElementById('emailTo')?.value;
  const subject = document.getElementById('emailSubject')?.value || '';
  const message = document.getElementById('emailMessage')?.value || '';
  const messageDiv = document.getElementById('emailFormMessage');
  try {
    if (!orderId || !customerEmail) {
      if (messageDiv) { messageDiv.textContent = t('missingData'); messageDiv.className = 'form-message error'; }
      return;
    }
    if (messageDiv) { messageDiv.textContent = ''; messageDiv.className = 'form-message'; }
    await apiFetch('/email/send-custom', {
      method: 'POST',
      body: JSON.stringify({ orderId, customerEmail, subject, message })
    });
    if (messageDiv) { messageDiv.textContent = t('emailSent', customerEmail); messageDiv.className = 'form-message success'; }
    setTimeout(() => {
      closeEmailModal();
      renderOrders();
    }, 1200);
  } catch (err) {
    if (messageDiv) { messageDiv.textContent = t('sendError', err.message || String(err)); messageDiv.className = 'form-message error'; }
  }
});

function buildInvoiceDocumentHtml(order, items) {
  const issueDate = order.created_at ? new Date(order.created_at) : new Date();
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + 14);

  const normalizedItems = Array.isArray(items)
    ? items.map((item) => {
        const quantityRaw = Number(item.parts || item.quantity || 1);
        const quantity = Number.isFinite(quantityRaw) && quantityRaw > 0 ? Math.floor(quantityRaw) : 1;
        const unitPriceRaw = Number(item.price || item.unitPrice || 0);
        const unitPrice = Number.isFinite(unitPriceRaw) ? unitPriceRaw : 0;
        const description = item.repair_name || item.repair_type || [item.device, item.brand, item.model].filter(Boolean).join(' ') || 'Položka';
        return {
          description,
          quantity,
          unitPrice,
          total: quantity * unitPrice
        };
      })
    : [];

  const total = normalizedItems.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const rowsHtml = normalizedItems.map((item, index) => `
      <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(item.description || '')}</td>
          <td>${escapeHtml(String(item.quantity || 1))}</td>
          <td>${formatInvoiceAmount(item.unitPrice || 0)}</td>
          <td style="text-align:right;">${formatInvoiceAmount(item.total || 0)}</td>
      </tr>
  `).join('');

  const invoiceNumber = `INV-${escapeHtml(order.order_number || order.id || '')}`;
  const variableSymbol = String(order.order_number || order.id || '').replace(/\D/g, '').slice(-10);
  const customerAddress = [order.customer_address, order.customer_city, order.customer_zip, order.country]
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(', ');

  return `
      <!DOCTYPE html>
      <html lang="cs">
      <head>
          <meta charset="UTF-8">
          <title>Faktura ${invoiceNumber}</title>
          <style>
              body { font-family: Arial, sans-serif; margin: 22px; color: #111827; }
              .top { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 24px; }
              .box { flex: 1; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px; }
              h1 { margin: 0 0 10px; font-size: 1.6rem; }
              h3 { margin: 0 0 10px; font-size: 1rem; }
              p { margin: 3px 0; }
              table { width: 100%; border-collapse: collapse; margin-top: 18px; }
              th, td { border-bottom: 1px solid #e5e7eb; padding: 10px 8px; text-align: left; font-size: 0.95rem; }
              th { background: #f3f4f6; }
              .right { text-align: right; }
              .summary { margin-top: 16px; display: flex; justify-content: flex-end; }
              .summary-box { min-width: 240px; border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px; }
              .summary-row { display: flex; justify-content: space-between; margin: 6px 0; }
              .total { font-weight: 700; font-size: 1.08rem; }
              .notes { margin-top: 18px; white-space: pre-wrap; }
              @media print { body { margin: 0; } }
          </style>
      </head>
      <body>
          <h1>Faktura</h1>
          <div class="top">
              <div class="box">
                  <h3>Dodavatel</h3>
                  <p><strong>EzFix</strong></p>
                  <p>Web: ezfix.cz</p>
                  <p>E-mail: ezfix.podpora@gmail.com</p>
                  <p>Telefon: +420 732 434 201</p>
              </div>
              <div class="box">
                  <h3>Odběratel</h3>
                  <p><strong>${escapeHtml(order.customer_name || '')}</strong></p>
                  <p>${escapeHtml(order.customer_email || '')}</p>
                  <p>${escapeHtml(order.customer_phone || '')}</p>
                  <p>${escapeHtml(customerAddress || '')}</p>
              </div>
          </div>

          <div class="top" style="margin-bottom: 8px;">
              <div class="box">
                  <p><strong>Číslo faktury:</strong> ${invoiceNumber}</p>
                  <p><strong>Datum vystavení:</strong> ${formatInvoiceDate(issueDate)}</p>
                  <p><strong>Datum splatnosti:</strong> ${formatInvoiceDate(dueDate)}</p>
              </div>
              <div class="box">
                  <p><strong>Variabilní symbol:</strong> ${escapeHtml(variableSymbol || '')}</p>
                  <p><strong>Objednávka:</strong> ${escapeHtml(order.order_number || 'Vlastní faktura')}</p>
              </div>
          </div>

          <table>
              <thead>
                  <tr>
                      <th>#</th>
                      <th>Položka</th>
                      <th>Množství</th>
                      <th>Cena/ks</th>
                      <th class="right">Celkem</th>
                  </tr>
              </thead>
              <tbody>
                  ${rowsHtml || '<tr><td colspan="5">Bez položek</td></tr>'}
              </tbody>
          </table>

          <div class="summary">
              <div class="summary-box">
                  <div class="summary-row total"><span>Celkem k úhradě</span><span>${formatInvoiceAmount(total)}</span></div>
              </div>
          </div>

          ${order.notes ? `<div class="notes"><strong>Poznámka:</strong>\n${escapeHtml(order.notes)}</div>` : ''}
      </body>
      </html>
  `;
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
  const { order, details, items } = await ensureOrderData(orderId);
  await printHtmlDocument({
    title: `Faktura ${order.order_number || order.id}`,
    html: buildInvoiceDocumentHtml({ ...order, ...details }, items),
    printerName: state.fullPrintPrinter
  });
  showToast('Faktura byla odeslána na tisk');
}

async function saveOrderInvoicePdf(orderId) {
  const { order, details, items } = await ensureOrderData(orderId);
  await savePdfDocument({
    title: `Faktura ${order.order_number || order.id}`,
    html: buildInvoiceDocumentHtml({ ...order, ...details }, items),
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

function buildOrderDetailsDocumentHtml(order, items) {
  const rowsHtml = (Array.isArray(items) ? items : []).map((item) => {
    const customDetails = getCustomBuildDetails(item);
    const printingDetails = getPrintingDetails(item);
    const otherDetails = getOtherItemDetails(item);
    const detailLine = customDetails
      ? `Typ sestavy: ${escapeHtml(customDetails.buildType)}${customDetails.partsSummary ? ' | Díly: ' + escapeHtml(customDetails.partsSummary) : ''}`
      : printingDetails
        ? `Tiskárna: ${escapeHtml(printingDetails.printer || 'N/A')} | Filament: ${escapeHtml(printingDetails.filament || 'N/A')} | Barva: ${escapeHtml(printingDetails.color || 'N/A')} | Pevnost: ${escapeHtml(printingDetails.strength || 'N/A')} | Kusy: ${escapeHtml(String(printingDetails.parts || 1))}${printingDetails.fileName ? ' | Soubor: ' + escapeHtml(printingDetails.fileName) : ''}`
        : otherDetails
          ? `Položka: ${escapeHtml(otherDetails.name || 'Jiná položka')}${otherDetails.desc ? ' | Detaily: ' + escapeHtml(otherDetails.desc) : ''}`
          : `${escapeHtml(item.brand || '')} ${escapeHtml(item.model || '')}`;

    return `<tr><td>${escapeHtml(item.repair_name || item.repair_type || 'Oprava')}</td><td>${detailLine}</td><td style="text-align:right;">${formatMoney(item.price || 0)}</td></tr>`;
  }).join('');

  const safeAddress = escapeHtml(order.customer_address || 'N/A');
  const safeCity = escapeHtml(order.customer_city || '');
  const safeZip = escapeHtml(order.customer_zip || '');
  const safeCountry = escapeHtml(order.country || 'Czech Republic');
  const notes = escapeHtml(order.notes || '');

  return `
    <!DOCTYPE html>
    <html lang="cs">
    <head>
      <meta charset="UTF-8" />
      <title>Objednávka ${escapeHtml(order.order_number || '')}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { margin: 0; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
        .info-section h3 { margin: 0 0 10px 0; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
        .info-line { margin: 5px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f5f5f5; font-weight: bold; }
        .total { margin-top: 20px; text-align: right; font-weight: bold; }
        @media print { body { margin: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Detaily objednávky</h1>
        <p>Objednávka #${escapeHtml(order.order_number || '')}</p>
      </div>

      <div class="info-grid">
        <div class="info-section">
          <h3>Informace o zákazníkovi</h3>
          <div class="info-line"><strong>Jméno:</strong> ${escapeHtml(order.customer_name || '')}</div>
          <div class="info-line"><strong>E-mail:</strong> ${escapeHtml(order.customer_email || '')}</div>
          <div class="info-line"><strong>Telefon:</strong> ${escapeHtml(order.customer_phone || '')}</div>
          <div class="info-line"><strong>Adresa:</strong> ${safeAddress}</div>
          ${safeCity ? `<div class="info-line"><strong>Město:</strong> ${safeCity}</div>` : ''}
          ${safeZip ? `<div class="info-line"><strong>PSČ:</strong> ${safeZip}</div>` : ''}
          <div class="info-line"><strong>Země:</strong> ${safeCountry}</div>
        </div>
        <div class="info-section">
          <h3>Informace o objednávce</h3>
          <div class="info-line"><strong>Datum:</strong> ${order.created_at ? new Date(order.created_at).toLocaleString('cs-CZ') : ''}</div>
          <div class="info-line"><strong>Typ služby:</strong> ${escapeHtml(formatServiceTypeLabel(order.service_type || ''))}</div>
          <div class="info-line"><strong>Stav:</strong> ${escapeHtml(statusLabel(order.status || ''))}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr><th>Oprava</th><th>Zařízení</th><th>Cena</th></tr>
        </thead>
        <tbody>
          ${rowsHtml || '<tr><td colspan="3">Bez položek</td></tr>'}
        </tbody>
      </table>

      ${notes ? `<div><strong>Poznámky:</strong><p>${notes}</p></div>` : ''}

      <div class="total">Celkem: ${formatMoney(order.total || 0)}</div>
    </body>
    </html>
  `;
}

async function printOrderDetailsDocument(orderId) {
  const { order, details, items } = await ensureOrderData(orderId);
  await printHtmlDocument({
    title: `Objednávka ${order.order_number || order.id}`,
    html: buildOrderDetailsDocumentHtml({ ...order, ...details }, items),
    printerName: state.fullPrintPrinter
  });
  showToast('Detaily objednávky byly odeslány na tisk');
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
        if (action === 'details-print') await printOrderDetailsDocument(orderId);
        if (action === 'invoice-print') await printOrderInvoice(orderId);
        if (action === 'invoice-save') await saveOrderInvoicePdf(orderId);
        if (action === 'receipt-print') await printOrderReceipt(orderId);
        if (action === 'label-print') await printOrderLabel(orderId);
        if (action === 'email') {
          const order = getOrderById(orderId);
          const email = order?.customer_email || '';
          const name = order?.customer_name || '';
          await emailCustomer(orderId, email, name);
        }
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

  const saveBtn = document.getElementById('easyCatalogSaveBtn');
  if (saveBtn) {
    saveBtn.classList.toggle('active', state.easyCatalogEditIndex !== null);
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

function getOpenUnassignedChatCount() {
  if (!Array.isArray(state.chatSessions)) return 0;
  return state.chatSessions.filter((session) => {
    const assigned = String(session.assigned_admin_name || '').trim();
    const status = String(session.status || '').toLowerCase();
    return !assigned && status === 'open';
  }).length;
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
  const countBadge = document.getElementById('chatOpenCountBadge');
  if (countBadge) {
    const count = getOpenUnassignedChatCount();
    countBadge.textContent = count > 99 ? '99+' : String(count);
  }
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
    usersTableBody.innerHTML = '<tr><td colspan="8">Nemáte oprávnění k zobrazení uživatelů.</td></tr>';
    return;
  }

  if (!Array.isArray(state.users) || state.users.length === 0) {
    usersTableBody.innerHTML = '<tr><td colspan="8">Žádní uživatelé.</td></tr>';
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
        <td>${escapeHtml(user.first_name || '-')}</td>
        <td>${escapeHtml(user.last_name || '-')}</td>
        <td>${escapeHtml(user.email || '-')}</td>
        <td>${escapeHtml(formatRoleLabel(user.role))}</td>
        <td>${escapeHtml(formatAccessSummary(user))}</td>
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
    const first_name = document.getElementById('newUserFirstName').value.trim();
    const last_name = document.getElementById('newUserLastName').value.trim();
    const email = document.getElementById('newUserEmail').value.trim();
    const password = document.getElementById('newUserPassword').value;
    const role = document.getElementById('newUserRole').value;
    const permissions = getPermissionSelection('newUser');
    const mobile_app_access = Boolean(document.getElementById('newUserMobileAppAccess').checked);

    await apiFetch('/admin/users', {
      method: 'POST',
      body: JSON.stringify({ username, first_name, last_name, email, password, role, permissions, mobile_app_access })
    });

    document.getElementById('createUserForm').reset();
    document.getElementById('newUserRole').value = 'manager';
    syncUserAccessControls('newUser', 'manager');
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
  document.getElementById('editUserFirstName').value = String(user.first_name || '');
  document.getElementById('editUserLastName').value = String(user.last_name || '');
  document.getElementById('editUserEmail').value = String(user.email || '');
  document.getElementById('editUserPassword').value = '';

  const roleSelect = document.getElementById('editUserRole');
  roleSelect.value = String(user.role || 'customer').toLowerCase();
  roleSelect.disabled = roleLocked;
  syncUserAccessControls('editUser', roleSelect.value, user.permissions || [], user.mobile_app_access);

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
  syncUserAccessControls('editUser', 'manager');
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
  const nextFirstName = document.getElementById('editUserFirstName').value.trim();
  const nextLastName = document.getElementById('editUserLastName').value.trim();
  const nextEmailRaw = document.getElementById('editUserEmail').value.trim();
  const nextEmail = nextEmailRaw.toLowerCase();
  const nextPassword = document.getElementById('editUserPassword').value;
  const roleSelect = document.getElementById('editUserRole');
  const roleLocked = roleSelect.disabled;
  const permissions = getPermissionSelection('editUser');
  const mobile_app_access = Boolean(document.getElementById('editUserMobileAppAccess').checked);

  const payload = {};

  if (nextUsername && nextUsername !== String(existing.username || '')) {
    payload.username = nextUsername;
  }

  if (nextFirstName !== String(existing.first_name || '')) {
    payload.first_name = nextFirstName;
  }

  if (nextLastName !== String(existing.last_name || '')) {
    payload.last_name = nextLastName;
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

  const currentPermissions = normalizePermissionSelection(existing.role, existing.permissions || []);
  const nextPermissions = normalizePermissionSelection(roleLocked ? existing.role : selectedRole, permissions);
  if (JSON.stringify(nextPermissions) !== JSON.stringify(currentPermissions)) {
    payload.permissions = nextPermissions;
  }

  if (mobile_app_access !== Boolean(existing.mobile_app_access !== false)) {
    payload.mobile_app_access = mobile_app_access;
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

function formatCzkAmount(value, decimals = 2) {
  const amount = Number(value || 0);
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const normalizedDecimals = Number.isInteger(decimals) && decimals >= 0 ? decimals : 2;
  const formatted = new Intl.NumberFormat('cs-CZ', {
    minimumFractionDigits: normalizedDecimals,
    maximumFractionDigits: normalizedDecimals
  }).format(safeAmount).replace(/\u00A0|\u202F/g, ' ');
  return `${formatted} Kč`;
}

function formatMoney(value) {
  return formatCzkAmount(value, 2);
}

function formatInvoiceAmount(value) {
  return formatCzkAmount(value, 2);
}

function formatInvoiceDate(dateValue) {
  const date = dateValue ? new Date(dateValue) : new Date();
  if (!Number.isFinite(date.getTime())) return new Date().toLocaleDateString('cs-CZ');
  return date.toLocaleDateString('cs-CZ');
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

function rebuildInvoiceOrderMap() {
  const nextMap = new Map();
  const source = Array.isArray(state.invoices) ? state.invoices : [];
  source.forEach((invoice) => {
    const orderId = String(invoice?.order_id || '').trim();
    const invoiceNumber = String(invoice?.invoice_number || '').trim();
    if (!orderId || !invoiceNumber) return;
    if (!nextMap.has(orderId)) {
      nextMap.set(orderId, []);
    }
    nextMap.get(orderId).push(invoiceNumber);
  });
  state.invoiceNumbersByOrderId = nextMap;
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
  const query = String(document.getElementById('orderSearchFilter')?.value || '').trim().toLowerCase();

  return state.orders.filter((order) => {
    if (status !== 'all' && String(order.status) !== status) return false;
    if (type !== 'all') {
      const details = state.detailsById.get(String(order.id));
      const orderType = classifyOrder(details);
      if (orderType !== type) return false;
    }
    if (query) {
      const orderNumber = String(order.order_number || '').toLowerCase();
      if (orderNumber.includes(query)) return true;

      const invoiceNumbers = state.invoiceNumbersByOrderId.get(String(order.id)) || [];
      const hasInvoiceMatch = invoiceNumbers.some((invoiceNumber) => String(invoiceNumber || '').toLowerCase().includes(query));
      if (!hasInvoiceMatch) return false;
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
      const quantity = Number(item.qty || 0);
      item.qty = Number.isFinite(quantity) && quantity >= 0 ? Math.floor(quantity) : 0;
      item.sku = String(item.sku || item.id || '').trim();
      item.barcode = String(item.barcode || '').trim();
      item.location = String(item.location || '').trim();
    });
  });
}

function createInventoryItem(kind) {
  const stamp = Date.now();
  if (kind === 'printers') {
    return { id: `printer-${stamp}`, sku: `SKU-PRN-${stamp}`, barcode: '', location: 'A-01', name: 'Nová tiskarna', qty: 0, price: 0, active: true };
  }
  if (kind === 'filaments') {
    return { id: `filament-${stamp}`, sku: `SKU-FIL-${stamp}`, barcode: '', location: 'B-01', name: 'Nový filament', qty: 0, price: 0, active: true };
  }
  if (kind === 'pcBuildParts') {
    return { id: `pc-part-${stamp}`, sku: `SKU-PC-${stamp}`, barcode: '', location: 'C-01', name: 'Nový PC díl', qty: 0, price: 0, active: true };
  }
  if (kind === 'usedShopItems') {
    return { id: `used-${stamp}`, sku: `SKU-USED-${stamp}`, barcode: '', location: 'D-01', name: 'Nová bazarová polozka', qty: 0, price: 0, active: true };
  }
  if (kind === 'otherCustomItems') {
    return { id: `other-${stamp}`, sku: `SKU-OTH-${stamp}`, barcode: '', location: 'E-01', name: 'Nová položka v Other', qty: 0, price: 0, active: true };
  }
  return { id: `item-${stamp}`, sku: `SKU-ITEM-${stamp}`, barcode: '', location: 'Z-01', name: 'Nová polozka', qty: 0, price: 0, active: true };
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

function getInventoryStockLevel(quantity) {
  const safeQuantity = Number.isFinite(Number(quantity)) ? Math.max(0, Math.floor(Number(quantity))) : 0;
  if (safeQuantity <= 0) return 'empty';
  if (safeQuantity <= 3) return 'low';
  if (safeQuantity <= 10) return 'medium';
  return 'healthy';
}

function normalizeInventoryLookupValue(value) {
  return String(value || '').trim().toLowerCase();
}

function hashSeed(value) {
  const text = String(value || '');
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function buildEan13CheckDigit(base12) {
  const digits = String(base12 || '').replace(/\D/g, '').slice(0, 12).padStart(12, '0');
  const sum = digits
    .split('')
    .reduce((acc, char, index) => {
      const value = Number(char);
      if (!Number.isFinite(value)) return acc;
      return acc + value * (index % 2 === 0 ? 1 : 3);
    }, 0);
  const mod = sum % 10;
  return mod === 0 ? 0 : 10 - mod;
}

function collectUsedInventoryBarcodes(sourceCatalog) {
  const used = new Set();
  const printing = sourceCatalog?.printing || {};
  INVENTORY_SECTION_CONFIG.forEach((section) => {
    const list = Array.isArray(printing?.[section.kind]) ? printing[section.kind] : [];
    list.forEach((item) => {
      const value = String(item?.barcode || '').trim();
      if (value) used.add(value);
    });
  });
  return used;
}

function generateUniqueInventoryBarcode(sourceCatalog, seed = '') {
  const used = collectUsedInventoryBarcodes(sourceCatalog);
  const baseSeed = `${seed}-${Date.now()}-${Math.random()}`;

  for (let attempt = 0; attempt < 24; attempt += 1) {
    const start = hashSeed(`${baseSeed}-${attempt}`);
    let stateValue = start;
    let body = '';

    while (body.length < 12) {
      stateValue = (Math.imul(stateValue, 1664525) + 1013904223) >>> 0;
      body += String(stateValue).padStart(10, '0');
    }

    const base12 = body.slice(0, 12);
    const checkDigit = buildEan13CheckDigit(base12);
    const candidate = `${base12}${checkDigit}`;

    if (!used.has(candidate)) {
      return candidate;
    }
  }

  return '';
}

function generateBarcodeForItem(item, sourceCatalog) {
  const seed = `${item?.id || ''}|${item?.sku || ''}|${item?.name || ''}`;
  return generateUniqueInventoryBarcode(sourceCatalog, seed);
}

function sanitizeCode39Value(value) {
  const allowed = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%';
  const upper = String(value || '').toUpperCase();
  return upper
    .split('')
    .map((char) => (allowed.includes(char) ? char : '-'))
    .join('')
    .trim();
}

function buildCode39BarcodeSvg(rawValue) {
  const PATTERNS = {
    '0': 'nnnwwnwnn', '1': 'wnnwnnnnw', '2': 'nnwwnnnnw', '3': 'wnwwnnnnn', '4': 'nnnwwnnnw',
    '5': 'wnnwwnnnn', '6': 'nnwwwnnnn', '7': 'nnnwnnwnw', '8': 'wnnwnnwnn', '9': 'nnwwnnwnn',
    A: 'wnnnnwnnw', B: 'nnwnnwnnw', C: 'wnwnnwnnn', D: 'nnnnwwnnw', E: 'wnnnwwnnn',
    F: 'nnwnwwnnn', G: 'nnnnnwwnw', H: 'wnnnnwwnn', I: 'nnwnnwwnn', J: 'nnnnwwwnn',
    K: 'wnnnnnnww', L: 'nnwnnnnww', M: 'wnwnnnnwn', N: 'nnnnwnnww', O: 'wnnnwnnwn',
    P: 'nnwnwnnwn', Q: 'nnnnnnwww', R: 'wnnnnnwwn', S: 'nnwnnnwwn', T: 'nnnnwnwwn',
    U: 'wwnnnnnnw', V: 'nwwnnnnnw', W: 'wwwnnnnnn', X: 'nwnnwnnnw', Y: 'wwnnwnnnn',
    Z: 'nwwnwnnnn', '-': 'nwnnnnwnw', '.': 'wwnnnnwnn', ' ': 'nwwnnnwnn',
    '$': 'nwnwnwnnn', '/': 'nwnwnnnwn', '+': 'nwnnnwnwn', '%': 'nnnwnwnwn', '*': 'nwnnwnwnn'
  };

  const content = sanitizeCode39Value(rawValue || '-') || '-';
  const encoded = `*${content}*`;
  const narrow = 2;
  const wide = 5;
  const gap = narrow;
  const barHeight = 66;
  const quiet = 10;
  const textHeight = 20;
  let x = quiet;
  const rects = [];

  encoded.split('').forEach((char) => {
    const pattern = PATTERNS[char] || PATTERNS['-'];
    for (let i = 0; i < pattern.length; i += 1) {
      const width = pattern[i] === 'w' ? wide : narrow;
      if (i % 2 === 0) {
        rects.push(`<rect x="${x}" y="0" width="${width}" height="${barHeight}" fill="#111827" />`);
      }
      x += width;
    }
    x += gap;
  });

  const totalWidth = x + quiet;
  const human = escapeHtml(content);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${barHeight + textHeight}" viewBox="0 0 ${totalWidth} ${barHeight + textHeight}" role="img" aria-label="Code39 ${human}">${rects.join('')}<text x="50%" y="${barHeight + 14}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#111827" letter-spacing="1.4">${human}</text></svg>`;
}

function buildInventoryLabelDocumentHtml(item, sectionLabel) {
  const template = state.labelTemplate || getDefaultLabelTemplate();
  const widthMm = clampNumber(template.widthMm, 35, 120, 58);
  const heightMm = clampNumber(template.heightMm, 24, 120, 50);
  const fontSize = clampNumber(template.fontSize, 8, 16, 11);
  const name = escapeHtml(String(item?.name || item?.id || 'Položka'));
  const sku = escapeHtml(String(item?.sku || item?.id || '-'));
  const location = escapeHtml(String(item?.location || '-'));
  const barcode = String(item?.barcode || '').trim() || sku;
  const barcodeSvg = buildCode39BarcodeSvg(barcode);
  const section = escapeHtml(sectionLabel || 'Sklad');

  return `<!DOCTYPE html>
  <html lang="cs">
    <head>
      <meta charset="UTF-8" />
      <title>Skladový štítek ${sku}</title>
      <style>
        @page { size: ${widthMm}mm ${heightMm}mm; margin: 1.2mm; }
        html, body { margin: 0; padding: 0; }
        body { width: ${widthMm}mm; height: ${heightMm}mm; font-family: Arial, sans-serif; font-size: ${fontSize}px; color: #111827; }
        .label { box-sizing: border-box; width: 100%; height: 100%; border: 1px solid #111827; border-radius: 2mm; padding: 1.6mm; display: grid; grid-template-rows: auto auto auto 1fr auto; gap: 1mm; }
        .head { display: flex; justify-content: space-between; align-items: center; font-weight: 700; border-bottom: 1px dashed #6b7280; padding-bottom: 0.8mm; }
        .name { font-weight: 700; line-height: 1.2; }
        .meta { display: flex; justify-content: space-between; gap: 2mm; font-size: ${Math.max(8, fontSize - 1)}px; }
        .barcode { display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .foot { text-align: center; font-size: ${Math.max(8, fontSize - 1)}px; color: #374151; }
        svg { max-width: 100%; height: auto; }
      </style>
    </head>
    <body>
      <div class="label">
        <div class="head"><span>${escapeHtml(template.header || 'EZFix Warehouse')}</span><span>${section}</span></div>
        <div class="name">${name}</div>
        <div class="meta"><span>SKU: <strong>${sku}</strong></span><span>Pozice: <strong>${location}</strong></span></div>
        <div class="barcode">${barcodeSvg}</div>
        <div class="foot">${escapeHtml(template.footer || '')}</div>
      </div>
    </body>
  </html>`;
}

async function printInventoryLabel(item, sectionLabel = 'Sklad') {
  const html = buildInventoryLabelDocumentHtml(item, sectionLabel);
  await printHtmlDocument({
    title: `Skladovy stitek ${item?.sku || item?.id || ''}`,
    html,
    printerName: state.labelPrinter
  });
  showToast('Skladový štítek byl odeslán na tisk');
}

async function printInventoryLabelFromScannerContext() {
  const scanInput = document.getElementById('inventoryScanInput');
  const sourceCatalog = state.inventoryEditMode ? state.inventoryDraft : state.catalog;
  ensureInventoryArrays(sourceCatalog || {});
  normalizeInventoryPrices(sourceCatalog || {});

  const code = String(scanInput?.value || state.inventoryLastScanCode || '').trim();
  if (!code) {
    setInventoryScanResult('Pro tisk štítku nejdřív naskenujte nebo vyhledejte položku.', 'error');
    return;
  }

  const matches = findInventoryMatchesByCode(sourceCatalog, code);
  if (matches.length === 0) {
    setInventoryScanResult(`Pro kód ${code} nebyla nalezena žádná položka.`, 'error');
    return;
  }

  const target = matches[0];
  await printInventoryLabel(target.item, target.sectionLabel);
  setInventoryScanResult(`Štítek vytištěn: ${target.item?.name || target.item?.id}`, 'success');
}

function generateMissingInventoryBarcodes() {
  if (!state.catalog) return;
  if (!state.inventoryEditMode) {
    setInventoryEditMode(true, state.inventoryEditKind || 'printers');
  }

  const sourceCatalog = state.inventoryDraft || state.catalog;
  ensureInventoryArrays(sourceCatalog);
  normalizeInventoryPrices(sourceCatalog);

  let updated = 0;
  INVENTORY_SECTION_CONFIG.forEach((section) => {
    const list = Array.isArray(sourceCatalog.printing?.[section.kind]) ? sourceCatalog.printing[section.kind] : [];
    list.forEach((item) => {
      if (!item || item.active === false) return;
      if (String(item.barcode || '').trim()) return;
      const nextBarcode = generateBarcodeForItem(item, sourceCatalog);
      if (!nextBarcode) return;
      item.barcode = nextBarcode;
      updated += 1;
    });
  });

  renderInventory();
  if (updated > 0) {
    setInventoryScanResult(`Vygenerováno ${updated} nových kódů.`, 'success');
    showToast(`Vygenerováno ${updated} čárových kódů`);
    return;
  }

  setInventoryScanResult('Všechny aktivní položky už mají kód.', 'success');
  showToast('Žádné chybějící kódy k vygenerování');
}

function findInventoryMatchesByCode(sourceCatalog, rawCode) {
  const normalizedCode = normalizeInventoryLookupValue(rawCode);
  if (!normalizedCode) return [];

  const printing = sourceCatalog?.printing || {};
  const matches = [];

  INVENTORY_SECTION_CONFIG.forEach((section) => {
    const list = Array.isArray(printing?.[section.kind]) ? printing[section.kind] : [];
    list.forEach((item, sourceIndex) => {
      if (!item) return;
      if (!state.inventoryEditMode && item.active === false) return;

      const nameValue = normalizeInventoryLookupValue(item.name);
      const idValue = normalizeInventoryLookupValue(item.id);
      const skuValue = normalizeInventoryLookupValue(item.sku);
      const barcodeValue = normalizeInventoryLookupValue(item.barcode);
      const locationValue = normalizeInventoryLookupValue(item.location);

      let score = null;
      if (barcodeValue && barcodeValue === normalizedCode) score = 0;
      else if (skuValue && skuValue === normalizedCode) score = 1;
      else if (idValue && idValue === normalizedCode) score = 2;
      else if (nameValue && nameValue === normalizedCode) score = 3;
      else if (barcodeValue && barcodeValue.includes(normalizedCode)) score = 4;
      else if (skuValue && skuValue.includes(normalizedCode)) score = 5;
      else if (idValue && idValue.includes(normalizedCode)) score = 6;
      else if (nameValue && nameValue.includes(normalizedCode)) score = 7;
      else if (locationValue && locationValue.includes(normalizedCode)) score = 8;

      if (score === null) return;

      matches.push({
        score,
        kind: section.kind,
        listId: section.listId,
        sectionLabel: section.label,
        sourceIndex,
        item
      });
    });
  });

  return matches.sort((a, b) => a.score - b.score);
}

function setInventoryScanResult(message, type = '') {
  const resultEl = document.getElementById('inventoryScanResult');
  if (!resultEl) return;
  resultEl.textContent = message;
  resultEl.classList.remove('error', 'success');
  if (type === 'error' || type === 'success') {
    resultEl.classList.add(type);
  }
}

function getFilteredInventoryEntries(list) {
  const query = String(state.inventorySearchQuery || '').trim().toLowerCase();
  const stockFilter = String(state.inventoryStockFilter || 'all').toLowerCase();
  const shouldFilterByStock = !state.inventoryEditMode && stockFilter !== 'all';

  return list
    .map((item, sourceIndex) => ({ item, sourceIndex }))
    .filter((entry) => entry.item && (state.inventoryEditMode || entry.item.active !== false))
    .filter((entry) => {
      if (!query) return true;
      const searchText = [entry.item?.name, entry.item?.id, entry.item?.sku, entry.item?.barcode, entry.item?.location]
        .map((value) => String(value || '').toLowerCase())
        .join(' ');
      return searchText.includes(query);
    })
    .filter((entry) => {
      if (!shouldFilterByStock) return true;
      return getInventoryStockLevel(Number(entry.item?.qty || 0)) === stockFilter;
    });
}

function renderInventoryMovements() {
  const listEl = document.getElementById('inventoryMovementList');
  const countEl = document.getElementById('inventoryMovementCount');
  if (!listEl || !countEl) return;

  const movements = Array.isArray(state.inventoryMovements) ? state.inventoryMovements : [];
  countEl.textContent = `${movements.length} záznamů`;

  if (movements.length === 0) {
    listEl.innerHTML = '<div class="inventory-movement-empty">Zatím bez pohybu. Po skenu Naskladnit/Vyskladnit se historie začne plnit.</div>';
    return;
  }

  listEl.innerHTML = movements.map((movement) => {
    const movementType = String(movement?.type || '').toLowerCase();
    const kindClass = movementType === 'in' ? 'in' : movementType === 'out' ? 'out' : 'fix';
    const kindLabel = movementType === 'in' ? 'Příjem +' : movementType === 'out' ? 'Výdej -' : 'Úprava';
    const timestamp = formatDate(movement?.at || '');
    const name = escapeHtml(String(movement?.name || movement?.id || '-'));
    const sku = escapeHtml(String(movement?.sku || '-'));
    const location = escapeHtml(String(movement?.location || '-'));
    const operator = escapeHtml(String(movement?.operator || 'Neznámý operátor'));
    const device = escapeHtml(String(movement?.device || '-'));
    const beforeQty = Number.isFinite(Number(movement?.beforeQty)) ? Math.max(0, Math.floor(Number(movement.beforeQty))) : 0;
    const afterQty = Number.isFinite(Number(movement?.afterQty)) ? Math.max(0, Math.floor(Number(movement.afterQty))) : 0;
    const deltaQty = Number.isFinite(Number(movement?.deltaQty)) ? Math.floor(Number(movement.deltaQty)) : 0;
    const deltaPrefix = deltaQty > 0 ? '+' : '';

    return `
      <div class="inventory-movement-item">
        <div class="inventory-movement-item-top">
          <span class="inventory-movement-kind ${kindClass}">${kindLabel}</span>
          <span>${escapeHtml(timestamp)}</span>
        </div>
        <div class="inventory-movement-line"><strong>${name}</strong> | SKU: ${sku} | Pozice: ${location}</div>
        <div class="inventory-movement-line">${beforeQty} -> ${afterQty} ks <strong>(${deltaPrefix}${deltaQty})</strong></div>
        <div class="inventory-movement-line">Operátor: ${operator} | Zařízení: ${device}</div>
      </div>
    `;
  }).join('');
}

function getInventoryMovementOperatorLabel() {
  const username = String(state.currentUser?.username || '').trim();
  if (username) return username;
  const email = String(state.currentUser?.email || '').trim();
  if (email) return email;
  const id = String(state.currentUser?.id || '').trim();
  if (id) return `Uživatel ${id}`;
  return 'Neznámý operátor';
}

function normalizeInventoryMovementRecord(entry = {}) {
  return {
    id: String(entry?.id || '').trim() || `mv-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    at: (() => {
      const parsed = new Date(entry?.at || Date.now());
      return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : new Date().toISOString();
    })(),
    type: String(entry?.type || 'fix'),
    name: String(entry?.name || '-'),
    sku: String(entry?.sku || '-'),
    location: String(entry?.location || '-'),
    beforeQty: Number.isFinite(Number(entry?.beforeQty)) ? Math.floor(Number(entry.beforeQty)) : 0,
    afterQty: Number.isFinite(Number(entry?.afterQty)) ? Math.floor(Number(entry.afterQty)) : 0,
    deltaQty: Number.isFinite(Number(entry?.deltaQty)) ? Math.floor(Number(entry.deltaQty)) : 0,
    operator: String(entry?.operator || getInventoryMovementOperatorLabel()),
    device: String(entry?.device || getInventoryDeviceLabel()),
    idRef: String(entry?.idRef || '')
  };
}

function sortInventoryMovementsDesc(list) {
  return list.sort((a, b) => {
    const timeA = new Date(a?.at || 0).getTime();
    const timeB = new Date(b?.at || 0).getTime();
    return (Number.isFinite(timeB) ? timeB : 0) - (Number.isFinite(timeA) ? timeA : 0);
  });
}

async function fetchInventoryMovementsFromApi() {
  if (!state.token) return [];
  const result = await apiFetch('/inventory/movements?limit=250');
  const movements = Array.isArray(result?.movements) ? result.movements : [];
  return movements.map((item) => normalizeInventoryMovementRecord(item));
}

async function pushInventoryMovementToApi(movement) {
  if (!state.token) return;
  await apiFetch('/inventory/movements', {
    method: 'POST',
    body: JSON.stringify({ movement: normalizeInventoryMovementRecord(movement) })
  });
}

async function clearInventoryMovementsOnApi() {
  if (!state.token) return;
  await apiFetch('/inventory/movements', { method: 'DELETE' });
}

async function syncInventoryMovementsFromApi() {
  if (!state.token || state.inventoryMovementsSynced) return;

  const localMovements = Array.isArray(state.inventoryMovements)
    ? state.inventoryMovements.map((item) => normalizeInventoryMovementRecord(item))
    : [];

  try {
    const remoteMovements = await fetchInventoryMovementsFromApi();
    const byId = new Map();

    remoteMovements.forEach((item) => {
      byId.set(item.id, item);
    });

    const missingOnRemote = [];
    localMovements.forEach((item) => {
      if (!byId.has(item.id)) {
        missingOnRemote.push(item);
      }
      byId.set(item.id, item);
    });

    state.inventoryMovements = sortInventoryMovementsDesc(Array.from(byId.values())).slice(0, 250);
    persistInventoryMovements();
    renderInventoryMovements();

    if (missingOnRemote.length > 0) {
      await Promise.allSettled(missingOnRemote.slice(0, 250).map((item) => pushInventoryMovementToApi(item)));
    }

    state.inventoryMovementsSynced = true;
  } catch (error) {
    console.warn('Inventory movement sync failed, using local history only:', error);
  }
}

function addInventoryMovement(entry) {
  const nextMovement = normalizeInventoryMovementRecord(entry);

  const existing = Array.isArray(state.inventoryMovements) ? state.inventoryMovements : [];
  state.inventoryMovements = [nextMovement, ...existing].slice(0, 250);
  persistInventoryMovements();
  renderInventoryMovements();
  void pushInventoryMovementToApi(nextMovement).catch((error) => {
    console.warn('Inventory movement API save failed:', error);
  });
}

function clearInventoryMovements() {
  state.inventoryMovements = [];
  persistInventoryMovements();
  renderInventoryMovements();
  void clearInventoryMovementsOnApi().catch((error) => {
    console.warn('Inventory movement API clear failed:', error);
  });
}

function exportInventoryMovementsCsv() {
  const movements = Array.isArray(state.inventoryMovements) ? state.inventoryMovements : [];
  if (movements.length === 0) {
    setInventoryScanResult('Historie pohybů je prázdná. Není co exportovat.', 'error');
    return;
  }

  const headers = ['Datum', 'Typ', 'Položka', 'SKU', 'Pozice', 'Před', 'Po', 'Změna', 'Operátor', 'Zařízení'];
  const lines = [headers.map(makeCsvValue).join(',')];
  movements.forEach((movement) => {
    const movementType = String(movement?.type || '').toLowerCase();
    const kindLabel = movementType === 'in' ? 'Příjem +' : movementType === 'out' ? 'Výdej -' : 'Úprava';
    const row = [
      formatDate(movement?.at || ''),
      kindLabel,
      String(movement?.name || '-'),
      String(movement?.sku || '-'),
      String(movement?.location || '-'),
      String(Number.isFinite(Number(movement?.beforeQty)) ? Math.floor(Number(movement.beforeQty)) : 0),
      String(Number.isFinite(Number(movement?.afterQty)) ? Math.floor(Number(movement.afterQty)) : 0),
      String(Number.isFinite(Number(movement?.deltaQty)) ? Math.floor(Number(movement.deltaQty)) : 0),
      String(movement?.operator || 'Neznámý operátor'),
      String(movement?.device || '-')
    ];
    lines.push(row.map(makeCsvValue).join(','));
  });

  downloadBlob(`sklad-pohyby-${Date.now()}.csv`, 'text/csv;charset=utf-8;', `\ufeff${lines.join('\n')}`);
  showToast(`CSV pohybů vytvořeno (${movements.length} záznamů)`);
  setInventoryScanResult(`CSV export pohybů je připraven (${movements.length} záznamů).`, 'success');
}

function buildInventoryMovementsPdfHtml(movements) {
  const rows = movements.map((movement, index) => {
    const movementType = String(movement?.type || '').toLowerCase();
    const kindLabel = movementType === 'in' ? 'Příjem +' : movementType === 'out' ? 'Výdej -' : 'Úprava';
    const beforeQty = Number.isFinite(Number(movement?.beforeQty)) ? Math.floor(Number(movement.beforeQty)) : 0;
    const afterQty = Number.isFinite(Number(movement?.afterQty)) ? Math.floor(Number(movement.afterQty)) : 0;
    const deltaQty = Number.isFinite(Number(movement?.deltaQty)) ? Math.floor(Number(movement.deltaQty)) : 0;

    return `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(formatDate(movement?.at || ''))}</td>
        <td>${escapeHtml(kindLabel)}</td>
        <td>${escapeHtml(String(movement?.name || '-'))}</td>
        <td>${escapeHtml(String(movement?.sku || '-'))}</td>
        <td>${escapeHtml(String(movement?.location || '-'))}</td>
        <td>${beforeQty}</td>
        <td>${afterQty}</td>
        <td>${deltaQty}</td>
        <td>${escapeHtml(String(movement?.operator || 'Neznámý operátor'))}</td>
        <td>${escapeHtml(String(movement?.device || '-'))}</td>
      </tr>
    `;
  }).join('');

  return `<!DOCTYPE html>
  <html lang="cs">
    <head>
      <meta charset="UTF-8" />
      <title>Historie pohybů skladu</title>
      <style>
        @page { size: A4; margin: 12mm; }
        body { margin: 0; font-family: Arial, sans-serif; color: #111827; }
        h1 { margin: 0 0 8px; font-size: 20px; }
        p { margin: 0 0 12px; color: #374151; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th, td { border: 1px solid #d1d5db; padding: 6px; text-align: left; }
        th { background: #f3f4f6; }
      </style>
    </head>
    <body>
      <h1>Historie pohybů skladu</h1>
      <p>Vygenerováno: ${escapeHtml(formatDate(new Date().toISOString()))}</p>
      <table>
        <thead>
          <tr>
            <th>#</th><th>Datum</th><th>Typ</th><th>Položka</th><th>SKU</th><th>Pozice</th><th>Před</th><th>Po</th><th>Změna</th><th>Operátor</th><th>Zařízení</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </body>
  </html>`;
}

async function exportInventoryMovementsPdf() {
  const movements = Array.isArray(state.inventoryMovements) ? state.inventoryMovements : [];
  if (movements.length === 0) {
    setInventoryScanResult('Historie pohybů je prázdná. Není co exportovat.', 'error');
    return;
  }

  const html = buildInventoryMovementsPdfHtml(movements);
  await savePdfDocument({
    title: 'Historie pohybů skladu',
    html,
    defaultFileName: `sklad-pohyby-${Date.now()}.pdf`
  });
  showToast(`PDF pohybů vytvořeno (${movements.length} záznamů)`);
  setInventoryScanResult(`PDF export pohybů je připraven (${movements.length} záznamů).`, 'success');
}

function collectVisibleInventoryLabelEntries(sourceCatalog) {
  const printing = sourceCatalog?.printing || {};
  return INVENTORY_SECTION_CONFIG.flatMap((section) => {
    const list = Array.isArray(printing?.[section.kind]) ? printing[section.kind] : [];
    const entries = getFilteredInventoryEntries(list);
    return entries.map((entry) => ({
      item: entry.item,
      sectionLabel: section.label
    }));
  });
}

function buildInventoryBatchLabelsPdfHtml(entries) {
  const safeEntries = Array.isArray(entries) ? entries : [];
  const sheets = safeEntries.map((entry, index) => {
    const item = entry?.item || {};
    const sectionLabel = String(entry?.sectionLabel || 'Sklad');
    const name = escapeHtml(String(item?.name || item?.id || 'Položka'));
    const sku = escapeHtml(String(item?.sku || item?.id || '-'));
    const location = escapeHtml(String(item?.location || '-'));
    const barcode = String(item?.barcode || '').trim() || String(item?.sku || item?.id || '-');
    const barcodeSvg = buildCode39BarcodeSvg(barcode);
    const pageClass = index === safeEntries.length - 1 ? 'sheet last' : 'sheet';

    return `
      <section class="${pageClass}">
        <div class="head">
          <span>EZFix Warehouse</span>
          <span>${escapeHtml(sectionLabel)}</span>
        </div>
        <div class="name">${name}</div>
        <div class="meta">SKU: <strong>${sku}</strong></div>
        <div class="meta">Pozice: <strong>${location}</strong></div>
        <div class="barcode">${barcodeSvg}</div>
      </section>
    `;
  }).join('');

  return `<!DOCTYPE html>
  <html lang="cs">
    <head>
      <meta charset="UTF-8" />
      <title>Skladové štítky</title>
      <style>
        @page { size: A4; margin: 10mm; }
        body { margin: 0; font-family: Arial, sans-serif; color: #111827; }
        .sheet {
          width: 62mm;
          min-height: 42mm;
          border: 1px solid #111827;
          border-radius: 2mm;
          padding: 2.2mm;
          box-sizing: border-box;
          display: grid;
          gap: 1.2mm;
          margin-bottom: 4mm;
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .sheet.last { margin-bottom: 0; }
        .head { display: flex; justify-content: space-between; gap: 3mm; font-size: 11px; font-weight: 700; border-bottom: 1px dashed #6b7280; padding-bottom: 1mm; }
        .name { font-size: 12px; font-weight: 700; }
        .meta { font-size: 10px; }
        .barcode { display: flex; justify-content: center; align-items: center; margin-top: 1mm; }
        svg { max-width: 100%; height: auto; }
      </style>
    </head>
    <body>${sheets}</body>
  </html>`;
}

async function exportVisibleInventoryLabelsPdf() {
  const sourceCatalog = state.inventoryEditMode ? state.inventoryDraft : state.catalog;
  ensureInventoryArrays(sourceCatalog || {});
  normalizeInventoryPrices(sourceCatalog || {});

  const entries = collectVisibleInventoryLabelEntries(sourceCatalog);
  if (entries.length === 0) {
    setInventoryScanResult('Pro aktuální filtr není co exportovat do štítků.', 'error');
    return;
  }

  const html = buildInventoryBatchLabelsPdfHtml(entries);
  await savePdfDocument({
    title: 'Skladové štítky',
    html,
    defaultFileName: `skladove-stitky-${Date.now()}.pdf`
  });

  showToast(`PDF štítků vytvořeno (${entries.length} položek)`);
  setInventoryScanResult(`PDF štítků je připraveno pro ${entries.length} položek.`, 'success');
}

function runInventoryScanAction(mode) {
  const scanInput = document.getElementById('inventoryScanInput');
  const qtyInput = document.getElementById('inventoryScanQty');
  const stockFilterEl = document.getElementById('inventoryStockFilter');
  const searchInput = document.getElementById('inventorySearchInput');

  const code = String(scanInput?.value || '').trim();
  const qtyRaw = Number(qtyInput?.value || 1);
  const quantity = Number.isFinite(qtyRaw) && qtyRaw > 0 ? Math.floor(qtyRaw) : 1;

  if (!code) {
    setInventoryScanResult('Zadejte nebo naskenujte kód.', 'error');
    return;
  }

  const sourceCatalog = state.inventoryEditMode ? state.inventoryDraft : state.catalog;
  ensureInventoryArrays(sourceCatalog || {});
  normalizeInventoryPrices(sourceCatalog || {});

  const matches = findInventoryMatchesByCode(sourceCatalog, code);
  if (matches.length === 0) {
    setInventoryScanResult(`Kód ${code} nebyl ve skladu nalezen.`, 'error');
    return;
  }

  const target = matches[0];
  state.inventoryLastScanCode = code;
  const targetName = String(target.item?.name || target.item?.id || 'Položka');
  const targetSku = String(target.item?.sku || target.item?.id || '-');
  const targetLocation = String(target.item?.location || '-');
  const currentQty = Number.isFinite(Number(target.item?.qty)) ? Math.max(0, Math.floor(Number(target.item.qty))) : 0;

  state.inventorySearchQuery = code;
  if (searchInput) searchInput.value = state.inventorySearchQuery;
  localStorage.setItem('ezfixDesktopInventorySearch', state.inventorySearchQuery);
  state.inventoryStockFilter = 'all';
  if (stockFilterEl) stockFilterEl.value = 'all';
  localStorage.setItem('ezfixDesktopInventoryStockFilter', state.inventoryStockFilter);
  setInventoryListCollapsed(target.listId, false);
  localStorage.setItem('ezfixDesktopInventoryCollapsed', JSON.stringify(state.inventoryCollapsed));

  if (mode === 'find') {
    renderInventory();
    setInventoryScanResult(`Nalezeno: ${targetName} | SKU: ${targetSku} | Pozice: ${targetLocation} | Sklad: ${currentQty} ks`, 'success');
    showToast(`Nalezena položka: ${targetName}`);
    return;
  }

  if (!state.inventoryEditMode) {
    setInventoryEditMode(true, target.kind);
  }

  if (!state.inventoryDraft?.printing?.[target.kind] || !state.inventoryDraft.printing[target.kind][target.sourceIndex]) {
    setInventoryScanResult('Položku se nepodařilo otevřít pro úpravu skladu.', 'error');
    return;
  }

  const draftTarget = state.inventoryDraft.printing[target.kind][target.sourceIndex];
  const draftCurrentQty = Number.isFinite(Number(draftTarget.qty)) ? Math.max(0, Math.floor(Number(draftTarget.qty))) : 0;
  const draftNextQty = mode === 'add'
    ? draftCurrentQty + quantity
    : Math.max(0, draftCurrentQty - quantity);
  draftTarget.qty = draftNextQty;

  addInventoryMovement({
    type: mode === 'add' ? 'in' : 'out',
    name: draftTarget.name || draftTarget.id,
    sku: draftTarget.sku || draftTarget.id,
    location: draftTarget.location || '-',
    beforeQty: draftCurrentQty,
    afterQty: draftNextQty,
    deltaQty: mode === 'add' ? quantity : -quantity,
    idRef: draftTarget.id || ''
  });

  renderInventory();
  setInventoryScanResult(`Upraveno: ${targetName} | ${draftCurrentQty} -> ${draftNextQty} ks | Pozice: ${targetLocation}`, 'success');
  showToast(mode === 'add' ? `Naskladněno +${quantity} ks` : `Vyskladněno -${quantity} ks`);
}

function buildInventoryList(listId, list, kind) {
  const isSectionEditable = state.inventoryEditMode && state.inventoryEditKind === kind;
  const filteredEntries = getFilteredInventoryEntries(list);
  const html = filteredEntries
    .map(({ item, sourceIndex }) => {
      const name = escapeHtml(item.name || item.id || 'Položka');
      const price = Number(item.price || 0);
      const safePrice = Number.isFinite(price) ? price : 0;
      const quantity = Number(item.qty || 0);
      const safeQuantity = Number.isFinite(quantity) && quantity >= 0 ? Math.floor(quantity) : 0;
      const itemId = escapeHtml(item.id || '-');
      const itemSku = escapeHtml(item.sku || item.id || '-');
      const itemBarcode = escapeHtml(item.barcode || '-');
      const itemLocation = escapeHtml(item.location || '-');

      if (!isSectionEditable) {
        const stockLevel = getInventoryStockLevel(safeQuantity);
        const stockLabelMap = {
          empty: 'Vyprodáno',
          low: 'Nízký sklad',
          medium: 'Pozor',
          healthy: 'Stabilní'
        };
        const stockLabel = stockLabelMap[stockLevel] || stockLabelMap.healthy;
        const rowValue = safeQuantity * safePrice;
        const activity = item.active === false
          ? '<span class="inventory-activity off">Neaktivní</span>'
          : '<span class="inventory-activity on">Aktivní</span>';

        return `
          <li class="inventory-item">
            <div class="inventory-item-main">
              <div class="inventory-item-name">${name}</div>
              <div class="inventory-item-meta">ID: ${itemId} | SKU: ${itemSku} | Kód: ${itemBarcode} | Pozice: ${itemLocation}</div>
            </div>
            <div class="inventory-item-stats">
              <span class="inventory-qty-badge">${safeQuantity} ks</span>
              <span class="inventory-stock-pill ${stockLevel}">${stockLabel}</span>
              ${activity}
              <strong class="inventory-item-price">${formatMoney(safePrice)}</strong>
              <span class="inventory-item-total">Hodnota: ${formatMoney(rowValue)}</span>
            </div>
          </li>
        `;
      }

      return `
        <li class="inventory-edit-item">
          <div class="inventory-edit-row">
            <input data-inv-kind="${kind}" data-inv-index="${sourceIndex}" data-field="name" value="${escapeHtml(item.name || '')}" placeholder="Název" />
            <input data-inv-kind="${kind}" data-inv-index="${sourceIndex}" data-field="sku" value="${escapeHtml(item.sku || item.id || '')}" placeholder="SKU" />
            <input data-inv-kind="${kind}" data-inv-index="${sourceIndex}" data-field="barcode" value="${escapeHtml(item.barcode || '')}" placeholder="Čárový kód" />
            <input data-inv-kind="${kind}" data-inv-index="${sourceIndex}" data-field="location" value="${escapeHtml(item.location || '')}" placeholder="Pozice (regál)" />
            <input data-inv-kind="${kind}" data-inv-index="${sourceIndex}" data-field="qty" type="number" min="0" step="1" value="${safeQuantity}" placeholder="Sklad" />
            <input data-inv-kind="${kind}" data-inv-index="${sourceIndex}" data-field="price" type="number" step="0.01" value="${safePrice}" placeholder="Cena" />
            <input data-inv-kind="${kind}" data-inv-index="${sourceIndex}" data-field="active" value="${item.active === false ? 'false' : 'true'}" placeholder="true/false" />
            <button class="secondary inventory-inline-btn" type="button" data-inv-generate-barcode="${kind}" data-inv-index="${sourceIndex}">Vygenerovat kód</button>
            <button class="secondary inventory-inline-btn" type="button" data-inv-print-label="${kind}" data-inv-index="${sourceIndex}">Tisk štítku</button>
          </div>
          <div class="inventory-item-sub">${escapeHtml(item.id || '')}</div>
          <button class="inventory-remove-btn" data-inv-remove="${kind}" data-inv-index="${sourceIndex}">Smazat</button>
        </li>
      `;
    }).join('');

  document.getElementById(listId).innerHTML = html || '<li>Žádné položky</li>';
  return filteredEntries.length;
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
  const inventoryTabEl = document.getElementById('inventoryTab');
  const compactBtn = document.getElementById('inventoryCompactToggleBtn');
  if (inventoryTabEl) {
    inventoryTabEl.classList.toggle('inventory-compact', Boolean(state.inventoryCompactMode));
  }
  if (compactBtn) {
    compactBtn.textContent = state.inventoryCompactMode ? 'Kompaktní režim: Zapnuto' : 'Kompaktní režim: Vypnuto';
    compactBtn.classList.toggle('active', Boolean(state.inventoryCompactMode));
  }
  const allInventoryItems = [printers, filaments, pcBuildParts, otherItems, otherCustomItems, usedItems]
    .flat()
    .filter((item) => Boolean(item));
  const activeInventoryItems = allInventoryItems
    .filter((item) => item.active !== false);

  const totalCount = printers.length + filaments.length + pcBuildParts.length + otherItems.length + otherCustomItems.length + usedItems.length;
  const activeCount = activeInventoryItems.length;
  const lowStockCount = activeInventoryItems
    .filter((item) => {
      const qty = Number(item.qty || 0);
      return Number.isFinite(qty) && Math.floor(qty) <= 3;
    })
    .length;
  const totalUnits = activeInventoryItems
    .reduce((sum, item) => {
      const qty = Number(item.qty || 0);
      if (!Number.isFinite(qty) || qty < 0) return sum;
      return sum + Math.floor(qty);
    }, 0);
  const estimatedValue = activeInventoryItems
    .reduce((sum, item) => {
      const qty = Number(item.qty || 0);
      const price = Number(item.price || 0);
      const safeQty = Number.isFinite(qty) && qty > 0 ? Math.floor(qty) : 0;
      const safePrice = Number.isFinite(price) && price > 0 ? price : 0;
      return sum + (safeQty * safePrice);
    }, 0);

  setTextContent('inventoryTotalCount', totalCount);
  setTextContent('inventoryActiveCount', activeCount);
  setTextContent('inventoryLowStockCount', lowStockCount);
  setTextContent('inventoryTotalUnits', `${totalUnits} ks`);
  setTextContent('inventoryEstimatedValue', formatMoney(estimatedValue));
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

  const shownCount =
    buildInventoryList('printersList', printers, 'printers')
    + buildInventoryList('filamentsList', filaments, 'filaments')
    + buildInventoryList('pcBuildPartsList', pcBuildParts, 'pcBuildParts')
    + buildInventoryList('otherItemsList', otherItems, 'otherItems')
    + buildInventoryList('otherCustomItemsList', otherCustomItems, 'otherCustomItems')
    + buildInventoryList('usedItemsList', usedItems, 'usedShopItems');
  const inventoryVisibleCountEl = document.getElementById('inventoryVisibleCount');
  if (inventoryVisibleCountEl) {
    const totalPool = state.inventoryEditMode ? totalCount : activeCount;
    inventoryVisibleCountEl.textContent = `Zobrazeno ${shownCount} z ${totalPool} položek`;
  }
  applyInventoryCollapseState();
  renderInventoryMovements();

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

        if (field === 'qty') {
          const parsed = Number(input.value);
          list[index][field] = Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0;
          return;
        }

        if (field === 'active') {
          list[index][field] = String(input.value).trim().toLowerCase() !== 'false';
          return;
        }

        if (field === 'barcode' || field === 'sku' || field === 'location') {
          list[index][field] = String(input.value || '').trim();
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

    document.querySelectorAll('[data-inv-generate-barcode]').forEach((button) => {
      button.addEventListener('click', () => {
        const kind = button.getAttribute('data-inv-generate-barcode');
        const index = Number(button.getAttribute('data-inv-index'));
        const list = state.inventoryDraft?.printing?.[kind || ''];
        if (!Array.isArray(list) || !Number.isFinite(index) || index < 0 || index >= list.length) return;
        const target = list[index];
        const nextBarcode = generateBarcodeForItem(target, state.inventoryDraft);
        if (!nextBarcode) {
          showToast('Kód se nepodařilo vygenerovat');
          return;
        }
        target.barcode = nextBarcode;
        renderInventory();
        setInventoryScanResult(`Vygenerován kód pro ${target.name || target.id}: ${nextBarcode}`, 'success');
      });
    });

    document.querySelectorAll('[data-inv-print-label]').forEach((button) => {
      button.addEventListener('click', async () => {
        const kind = button.getAttribute('data-inv-print-label');
        const index = Number(button.getAttribute('data-inv-index'));
        const list = state.inventoryDraft?.printing?.[kind || ''];
        if (!Array.isArray(list) || !Number.isFinite(index) || index < 0 || index >= list.length) return;
        const target = list[index];
        try {
          const sectionLabel = EASY_CATALOG_KIND_LABELS[kind || ''] || 'Sklad';
          await printInventoryLabel(target, sectionLabel);
        } catch (error) {
          showToast(error.message || 'Tisk štítku selhal');
        }
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
  const [ordersResult, catalogResult, partsResult, invoicesResult] = await Promise.all([
    apiFetch('/orders'),
    apiFetch('/catalog'),
    apiFetch('/builds/parts').catch(() => ({ components: {} })),
    apiFetch('/orders/admin/invoices').catch(() => ({ invoices: [] }))
  ]);

  const nextOrders = Array.isArray(ordersResult.orders) ? ordersResult.orders : [];
  syncKnownOrderIds(nextOrders, notifyOnNew && state.notificationsEnabled);
  state.orders = nextOrders;
  state.invoices = Array.isArray(invoicesResult?.invoices) ? invoicesResult.invoices : [];
  rebuildInvoiceOrderMap();
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
  if (!connected) {
    closeSettingsModal();
  }
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
  applySidebarVisibility(connected);
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

  if (tab === 'inventory') {
    const scanInput = document.getElementById('inventoryScanInput');
    if (scanInput) {
      window.setTimeout(() => {
        scanInput.focus();
        scanInput.select();
      }, 40);
    }
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
  normalizeInventoryPrices(state.inventoryDraft);
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
    await syncInventoryMovementsFromApi();
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
  const allowedStockFilters = new Set(['all', 'healthy', 'medium', 'low', 'empty']);
  if (!allowedStockFilters.has(state.inventoryStockFilter)) {
    state.inventoryStockFilter = 'all';
  }
  const inventorySearchInput = document.getElementById('inventorySearchInput');
  const inventoryStockFilter = document.getElementById('inventoryStockFilter');
  const inventoryCompactToggleBtn = document.getElementById('inventoryCompactToggleBtn');
  const inventoryScanInput = document.getElementById('inventoryScanInput');
  const inventoryScanFindBtn = document.getElementById('inventoryScanFindBtn');
  const inventoryScanAddBtn = document.getElementById('inventoryScanAddBtn');
  const inventoryScanRemoveBtn = document.getElementById('inventoryScanRemoveBtn');
  const inventoryPrintScannedLabelBtn = document.getElementById('inventoryPrintScannedLabelBtn');
  const inventoryGenerateMissingBarcodesBtn = document.getElementById('inventoryGenerateMissingBarcodesBtn');
  const inventoryExportVisibleLabelsPdfBtn = document.getElementById('inventoryExportVisibleLabelsPdfBtn');
  const inventoryExportMovementsCsvBtn = document.getElementById('inventoryExportMovementsCsvBtn');
  const inventoryExportMovementsPdfBtn = document.getElementById('inventoryExportMovementsPdfBtn');
  const inventoryClearMovementsBtn = document.getElementById('inventoryClearMovementsBtn');
  const inventoryDeviceLabelInput = document.getElementById('inventoryDeviceLabelInput');
  if (inventorySearchInput) {
    inventorySearchInput.value = state.inventorySearchQuery;
  }
  if (inventoryStockFilter) {
    inventoryStockFilter.value = state.inventoryStockFilter;
  }
  if (inventoryDeviceLabelInput) {
    inventoryDeviceLabelInput.value = getInventoryDeviceLabel();
  }

  syncUserAccessControls('newUser', document.getElementById('newUserRole')?.value || 'manager');
  syncUserAccessControls('editUser', document.getElementById('editUserRole')?.value || 'manager');

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
    state.inventoryMovementsSynced = false;
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

  if (openSettingsBtn) {
    openSettingsBtn.addEventListener('click', () => {
      openSettingsModal();
    });
  }
  if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener('click', () => {
      if (!state.token) return;
      state.sidebarCollapsed = !state.sidebarCollapsed;
      localStorage.setItem('ezfixDesktopSidebarCollapsed', String(state.sidebarCollapsed));
      applySidebarVisibility(true);
    });
  }

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

  if (inventoryStockFilter) {
    inventoryStockFilter.addEventListener('change', (event) => {
      const nextFilter = String(event.target.value || 'all').toLowerCase();
      state.inventoryStockFilter = allowedStockFilters.has(nextFilter) ? nextFilter : 'all';
      localStorage.setItem('ezfixDesktopInventoryStockFilter', state.inventoryStockFilter);
      renderInventory();
    });
  }

  if (inventoryCompactToggleBtn) {
    inventoryCompactToggleBtn.addEventListener('click', () => {
      state.inventoryCompactMode = !state.inventoryCompactMode;
      localStorage.setItem('ezfixDesktopInventoryCompactMode', String(state.inventoryCompactMode));
      renderInventory();
    });
  }

  if (inventoryDeviceLabelInput) {
    inventoryDeviceLabelInput.addEventListener('input', (event) => {
      state.inventoryDeviceLabel = String(event.target.value || '').trim() || getDefaultInventoryDeviceLabel();
      localStorage.setItem('ezfixDesktopInventoryDeviceLabel', state.inventoryDeviceLabel);
    });
  }

  if (inventoryScanInput) {
    inventoryScanInput.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      runInventoryScanAction('find');
    });
  }

  if (inventoryScanFindBtn) {
    inventoryScanFindBtn.addEventListener('click', () => runInventoryScanAction('find'));
  }

  if (inventoryScanAddBtn) {
    inventoryScanAddBtn.addEventListener('click', () => runInventoryScanAction('add'));
  }

  if (inventoryScanRemoveBtn) {
    inventoryScanRemoveBtn.addEventListener('click', () => runInventoryScanAction('remove'));
  }

  if (inventoryPrintScannedLabelBtn) {
    inventoryPrintScannedLabelBtn.addEventListener('click', async () => {
      try {
        await printInventoryLabelFromScannerContext();
      } catch (error) {
        setInventoryScanResult(error.message || 'Tisk štítku selhal.', 'error');
      }
    });
  }

  if (inventoryGenerateMissingBarcodesBtn) {
    inventoryGenerateMissingBarcodesBtn.addEventListener('click', () => {
      generateMissingInventoryBarcodes();
    });
  }

  if (inventoryExportVisibleLabelsPdfBtn) {
    inventoryExportVisibleLabelsPdfBtn.addEventListener('click', async () => {
      try {
        await exportVisibleInventoryLabelsPdf();
      } catch (error) {
        setInventoryScanResult(error.message || 'Export PDF štítků selhal.', 'error');
      }
    });
  }

  if (inventoryExportMovementsCsvBtn) {
    inventoryExportMovementsCsvBtn.addEventListener('click', () => {
      exportInventoryMovementsCsv();
    });
  }

  if (inventoryExportMovementsPdfBtn) {
    inventoryExportMovementsPdfBtn.addEventListener('click', async () => {
      try {
        await exportInventoryMovementsPdf();
      } catch (error) {
        setInventoryScanResult(error.message || 'Export PDF pohybů selhal.', 'error');
      }
    });
  }

  if (inventoryClearMovementsBtn) {
    inventoryClearMovementsBtn.addEventListener('click', () => {
      clearInventoryMovements();
      setInventoryScanResult('Historie pohybů byla vymazána.', 'success');
    });
  }

  setInventoryScanResult('Čekám na první scan. Kód můžeš vložit ručně, nechat vygenerovat nebo rovnou vytisknout štítek.');
  renderInventoryMovements();

  document.getElementById('statusFilter').addEventListener('change', renderOrders);
  document.getElementById('typeFilter').addEventListener('change', renderOrders);
  document.getElementById('orderSearchFilter').addEventListener('input', renderOrders);

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
  document.getElementById('newUserRole').addEventListener('change', (event) => {
    syncUserAccessControls('newUser', event.target.value || 'manager');
  });
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
  document.getElementById('editUserRole').addEventListener('change', (event) => {
    syncUserAccessControls('editUser', event.target.value || 'manager');
  });
  document.getElementById('closeEditUserModalBtn').addEventListener('click', closeEditUserModal);
  document.getElementById('cancelEditUserBtn').addEventListener('click', closeEditUserModal);
  document.getElementById('closeOrderFullscreenBtn').addEventListener('click', closeOrderFullscreen);
  document.getElementById('closeManualOrderModalBtn').addEventListener('click', closeOrderOpsModals);
  document.getElementById('closeInvoiceModalBtn').addEventListener('click', closeOrderOpsModals);
  document.getElementById('closeSettingsModalBtn').addEventListener('click', closeSettingsModal);
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
  if (settingsModal) {
    settingsModal.addEventListener('click', (event) => {
      if (event.target === settingsModal) {
        closeSettingsModal();
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
      await syncInventoryMovementsFromApi();
      await loadUsers();
      startPolling();
      showToast('Relace obnovena');
      return;
    } catch {
      state.token = '';
      state.inventoryMovementsSynced = false;
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
      await syncInventoryMovementsFromApi();
      await loadUsers();
      startPolling();
      showToast('Automatické přihlášení úspěšné');
      return;
    } catch {
      state.token = '';
      state.inventoryMovementsSynced = false;
      localStorage.removeItem('ezfixDesktopRememberedToken');
      localStorage.removeItem('ezfixDesktopRememberedUser');
    }
  }

  refreshFeatureTabsVisibility();
  setConnectedUi(false);
}

bootstrap();
