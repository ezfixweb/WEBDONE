const APP_CONFIG = {
    apiBase: window.location.origin,
    catalogKey: 'main',
    lowStockThresholdDefault: 3,
    historyMaxEntries: 500,
    storage: {
        token: 'token',
        settings: 'warehouse_mobile_settings_v1',
        history: 'warehouse_mobile_history_v1',
        localCatalog: 'warehouse_mobile_catalog_v1'
    },
    categories: [
        { key: 'printers', label: 'Tiskarny' },
        { key: 'filaments', label: 'Filamenty' },
        { key: 'pcBuildParts', label: 'PC dily' },
        { key: 'otherItems', label: 'Ostatni' },
        { key: 'otherCustomItems', label: 'Dalsi (Other)' },
        { key: 'usedShopItems', label: 'Bazar' }
    ]
};

const DOM = {
    searchInput: document.getElementById('searchInput'),
    focusScanBtn: document.getElementById('focusScanBtn'),
    categoryFilter: document.getElementById('categoryFilter'),
    stockFilter: document.getElementById('stockFilter'),
    refreshBtn: document.getElementById('refreshBtn'),
    syncNowBtn: document.getElementById('syncNowBtn'),
    syncNowBtnSecondary: document.getElementById('syncNowBtnSecondary'),
    clearHistoryBtn: document.getElementById('clearHistoryBtn'),

    statusMessage: document.getElementById('statusMessage'),
    syncStatus: document.getElementById('syncStatus'),

    totalCount: document.getElementById('totalCount'),
    activeCount: document.getElementById('activeCount'),
    lowCount: document.getElementById('lowCount'),
    zeroCount: document.getElementById('zeroCount'),

    inventoryList: document.getElementById('inventoryList'),
    emptyMessage: document.getElementById('emptyMessage'),

    historySummary: document.getElementById('historySummary'),
    historyList: document.getElementById('historyList'),

    lowThresholdInput: document.getElementById('lowThresholdInput'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn'),

    loginIdentifier: document.getElementById('loginIdentifier'),
    loginPassword: document.getElementById('loginPassword'),
    loginBtn: document.getElementById('loginBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
    authMessage: document.getElementById('authMessage'),

    tabStock: document.getElementById('tabStock'),
    tabHistory: document.getElementById('tabHistory'),
    tabSettings: document.getElementById('tabSettings'),
    stockView: document.getElementById('stockView'),
    historyView: document.getElementById('historyView'),
    settingsView: document.getElementById('settingsView')
};

const STATE = {
    catalog: null,
    items: [],
    search: '',
    categoryFilter: 'all',
    stockFilter: 'all',
    lowThreshold: APP_CONFIG.lowStockThresholdDefault,
    history: [],
    isDirty: false,
    syncing: false
};

function loadSettings() {
    try {
        const raw = localStorage.getItem(APP_CONFIG.storage.settings);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (Number.isFinite(parsed.lowThreshold) && parsed.lowThreshold >= 0) {
            STATE.lowThreshold = Math.floor(parsed.lowThreshold);
        }
    } catch {
        // Ignore malformed settings.
    }
}

function saveSettings() {
    localStorage.setItem(APP_CONFIG.storage.settings, JSON.stringify({
        lowThreshold: STATE.lowThreshold
    }));
}

function loadHistory() {
    try {
        const raw = localStorage.getItem(APP_CONFIG.storage.history);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            STATE.history = parsed.slice(0, APP_CONFIG.historyMaxEntries);
        }
    } catch {
        // Ignore malformed history.
    }
}

function saveHistory() {
    localStorage.setItem(
        APP_CONFIG.storage.history,
        JSON.stringify(STATE.history.slice(0, APP_CONFIG.historyMaxEntries))
    );
}

function setToken(token) {
    if (token) {
        localStorage.setItem(APP_CONFIG.storage.token, token);
    } else {
        localStorage.removeItem(APP_CONFIG.storage.token);
    }
}

function getToken() {
    return localStorage.getItem(APP_CONFIG.storage.token);
}

function setStatus(message, isError = false) {
    if (!DOM.statusMessage) return;
    DOM.statusMessage.textContent = message;
    DOM.statusMessage.style.color = isError ? '#ef4444' : '#9fb0ce';
}

function setSyncStatus(message, isError = false) {
    if (!DOM.syncStatus) return;
    DOM.syncStatus.textContent = `Synchronizace: ${message}`;
    DOM.syncStatus.style.color = isError ? '#ef4444' : '#9fb0ce';
}

function setAuthMessage(message, isError = false) {
    if (!DOM.authMessage) return;
    DOM.authMessage.textContent = message;
    DOM.authMessage.style.color = isError ? '#ef4444' : '#9fb0ce';
}

function authHeaders() {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}

function toApiUrl(path) {
    const normalized = String(path || '').replace(/^\/*/, '/');
    return `${APP_CONFIG.apiBase}${normalized}`;
}

async function apiJson(path, options = {}) {
    const method = options.method || 'GET';
    const headers = {
        'Content-Type': 'application/json',
        ...authHeaders(),
        ...(options.headers || {})
    };

    const response = await fetch(toApiUrl(path), {
        method,
        headers,
        body: options.body !== undefined
            ? JSON.stringify(options.body)
            : undefined
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.success === false) {
        throw new Error(payload.message || `HTTP ${response.status}`);
    }
    return payload;
}

function categoryLabelByKey(key) {
    const found = APP_CONFIG.categories.find((entry) => entry.key === key);
    return found ? found.label : key;
}

function normalizeItems(catalog) {
    const printing = catalog?.printing || {};
    const out = [];

    APP_CONFIG.categories.forEach((category) => {
        const list = Array.isArray(printing[category.key]) ? printing[category.key] : [];
        list.forEach((item, index) => {
            out.push({
                categoryKey: category.key,
                categoryLabel: category.label,
                index,
                ref: item,
                id: String(item.id || `${category.key}-${index}`),
                name: String(item.name || item.id || 'Bez nazvu'),
                barcode: String(item.barcode || '').trim(),
                price: Number(item.price || 0),
                qty: Number.isFinite(Number(item.qty)) ? Number(item.qty) : 0,
                active: item.active !== false
            });
        });
    });

    return out;
}

function getFilteredItems() {
    const q = STATE.search.trim().toLowerCase();
    return STATE.items.filter((item) => {
        if (STATE.categoryFilter !== 'all' && item.categoryKey !== STATE.categoryFilter) {
            return false;
        }

        if (STATE.stockFilter === 'low' && !(item.qty > 0 && item.qty <= STATE.lowThreshold)) {
            return false;
        }

        if (STATE.stockFilter === 'zero' && item.qty !== 0) {
            return false;
        }

        if (!q) return true;
        return item.name.toLowerCase().includes(q)
            || item.id.toLowerCase().includes(q)
            || item.barcode.toLowerCase().includes(q)
            || item.categoryLabel.toLowerCase().includes(q);
    });
}

function qtyClass(qty) {
    if (qty <= 0) return 'zero';
    if (qty <= STATE.lowThreshold) return 'low';
    return 'ok';
}

function renderCategoryFilter() {
    const options = ['<option value="all">Vsechny kategorie</option>'];
    APP_CONFIG.categories.forEach((category) => {
        options.push(`<option value="${category.key}">${category.label}</option>`);
    });

    DOM.categoryFilter.innerHTML = options.join('');
    DOM.categoryFilter.value = STATE.categoryFilter;
}

function renderStats() {
    const total = STATE.items.length;
    const active = STATE.items.filter((item) => item.active).length;
    const low = STATE.items.filter((item) => item.qty > 0 && item.qty <= STATE.lowThreshold).length;
    const zero = STATE.items.filter((item) => item.qty <= 0).length;

    DOM.totalCount.textContent = String(total);
    DOM.activeCount.textContent = String(active);
    DOM.lowCount.textContent = String(low);
    DOM.zeroCount.textContent = String(zero);
}

function renderItems() {
    const filtered = getFilteredItems();

    if (filtered.length === 0) {
        DOM.inventoryList.innerHTML = '';
        DOM.emptyMessage.classList.remove('hidden');
        setStatus('Nenalezena zadna polozka pro zadany filtr.');
        return;
    }

    DOM.emptyMessage.classList.add('hidden');
    DOM.inventoryList.innerHTML = filtered.map((item) => `
        <li class="item" data-id="${item.id}">
            <div class="item-head">
                <div>
                    <div class="item-name">${escapeHtml(item.name)}</div>
                    <div class="item-meta">
                        <span>ID: ${escapeHtml(item.id)}</span>
                        <span>${escapeHtml(item.categoryLabel)}</span>
                        <span>${item.barcode ? `Barcode: ${escapeHtml(item.barcode)}` : 'Bez barcode'}</span>
                        <span>Cena: ${formatMoney(item.price)}</span>
                    </div>
                </div>
                <div class="qty ${qtyClass(item.qty)}">${item.qty} ks</div>
            </div>
            <div class="item-actions">
                <button class="bad" data-action="delta" data-delta="-5">-5</button>
                <button class="bad" data-action="delta" data-delta="-1">-1</button>
                <button data-action="set">Nastavit</button>
                <button class="good" data-action="delta" data-delta="1">+1</button>
                <button class="good" data-action="delta" data-delta="5">+5</button>
                <button class="warn" data-action="quick-count">Inventura</button>
            </div>
        </li>
    `).join('');

    setStatus(`Zobrazeno ${filtered.length} polozek.`);
}

function renderHistory() {
    DOM.historySummary.textContent = `Historie: ${STATE.history.length} zaznamu`;

    if (STATE.history.length === 0) {
        DOM.historyList.innerHTML = '<li class="history-item">Zatim bez pohybu skladu.</li>';
        return;
    }

    DOM.historyList.innerHTML = STATE.history.map((entry) => `
        <li class="history-item">
            <div><strong>${escapeHtml(entry.itemName)}</strong> (${escapeHtml(entry.itemId)})</div>
            <div>${escapeHtml(entry.action)}: ${entry.before} -> ${entry.after} (zmena ${entry.delta >= 0 ? '+' : ''}${entry.delta})</div>
            <div class="muted">${new Date(entry.ts).toLocaleString('cs-CZ')}</div>
        </li>
    `).join('');
}

function persistLocalCatalog() {
    if (!STATE.catalog) return;
    localStorage.setItem(APP_CONFIG.storage.localCatalog, JSON.stringify({
        ts: Date.now(),
        catalog: STATE.catalog
    }));
}

function addHistoryEntry(entry) {
    STATE.history.unshift(entry);
    if (STATE.history.length > APP_CONFIG.historyMaxEntries) {
        STATE.history = STATE.history.slice(0, APP_CONFIG.historyMaxEntries);
    }
    saveHistory();
    renderHistory();
}

function updateItemReference(item, nextQty) {
    item.qty = nextQty;
    item.ref.qty = nextQty;
}

function applyStockDelta(item, delta, actionLabel) {
    const before = Number(item.qty || 0);
    const after = Math.max(0, before + delta);

    if (before === after) return;

    updateItemReference(item, after);
    STATE.isDirty = true;
    persistLocalCatalog();

    addHistoryEntry({
        itemId: item.id,
        itemName: item.name,
        action: actionLabel,
        before,
        after,
        delta,
        ts: Date.now()
    });

    renderStats();
    renderItems();
    setSyncStatus('neulozeno (cekaji zmeny)', true);
}

function setItemQuantity(item, targetQty, actionLabel) {
    const safeTarget = Math.max(0, Math.floor(Number(targetQty || 0)));
    const delta = safeTarget - Number(item.qty || 0);
    if (delta === 0) return;
    applyStockDelta(item, delta, actionLabel);
}

async function syncCatalogToServer() {
    if (!STATE.catalog) return;
    if (STATE.syncing) return;

    STATE.syncing = true;
    setSyncStatus('ukladam na server...');

    try {
        await apiJson('/api/catalog/backup', {
            method: 'POST',
            body: {
                catalog: STATE.catalog,
                source: 'mobile-warehouse'
            }
        });
        STATE.isDirty = false;
        setSyncStatus('ulozeno');
    } catch (error) {
        setSyncStatus(`chyba: ${error.message}`, true);
    } finally {
        STATE.syncing = false;
    }
}

function playScanFeedback(success = true) {
    try {
        if (navigator.vibrate) {
            navigator.vibrate(success ? 30 : [40, 40, 40]);
        }
    } catch {
        // Ignore vibration errors.
    }
}

function prepareNextScan(clearSearch = true) {
    if (clearSearch) {
        STATE.search = '';
        DOM.searchInput.value = '';
        renderItems();
    }
    focusSearchInput();
}

function findBestScanMatch(code) {
    const needle = String(code || '').trim().toLowerCase();
    if (!needle) return { item: null, ambiguous: false };

    const byBarcode = STATE.items.filter((item) => String(item.barcode || '').toLowerCase() === needle);
    if (byBarcode.length === 1) return { item: byBarcode[0], ambiguous: false };
    if (byBarcode.length > 1) return { item: null, ambiguous: true };

    const byId = STATE.items.filter((item) => String(item.id || '').toLowerCase() === needle);
    if (byId.length === 1) return { item: byId[0], ambiguous: false };
    if (byId.length > 1) return { item: null, ambiguous: true };

    const byContains = STATE.items.filter((item) => {
        const haystack = [item.name, item.id, item.barcode].map((v) => String(v || '').toLowerCase());
        return haystack.some((part) => part.includes(needle));
    });
    if (byContains.length === 1) return { item: byContains[0], ambiguous: false };
    if (byContains.length > 1) return { item: null, ambiguous: true };

    return { item: null, ambiguous: false };
}

function parseScanOperation(rawInput) {
    const raw = String(rawInput || '').trim();
    if (!raw) return null;

    if (/^[+-]\d+$/.test(raw)) {
        const delta = Number(raw);
        if (!Number.isFinite(delta)) return null;
        return { type: 'delta', value: delta };
    }

    const setMatch = raw.match(/^=(\d+)$/);
    if (setMatch) {
        const qty = Number(setMatch[1]);
        if (!Number.isFinite(qty)) return null;
        return { type: 'set', value: qty };
    }

    return null;
}

function promptScanOperation(item, scannedCode) {
    const help = [
        `Polozka: ${item.name}`,
        `Naskenovano: ${scannedCode}`,
        `Aktualni stav: ${item.qty} ks`,
        '',
        'Zadej akci:',
        '+1 nebo +5 = prijem',
        '-1 nebo -5 = vydej',
        '=12 = inventura (nastavit presny pocet)',
        '',
        'Vychozi hodnota je +1'
    ].join('\n');

    while (true) {
        const raw = prompt(help, '+1');
        if (raw === null) return null;

        const operation = parseScanOperation(raw);
        if (operation) return operation;

        alert('Neplatny format. Pouzij +1, -1 nebo =12.');
    }
}

function handleWarehouseScan(rawCode) {
    const code = String(rawCode || '').trim();
    if (!code) return;

    const match = findBestScanMatch(code);
    if (match.item) {
        const item = match.item;
        const operation = promptScanOperation(item, code);

        if (!operation) {
            setStatus(`Sken stornovan: ${code}`);
            playScanFeedback(false);
            prepareNextScan(false);
            return;
        }

        if (operation.type === 'delta') {
            const label = operation.value >= 0 ? 'Prijem (scan)' : 'Vydej (scan)';
            applyStockDelta(item, operation.value, label);
            setStatus(`${item.name}: ${operation.value >= 0 ? '+' : ''}${operation.value} ks`);
        } else if (operation.type === 'set') {
            setItemQuantity(item, operation.value, 'Inventura (scan)');
            setStatus(`${item.name}: nastaveno na ${operation.value} ks`);
        }

        playScanFeedback(true);
        prepareNextScan(true);
        return;
    }

    DOM.searchInput.value = code;
    STATE.search = code;
    renderItems();

    if (match.ambiguous) {
        setStatus(`Kod ${code} odpovida vice polozkam. Upresni hledani nebo pouzij ID.`, true);
    } else {
        setStatus(`Kod ${code} nebyl nalezen.`, true);
    }
    playScanFeedback(false);
    focusSearchInput();
}

window.handleWarehouseScan = handleWarehouseScan;
window.filterInventory = handleWarehouseScan;

async function loadCatalog() {
    setStatus('Nacitam sklad...');

    let remoteCatalog = null;
    try {
        const payload = await apiJson('/api/catalog');
        remoteCatalog = payload.catalog || null;
    } catch (error) {
        setStatus(`Nepodarilo se nacist server: ${error.message}`, true);
    }

    let fallbackCatalog = null;
    try {
        const localRaw = localStorage.getItem(APP_CONFIG.storage.localCatalog);
        if (localRaw) {
            fallbackCatalog = JSON.parse(localRaw)?.catalog || null;
        }
    } catch {
        // Ignore invalid local cache.
    }

    STATE.catalog = remoteCatalog || fallbackCatalog;

    if (!STATE.catalog) {
        STATE.items = [];
        renderStats();
        renderItems();
        setStatus('Sklad zatim nema data.');
        return;
    }

    STATE.items = normalizeItems(STATE.catalog);
    renderStats();
    renderItems();

    if (STATE.isDirty) {
        setSyncStatus('neulozeno (cekaji zmeny)', true);
    } else {
        setSyncStatus(remoteCatalog ? 'synchronizovano' : 'lokalni data');
    }

    setStatus(`Sklad nacten. Polozek: ${STATE.items.length}.`);
}

function focusSearchInput() {
    DOM.searchInput.focus();
    DOM.searchInput.select();
}

async function login() {
    const username = String(DOM.loginIdentifier.value || '').trim();
    const password = String(DOM.loginPassword.value || '');

    if (!username || !password) {
        setAuthMessage('Vypln uzivatele a heslo.', true);
        return;
    }

    try {
        const result = await apiJson('/api/auth/login', {
            method: 'POST',
            body: { username, password }
        });

        setToken(result.token || '');
        setAuthMessage(`Prihlasen: ${result?.user?.username || username}`);
    } catch (error) {
        setAuthMessage(`Prihlaseni selhalo: ${error.message}`, true);
    }
}

function logout() {
    setToken(null);
    setAuthMessage('Odhlasen.');
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function formatMoney(value) {
    return new Intl.NumberFormat('cs-CZ', {
        style: 'currency',
        currency: 'CZK',
        maximumFractionDigits: 2
    }).format(Number(value || 0));
}

function switchTab(target) {
    const views = [DOM.stockView, DOM.historyView, DOM.settingsView];
    views.forEach((view) => view.classList.add('hidden'));

    DOM.tabStock.classList.remove('active');
    DOM.tabHistory.classList.remove('active');
    DOM.tabSettings.classList.remove('active');

    if (target === 'stock') {
        DOM.stockView.classList.remove('hidden');
        DOM.tabStock.classList.add('active');
        focusSearchInput();
        return;
    }

    if (target === 'history') {
        DOM.historyView.classList.remove('hidden');
        DOM.tabHistory.classList.add('active');
        renderHistory();
        return;
    }

    DOM.settingsView.classList.remove('hidden');
    DOM.tabSettings.classList.add('active');
}

function bindInventoryActions() {
    DOM.inventoryList.addEventListener('click', (event) => {
        const button = event.target.closest('button');
        if (!button) return;

        const card = button.closest('[data-id]');
        if (!card) return;

        const itemId = card.getAttribute('data-id');
        const item = STATE.items.find((entry) => entry.id === itemId);
        if (!item) return;

        const action = button.getAttribute('data-action');

        if (action === 'delta') {
            const delta = Number(button.getAttribute('data-delta') || 0);
            const label = delta > 0 ? 'Prijem' : 'Vydej';
            applyStockDelta(item, delta, label);
            return;
        }

        if (action === 'set') {
            const raw = prompt(`Nastavit sklad pro ${item.name}:`, String(item.qty));
            if (raw === null) return;
            const nextValue = Number(raw);
            if (!Number.isFinite(nextValue) || nextValue < 0) {
                setStatus('Neplatna hodnota skladu.', true);
                return;
            }
            setItemQuantity(item, nextValue, 'Rucni nastaveni');
            return;
        }

        if (action === 'quick-count') {
            const raw = prompt(`Inventura: skutecny pocet pro ${item.name}:`, String(item.qty));
            if (raw === null) return;
            const counted = Number(raw);
            if (!Number.isFinite(counted) || counted < 0) {
                setStatus('Neplatna hodnota inventury.', true);
                return;
            }
            setItemQuantity(item, counted, 'Inventura');
        }
    });
}

function bindEvents() {
    DOM.searchInput.addEventListener('input', (event) => {
        STATE.search = String(event.target.value || '');
        renderItems();
    });

    DOM.searchInput.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        handleWarehouseScan(DOM.searchInput.value || '');
    });

    DOM.categoryFilter.addEventListener('change', () => {
        STATE.categoryFilter = DOM.categoryFilter.value || 'all';
        renderItems();
    });

    DOM.stockFilter.addEventListener('change', () => {
        STATE.stockFilter = DOM.stockFilter.value || 'all';
        renderItems();
    });

    DOM.refreshBtn.addEventListener('click', async () => {
        await loadCatalog();
    });

    DOM.syncNowBtn.addEventListener('click', async () => {
        await syncCatalogToServer();
    });

    DOM.syncNowBtnSecondary?.addEventListener('click', async () => {
        await syncCatalogToServer();
    });

    DOM.clearHistoryBtn.addEventListener('click', () => {
        const confirmClear = confirm('Opravdu vycistit historii pohybu?');
        if (!confirmClear) return;
        STATE.history = [];
        saveHistory();
        renderHistory();
    });

    DOM.focusScanBtn.addEventListener('click', () => {
        focusSearchInput();
        setStatus('Sken rezim aktivni: kurzor je v hledani.');
    });

    DOM.saveSettingsBtn.addEventListener('click', () => {
        const next = Number(DOM.lowThresholdInput.value || APP_CONFIG.lowStockThresholdDefault);
        if (!Number.isFinite(next) || next < 0) {
            setStatus('Limit nizke zasoby musi byt >= 0', true);
            return;
        }
        STATE.lowThreshold = Math.floor(next);
        saveSettings();
        renderStats();
        renderItems();
        setStatus('Nastaveni ulozeno.');
    });

    DOM.loginBtn.addEventListener('click', async () => {
        await login();
    });

    DOM.logoutBtn.addEventListener('click', () => {
        logout();
    });

    DOM.tabStock.addEventListener('click', () => switchTab('stock'));
    DOM.tabHistory.addEventListener('click', () => switchTab('history'));
    DOM.tabSettings.addEventListener('click', () => switchTab('settings'));

    document.addEventListener('visibilitychange', async () => {
        if (document.visibilityState === 'visible' && STATE.isDirty) {
            await syncCatalogToServer();
        }
    });
}

async function initialize() {
    loadSettings();
    loadHistory();

    DOM.lowThresholdInput.value = String(STATE.lowThreshold);
    renderCategoryFilter();
    bindEvents();
    bindInventoryActions();

    switchTab('stock');
    await loadCatalog();
    renderHistory();

    focusSearchInput();
}

window.addEventListener('DOMContentLoaded', () => {
    initialize().catch((error) => {
        setStatus(`Chyba inicializace: ${error.message}`, true);
    });
});
