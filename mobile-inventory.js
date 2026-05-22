const apiBase = window.location.origin;
const searchInput = document.getElementById('searchInput');
const inventoryList = document.getElementById('inventoryList');
const totalCount = document.getElementById('totalCount');
const activeCount = document.getElementById('activeCount');
const statusMessage = document.getElementById('statusMessage');
const refreshBtn = document.getElementById('refreshBtn');
const backupBtn = document.getElementById('backupBtn');
const emptyMessage = document.getElementById('emptyMessage');
const scanHelpBtn = document.getElementById('scanHelpBtn');
const desktopLinkBtn = document.getElementById('desktopLinkBtn');
const syncStatusSpan = document.getElementById('syncStatus');
const activeDevicesSpan = document.getElementById('activeDevices');

let catalog = null;
let inventoryItems = [];
let currentQuery = '';
let presenceTimer = null;
let activeVisitorsTimer = null;

function formatMoney(value) {
    return new Intl.NumberFormat('cs-CZ', {
        style: 'currency',
        currency: 'CZK',
        maximumFractionDigits: 2
    }).format(value);
}

function getApiUrl(path) {
    const normalized = String(path || '').replace(/^\/*/, '/');
    return `${apiBase}${normalized}`;
}

function normalizeInventory(catalogData) {
    if (!catalogData || typeof catalogData !== 'object') return [];
    const printing = catalogData.printing || {};
    const categories = [
        { key: 'printers', label: 'Tiskárny' },
        { key: 'filaments', label: 'Filamenty' },
        { key: 'pcBuildParts', label: 'PC díly' },
        { key: 'otherItems', label: 'Ostatní' },
        { key: 'otherCustomItems', label: 'Další (Other)' },
        { key: 'usedShopItems', label: 'Bazar' }
    ];

    return categories.flatMap((category) => {
        const items = Array.isArray(printing[category.key]) ? printing[category.key] : [];
        return items.map((item) => ({
            category: category.label,
            id: String(item.id || ''),
            name: String(item.name || item.id || ''),
            price: Number.isFinite(Number(item.price || 0)) ? Number(item.price || 0) : 0,
            qty: Number.isFinite(Number(item.qty || 0)) ? Number(item.qty || 0) : 0,
            barcode: String(item.barcode || '').trim(),
            active: item.active !== false
        }));
    });
}

function setStatus(message, isError = false) {
    statusMessage.textContent = message;
    statusMessage.style.color = isError ? '#fecaca' : '#c7d2fe';
}

function renderInventory(items) {
    inventoryList.innerHTML = '';
    if (!items || items.length === 0) {
        emptyMessage.classList.remove('hidden');
        return;
    }
    emptyMessage.classList.add('hidden');

    const fragment = document.createDocumentFragment();
    items.forEach((item) => {
        const li = document.createElement('li');
        li.className = 'mobile-inventory-item';

        li.innerHTML = `
            <h2>${item.name || 'Bez názvu'}</h2>
            <div class="mobile-inventory-item-meta">
                <span>Kategorie: ${item.category}</span>
                <span>Cena: ${formatMoney(item.price)}</span>
                <span>Množství: ${item.qty}</span>
                ${item.barcode ? `<span>Barcode: ${item.barcode}</span>` : '<span>Bez barcode</span>'}
                <span>${item.active ? 'Aktivní' : 'Neaktivní'}</span>
            </div>
            <div class="small">ID: ${item.id}</div>
        `;
        fragment.appendChild(li);
    });
    inventoryList.appendChild(fragment);
}

function updateSummary(items) {
    totalCount.textContent = inventoryItems.length;
    activeCount.textContent = inventoryItems.filter((item) => item.active).length;
    renderInventory(items);
}

function filterInventory(query) {
    const normalized = String(query || '').trim().toLowerCase();
    if (!normalized) {
        updateSummary(inventoryItems);
        return;
    }

    const filtered = inventoryItems.filter((item) => {
        return item.name.toLowerCase().includes(normalized)
            || item.id.toLowerCase().includes(normalized)
            || item.barcode.toLowerCase().includes(normalized)
            || item.category.toLowerCase().includes(normalized);
    });

    if (filtered.length === 0) {
        setStatus('Nenašla se žádná položka pro tento dotaz.', true);
    } else {
        setStatus(`Zobrazuji ${filtered.length} výsledků.`);
    }
    updateSummary(filtered);
}

async function loadCatalog() {
    setStatus('Načítám sklad…');
    try {
        const response = await fetch(getApiUrl('/api/catalog'));
        if (!response.ok) {
            throw new Error(`Server odpověděl kódem ${response.status}`);
        }
        const data = await response.json();
        if (data.success !== true || !data.catalog) {
            throw new Error(data.message || 'Neplatná odpověď serveru');
        }
        catalog = data.catalog;
        inventoryItems = normalizeInventory(catalog);
        setStatus(`Sklad načten. Celkem ${inventoryItems.length} položek.`);
        setSyncStatus('Synchronizováno s PC serverem.');
        filterInventory(currentQuery);
        triggerMobileCatalogBackup();
    } catch (error) {
        setStatus(`Chyba načtení skladu: ${error.message}`, true);
        setSyncStatus('Synchronizace selhala.', true);
        inventoryList.innerHTML = '';
        emptyMessage.classList.remove('hidden');
    }
}

function setSyncStatus(message, isError = false) {
    if (syncStatusSpan) {
        syncStatusSpan.textContent = message;
        syncStatusSpan.style.color = isError ? '#fecaca' : '#c7d2fe';
    }
}

async function sendPresenceHeartbeat() {
    try {
        await fetch(getApiUrl('/api/presence/heartbeat'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ visitorId: `mobile-${navigator.userAgent}-${window.location.hostname}` })
        });
        setSyncStatus('Online a synchronizováno.');
    } catch (error) {
        setSyncStatus('Nepodařilo se odeslat heartbeat.', true);
    }
}

async function sendCatalogBackup(catalogData) {
    if (!catalogData || typeof catalogData !== 'object') return;
    try {
        await fetch(getApiUrl('/api/catalog/backup'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ catalog: catalogData, source: 'mobile-client' })
        });
        setSyncStatus('Záloha na PC úspěšně odeslána.');
    } catch (error) {
        setSyncStatus('Nepodařilo se odeslat zálohu na PC.', true);
    }
}

function triggerMobileCatalogBackup() {
    if (!catalog) return;
    sendCatalogBackup(catalog);
}

async function refreshActiveDevices() {
    try {
        const response = await fetch(getApiUrl('/api/presence/active'));
        if (!response.ok) {
            throw new Error('Status serveru neodpověděl');
        }
        const data = await response.json();
        if (data && typeof data.activeVisitors === 'number') {
            if (activeDevicesSpan) {
                activeDevicesSpan.textContent = `Připojeno zařízení: ${data.activeVisitors}`;
            }
        }
    } catch {
        if (activeDevicesSpan) {
            activeDevicesSpan.textContent = 'Nelze zjistit zapnutá zařízení';
        }
    }
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/mobile-sw.js').catch(() => {
            setSyncStatus('Service worker se nepodařilo zaregistrovat.', true);
        });
    }
}

function bindEvents() {
    searchInput.addEventListener('input', (event) => {
        currentQuery = event.target.value || '';
        filterInventory(currentQuery);
    });

    searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            searchInput.blur();
            filterInventory(currentQuery);
        }
    });

    refreshBtn.addEventListener('click', () => {
        loadCatalog();
    });

    if (backupBtn) {
        backupBtn.addEventListener('click', () => {
            if (!catalog) {
                setStatus('Sklad není načtený, nejprve obnov data.', true);
                return;
            }
            setStatus('Posílám zálohu na PC...');
            sendCatalogBackup(catalog);
        });
    }

    scanHelpBtn.addEventListener('click', () => {
        searchInput.focus();
        setStatus('Naskenuj barcode do pole výše a stiskni Enter.');
    });

    desktopLinkBtn.addEventListener('click', () => {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            window.location.href = 'http://localhost:3000';
        } else {
            setStatus('Odkaz na PC aplikaci je dostupný pouze při lokálním serveru.', true);
        }
    });
}

window.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    registerServiceWorker();
    loadCatalog();
    sendPresenceHeartbeat();
    refreshActiveDevices();
    presenceTimer = window.setInterval(sendPresenceHeartbeat, 45000);
    activeVisitorsTimer = window.setInterval(refreshActiveDevices, 15000);
    searchInput.focus();
});
