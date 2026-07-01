'use strict';

const path = require('path');

// Lazy-loaded printer to avoid startup crash if pdfmake is missing
let _printer = null;

function getPrinter() {
    if (_printer) return _printer;
    const PdfPrinter = require('pdfmake');
    const fontsDir = path.join(
        path.dirname(require.resolve('pdfmake/package.json')),
        'fonts', 'Roboto'
    );
    _printer = new PdfPrinter({
        Roboto: {
            normal:      path.join(fontsDir, 'Roboto-Regular.ttf'),
            bold:        path.join(fontsDir, 'Roboto-Medium.ttf'),
            italics:     path.join(fontsDir, 'Roboto-Italic.ttf'),
            bolditalics: path.join(fontsDir, 'Roboto-MediumItalic.ttf')
        }
    });
    return _printer;
}

function formatCurrency(value) {
    const num = typeof value === 'number' ? value : parseFloat(value);
    const safeValue = Number.isFinite(num) ? num : 0;
    return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' }).format(safeValue);
}

function formatDate(date) {
    const d = date instanceof Date ? date : new Date(date || Date.now());
    if (isNaN(d.getTime())) return new Date().toLocaleDateString('cs-CZ');
    return d.toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function buildInvoiceNumber() {
    const now = new Date();
    const yr = now.getFullYear();
    const mo = String(now.getMonth() + 1).padStart(2, '0');
    const dy = String(now.getDate()).padStart(2, '0');
    const rnd = Math.floor(1000 + Math.random() * 9000);
    return `INV-${yr}${mo}${dy}-${rnd}`;
}

const PURPLE = '#667eea';
const GRAY   = '#6b7280';
const LIGHT  = '#f9fafb';
const DARK   = '#374151';
const DIVIDER_COLOR = '#e5e7eb';

/**
 * Generates an invoice PDF as a Buffer.
 * @param {object} order   – order row from DB (customer_name, customer_email, etc.)
 * @param {array}  items   – order_items rows
 * @returns {Promise<Buffer>}
 */
function generateInvoicePdf(order, items = []) {
    return new Promise((resolve, reject) => {
        try {
            const issueDate = new Date();
            const dueDate   = new Date();
            dueDate.setDate(dueDate.getDate() + 14);

            const invoiceNumber  = buildInvoiceNumber();
            const variableSymbol = String(order.order_number || '').replace(/\D/g, '').slice(-10);
            const safeItems = Array.isArray(items) ? items : [];
            const total = Number(order.total) ||
                safeItems.reduce((s, i) => s + Number(i.price || 0), 0);

            // ── Items table rows ──────────────────────────────────────────────
            const itemRows = safeItems.length > 0
                ? safeItems.map(item => {
                    const qty   = Number(item.parts || item.quantity || 1);
                    const price = Number(item.price || 0);
                    const name  = item.repair_name || item.repair_type || 'Oprava';
                    const detail = [item.brand, item.model].filter(Boolean).join(' ');
                    return [
                        {
                            stack: [
                                { text: name, bold: true, fontSize: 9 },
                                detail ? { text: detail, fontSize: 8, color: GRAY } : {}
                            ]
                        },
                        { text: String(qty), alignment: 'center', fontSize: 9 },
                        { text: formatCurrency(price), alignment: 'right', fontSize: 9 },
                        { text: formatCurrency(qty * price), alignment: 'right', fontSize: 9, bold: true }
                    ];
                })
                : [[
                    { text: 'Oprava', bold: true, fontSize: 9 },
                    { text: '1', alignment: 'center', fontSize: 9 },
                    { text: formatCurrency(total), alignment: 'right', fontSize: 9 },
                    { text: formatCurrency(total), alignment: 'right', fontSize: 9, bold: true }
                ]];

            // ── Customer info ─────────────────────────────────────────────────
            const customerLines = [
                order.customer_name,
                order.customer_email,
                order.customer_phone,
                [order.customer_address, order.customer_city, order.customer_zip, order.country]
                    .filter(Boolean).join(', ')
            ].filter(Boolean);

            // ── Document definition ───────────────────────────────────────────
            const docDefinition = {
                pageSize:    'A4',
                pageMargins: [40, 40, 40, 55],
                defaultStyle: { font: 'Roboto', fontSize: 10, color: DARK },

                content: [
                    // ── Header bar ──
                    {
                        table: {
                            widths: ['*', 'auto'],
                            body: [[
                                { text: 'FAKTURA', fontSize: 24, bold: true, color: 'white', margin: [10, 10, 0, 10] },
                                { text: invoiceNumber, fontSize: 11, color: 'white', alignment: 'right', margin: [0, 14, 10, 10] }
                            ]]
                        },
                        layout: { fillColor: () => PURPLE, hLineWidth: () => 0, vLineWidth: () => 0 },
                        margin: [0, 0, 0, 20]
                    },

                    // ── Supplier / Customer columns ──
                    {
                        columns: [
                            {
                                width: '48%',
                                stack: [
                                    { text: 'Dodavatel', bold: true, fontSize: 11, margin: [0, 0, 0, 4] },
                                    { text: 'EzFix', bold: true, fontSize: 13, color: PURPLE },
                                    { text: 'Web: ezfix.cz',                      fontSize: 9, color: GRAY },
                                    { text: 'E-mail: ezfix.podpora@gmail.com',     fontSize: 9, color: GRAY },
                                    { text: 'Telefon: +420 732 434 201',           fontSize: 9, color: GRAY }
                                ]
                            },
                            { width: '4%', text: '' },
                            {
                                width: '48%',
                                stack: [
                                    { text: 'Odběratel', bold: true, fontSize: 11, margin: [0, 0, 0, 4] },
                                    ...customerLines.map((line, i) => ({
                                        text:     line,
                                        bold:     i === 0,
                                        fontSize: i === 0 ? 13 : 9,
                                        color:    i === 0 ? PURPLE : GRAY
                                    }))
                                ]
                            }
                        ],
                        margin: [0, 0, 0, 14]
                    },

                    // ── Divider ──
                    { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: DIVIDER_COLOR }], margin: [0, 0, 0, 10] },

                    // ── Invoice meta ──
                    {
                        columns: [
                            {
                                width: '50%',
                                stack: [
                                    { text: [{ text: 'Datum vystavení: ', bold: true }, formatDate(issueDate)], fontSize: 9 },
                                    { text: [{ text: 'Datum splatnosti: ', bold: true }, formatDate(dueDate)],  fontSize: 9 }
                                ]
                            },
                            {
                                width: '50%',
                                stack: [
                                    { text: [{ text: 'Variabilní symbol: ', bold: true }, variableSymbol],            fontSize: 9 },
                                    { text: [{ text: 'Číslo objednávky: ',  bold: true }, order.order_number || ''],  fontSize: 9 }
                                ]
                            }
                        ],
                        margin: [0, 0, 0, 14]
                    },

                    // ── Items table ──
                    {
                        table: {
                            headerRows: 1,
                            widths: ['*', 45, 75, 75],
                            body: [
                                [
                                    { text: 'Položka',  bold: true, color: 'white', fontSize: 9, margin: [2, 4, 2, 4] },
                                    { text: 'Kusy',     bold: true, color: 'white', fontSize: 9, alignment: 'center', margin: [2, 4, 2, 4] },
                                    { text: 'Cena/ks',  bold: true, color: 'white', fontSize: 9, alignment: 'right',  margin: [2, 4, 2, 4] },
                                    { text: 'Celkem',   bold: true, color: 'white', fontSize: 9, alignment: 'right',  margin: [2, 4, 2, 4] }
                                ],
                                ...itemRows
                            ]
                        },
                        layout: {
                            fillColor: (rowIndex) => rowIndex === 0 ? PURPLE : (rowIndex % 2 === 0 ? LIGHT : null),
                            hLineWidth: (i, node) => (i === 0 || i === node.table.body.length) ? 1 : 0.5,
                            vLineWidth: () => 0,
                            hLineColor: () => DIVIDER_COLOR,
                            paddingLeft:   () => 6,
                            paddingRight:  () => 6,
                            paddingTop:    () => 5,
                            paddingBottom: () => 5
                        },
                        margin: [0, 0, 0, 10]
                    },

                    // ── Total ──
                    {
                        columns: [
                            { width: '*', text: '' },
                            {
                                width: 'auto',
                                table: {
                                    body: [[
                                        { text: 'Celkem k úhradě:', bold: true, color: 'white', fontSize: 11, margin: [10, 7, 8, 7] },
                                        { text: formatCurrency(total), bold: true, color: 'white', fontSize: 11, alignment: 'right', margin: [8, 7, 10, 7] }
                                    ]]
                                },
                                layout: { fillColor: () => PURPLE, hLineWidth: () => 0, vLineWidth: () => 0 }
                            }
                        ],
                        margin: [0, 0, 0, order.notes ? 16 : 0]
                    },

                    // ── Notes ──
                    ...(order.notes ? [
                        { text: 'Poznámka:', bold: true, margin: [0, 0, 0, 4] },
                        { text: String(order.notes), color: GRAY, fontSize: 9 }
                    ] : [])
                ],

                styles: {},

                footer: (currentPage, pageCount) => ({
                    text: `© 2026 EzFix  ·  ezfix.cz  ·  ezfix.podpora@gmail.com  ·  +420 732 434 201  ·  Strana ${currentPage} z ${pageCount}`,
                    alignment: 'center',
                    fontSize: 8,
                    color: '#9ca3af',
                    margin: [40, 8, 40, 0]
                })
            };

            const pdfDoc = getPrinter().createPdfKitDocument(docDefinition);
            const chunks = [];
            pdfDoc.on('data', chunk => chunks.push(chunk));
            pdfDoc.on('end',  () => resolve(Buffer.concat(chunks)));
            pdfDoc.on('error', reject);
            pdfDoc.end();
        } catch (err) {
            reject(err);
        }
    });
}

module.exports = { generateInvoicePdf };
