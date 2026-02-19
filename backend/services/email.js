/**
 * Email Service
 * Handles all email sending functionality
 */

const nodemailer = require('nodemailer');

const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER || '';
const emailPassword = process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS || process.env.SMTP_PASS || '';
const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpSecure = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
const emailConfigured = Boolean(emailUser && emailPassword);

function formatCurrency(value) {
    const num = typeof value === 'number' ? value : parseFloat(value);
    const safeValue = Number.isFinite(num) ? num : 0;
    return new Intl.NumberFormat('cs-CZ', {
        style: 'currency',
        currency: 'CZK'
    }).format(safeValue);
}

function formatServiceType(serviceType) {
    if (serviceType === 'pickup') return 'Vyzvednuti';
    if (serviceType === 'zasilkovna') return 'Zasilkovna';
    return 'Osobni predani';
}

function getDeliveryFeeLine(order) {
    const fee = typeof order.delivery_fee === 'number'
        ? order.delivery_fee
        : parseFloat(order.delivery_fee || 0);
    if (!fee || Number.isNaN(fee) || fee <= 0) return '';
    const label = order.service_type === 'zasilkovna'
        ? 'Poplatek za Zasilkovnu'
        : 'Poplatek za vyzvednuti';
    return `<p>${label}: <strong>${formatCurrency(fee)}</strong></p>`;
}

function getPacketaPointLine(order) {
    if (!order.packeta_point_json) return '';
    try {
        const point = JSON.parse(order.packeta_point_json);
        if (!point || !point.name) return '';
        const addressParts = [point.street, point.city, point.zip].filter(Boolean).join(', ');
        const text = addressParts ? `${point.name} - ${addressParts}` : point.name;
        return `<p><strong>Vydejni bod:</strong> ${text}</p>`;
    } catch {
        return '';
    }
}

/**
 * Configure email transporter
 * Using Gmail SMTP - ensure to enable "Less secure app access" or use App Passwords
 * Or use your own email service
 */
const transporter = nodemailer.createTransport(
    smtpHost
        ? {
            host: smtpHost,
            port: smtpPort,
            secure: smtpSecure,
            auth: {
                user: emailUser,
                pass: emailPassword
            }
        }
        : {
            service: 'gmail',
            auth: {
                user: emailUser,
                pass: emailPassword
            }
        }
);

// Verify transporter on startup to surface auth/connectivity issues early
if (emailConfigured) {
    transporter.verify()
        .then(() => {
            console.log('[EMAIL] SMTP transporter verified. Ready to send emails.');
        })
        .catch(err => {
            console.error('[EMAIL] SMTP transporter verification failed:', err && err.message ? err.message : err);
        });
} else {
    console.error('[EMAIL] SMTP is not configured. Set EMAIL_USER and EMAIL_PASSWORD (or EMAIL_PASS/SMTP_USER/SMTP_PASS).');
}

function ensureEmailConfigured(actionName) {
    if (emailConfigured) return null;
    const message = `[EMAIL] ${actionName} skipped: SMTP credentials are missing`;
    console.error(message);
    return {
        success: false,
        skipped: true,
        reason: 'smtp_not_configured',
        message
    };
}

/**
 * Send order confirmation email
 * @param {string} customerEmail - Customer email address
 * @param {string} customerName - Customer name
 * @param {string} orderNumber - Order number
 * @param {array} items - Array of order items with price
 * @param {number} total - Total order amount
 * @param {object} order - Full order object
 * @returns {Promise}
 */
async function sendOrderConfirmationEmail(customerEmail, customerName, orderNumber, items = [], total = 0, order = {}) {
    try {
    const skipped = ensureEmailConfigured('Order confirmation email');
    if (skipped) return skipped;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const encodedOrder = encodeURIComponent(orderNumber);
    const encodedEmail = encodeURIComponent(customerEmail);
    const trackUrl = `${frontendUrl}/#track?order=${encodedOrder}&email=${encodedEmail}`;
        // Build items HTML
        let itemsHTML = '';
        items.forEach((item, index) => {
            itemsHTML += `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px 0; text-align: left;">${item.repair_name}</td>
                    <td style="padding: 12px 0; text-align: left; color: #666; font-size: 14px;">${item.brand} ${item.model}</td>
                    <td style="padding: 12px 0; text-align: right; font-weight: bold;">${formatCurrency(item.price)}</td>
                </tr>
            `;
        });

        const emailHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; }
                    .order-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
                    .order-number { font-size: 24px; font-weight: bold; color: #667eea; margin: 10px 0; }
                    .items-table { width: 100%; margin: 20px 0; }
                    .items-table th { text-align: left; padding: 12px 0; border-bottom: 2px solid #667eea; font-weight: bold; }
                    .total-row { margin-top: 15px; padding-top: 15px; border-top: 2px solid #e5e7eb; text-align: right; }
                    .total-amount { font-size: 20px; font-weight: bold; color: #667eea; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                    .button { background: #667eea; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; margin-top: 15px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Potvrzeni objednavky</h1>
                    </div>
                    <div class="content">
                        <p>Dobry den ${customerName},</p>
                        <p>Dekujeme za objednavku u EzFix! Vasi zadost jsme prijali a co nejdrive se ji budeme venovat.</p>
                        
                        <div class="order-box">
                            <h3>Cislo objednavky</h3>
                            <div class="order-number">#${orderNumber}</div>
                            <p><strong>Datum objednavky:</strong> ${order.created_at ? new Date(order.created_at).toLocaleDateString() : new Date().toLocaleDateString()}</p>
                            <p><strong>Typ sluzby:</strong> ${formatServiceType(order.service_type)}</p>
                            ${getPacketaPointLine(order)}
                        </div>

                        <div class="order-box">
                            <h3>Polozky</h3>
                            <table class="items-table">
                                <thead>
                                    <tr>
                                        <th>Oprava</th>
                                        <th>Zarizeni</th>
                                        <th>Cena</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${itemsHTML}
                                </tbody>
                            </table>
                            <div class="total-row">
                                <p>Mezisoucet: <strong>${formatCurrency(items.reduce((sum, item) => sum + item.price, 0))}</strong></p>
                                ${getDeliveryFeeLine(order)}
                                <p class="total-amount">Celkem: ${formatCurrency(total)}</p>
                            </div>
                        </div>

                        <p>O stavu opravy vas budeme prubezne informovat. Objednavku muzete kdykoliv sledovat na strance pro sledovani objednavek.</p>
                        <p>
                            <a href="${trackUrl}" class="button">Sledovat objednavku</a>
                        </p>

                        <p>Pokud mate dotazy, nevahejte nas kontaktovat.</p>
                        <p>S pozdravem,<br><strong>Tym podpory EzFix</strong></p>
                    </div>
                    <div class="footer">
                        <p>© 2026 EzFix. Vsechna prava vyhrazena.</p>
                        <p>Toto je automaticky e-mail. Neodpovidejte na tuto zpravu.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const mailOptions = {
            from: emailUser || 'noreply@ezfix.com',
            to: customerEmail,
            subject: `Potvrzeni objednavky #${orderNumber}`,
            html: emailHTML
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Order confirmation email sent:', info.response);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending order confirmation email:', error);
        throw error;
    }
}

/**
 * Send order status update email
 * @param {string} customerEmail - Customer email address
 * @param {string} customerName - Customer name
 * @param {string} orderNumber - Order number
 * @param {string} status - Order status
 * @param {object} order - Full order object
 * @returns {Promise}
 */
async function sendOrderStatusEmail(customerEmail, customerName, orderNumber, status, order = {}) {
    try {
    const skipped = ensureEmailConfigured('Order status email');
    if (skipped) return skipped;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const encodedOrder = encodeURIComponent(orderNumber);
    const encodedEmail = encodeURIComponent(customerEmail);
    const trackUrl = `${frontendUrl}/#track?order=${encodedOrder}&email=${encodedEmail}`;
        const statusMessages = {
            'pending': 'Vasi objednavku jsme prijali a ceka na potvrzeni.',
            'in-progress': 'Na vasi objednavce pracujeme. Oprava probiha.',
            'waiting': 'Objednavka ceka na dalsi krok.',
            'delivering': 'Objednavka je prave na ceste k vam.',
            'completed': 'Objednavka je dokoncena. Zarizeni je pripraveno k vyzvednuti/doruceni.',
            'delivered': 'Objednavka byla dorucena. Dekujeme za duveru!',
            'cancelled': 'Objednavka byla zrusena.'
        };

        const statusLabels = {
            'pending': 'Ceka',
            'in-progress': 'V prubehu',
            'waiting': 'Ceka',
            'delivering': 'Dorucuje se',
            'completed': 'Dokonceno',
            'delivered': 'Doruceno',
            'cancelled': 'Zruseno'
        };

        const statusMessage = statusMessages[status] || 'Stav objednavky byl aktualizovan.';
        const statusLabel = statusLabels[status] || 'Aktualizace';
        const statusColor = status === 'completed' || status === 'delivered'
            ? '#10b981'
            : status === 'cancelled'
                ? '#ef4444'
                : status === 'delivering'
                    ? '#3b82f6'
                    : '#f59e0b';

        const emailHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; }
                    .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusColor}; }
                    .status-badge { background: ${statusColor}; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin: 10px 0; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                    .button { background: #667eea; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; margin-top: 15px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Aktualizace objednavky EzFix</h1>
                    </div>
                    <div class="content">
                        <p>Dobry den ${customerName},</p>
                        <p>${statusMessage}</p>
                        
                        <div class="order-details">
                            <h3>Detaily objednavky</h3>
                            <p><strong>Cislo objednavky:</strong> #${orderNumber}</p>
                            <p><strong>Stav:</strong> <span class="status-badge">${statusLabel}</span></p>
                            <p><strong>Datum objednavky:</strong> ${order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}</p>
                            <p><strong>Celkova castka:</strong> ${formatCurrency(order.total || 0)}</p>
                        </div>

                        <p>Pokud mate dotazy, nevahejte nas kontaktovat.</p>
                        <p>
                            <a href="${trackUrl}" class="button">Sledovat objednavku</a>
                        </p>

                        <p>S pozdravem,<br><strong>Tym podpory EzFix</strong></p>
                    </div>
                    <div class="footer">
                        <p>© 2026 EzFix. Vsechna prava vyhrazena.</p>
                        <p>Toto je automaticky e-mail. Neodpovidejte na tuto zpravu.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const mailOptions = {
            from: emailUser || 'noreply@ezfix.com',
            to: customerEmail,
            subject: `Objednavka #${orderNumber} - Aktualizace stavu: ${statusLabel}`,
            html: emailHTML
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Order status email sent:', info.response);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending order status email:', error);
        throw error;
    }
}

/**
 * Send new order notification email to owner
 * @param {string} ownerEmail - Owner email address
 * @param {string} orderNumber - Order number
 * @param {string} customerName - Customer name
 * @param {string} customerEmail - Customer email
 * @param {number} total - Order total
 * @param {object} order - Full order object
 * @returns {Promise}
 */
async function sendNewOrderNotificationEmail(ownerEmail, orderNumber, customerName, customerEmail, total = 0, order = {}) {
    try {
        const skipped = ensureEmailConfigured('Owner notification email');
        if (skipped) return skipped;
        if (!ownerEmail) {
            throw new Error('Owner email is required');
        }

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const encodedEmail = encodeURIComponent(customerEmail || '');
        const adminUrl = `${frontendUrl}/#admin?email=${encodedEmail}`;

        const emailHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #111827; color: white; padding: 18px 20px; border-radius: 8px 8px 0 0; }
                    .content { background: #f9fafb; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; }
                    .order-box { background: white; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #3b82f6; }
                    .order-number { font-size: 20px; font-weight: bold; color: #1d4ed8; }
                    .button { background: #3b82f6; color: white; padding: 12px 22px; border-radius: 6px; text-decoration: none; display: inline-block; margin-top: 12px; }
                    .footer { text-align: center; padding: 16px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>Nova objednavka</h2>
                    </div>
                    <div class="content">
                        <div class="order-box">
                            <div class="order-number">#${orderNumber}</div>
                            <p><strong>Zakaznik:</strong> ${customerName || 'N/A'}</p>
                            <p><strong>E-mail:</strong> ${customerEmail || 'N/A'}</p>
                            <p><strong>Celkem:</strong> ${formatCurrency(total)}</p>
                            <p><strong>Typ sluzby:</strong> ${formatServiceType(order.service_type)}</p>
                            ${getPacketaPointLine(order)}
                        </div>
                        <p>Otevrete administraci pro kontrolu a zpracovani objednavky.</p>
                        <a href="${adminUrl}" class="button">Otevrit v administraci</a>
                    </div>
                    <div class="footer">
                        <p>Upozorneni na objednavku EzFix</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const mailOptions = {
            from: emailUser || 'noreply@ezfix.com',
            to: ownerEmail,
            subject: `Nova objednavka #${orderNumber}`,
            html: emailHTML
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Owner notification email sent:', info.response);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending owner notification email:', error);
        throw error;
    }
}

/**
 * Send custom email to customer
 * @param {string} customerEmail - Customer email address
 * @param {string} subject - Email subject
 * @param {string} message - Email message/body
 * @param {object} order - Order object for context
 * @returns {Promise}
 */
async function sendCustomEmail(customerEmail, subject, message, order = {}) {
    try {
        const skipped = ensureEmailConfigured('Custom email');
        if (skipped) return skipped;
        const emailHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; }
                    .message-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>EzFix - ${subject}</h1>
                    </div>
                    <div class="content">
                        <div class="message-box">
                            <p>${message.replace(/\n/g, '<br>')}</p>
                        </div>
                        ${order.order_number ? `
                            <p><strong>Referencni objednavka:</strong> #${order.order_number}</p>
                        ` : ''}
                        <p>S pozdravem,<br><strong>Tym podpory EzFix</strong></p>
                    </div>
                    <div class="footer">
                        <p>© 2026 EzFix. Vsechna prava vyhrazena.</p>
                        <p>Toto je automaticky e-mail. Neodpovidejte na tuto zpravu.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const mailOptions = {
            from: emailUser || 'noreply@ezfix.com',
            to: customerEmail,
            subject: subject,
            html: emailHTML
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Custom email sent:', info.response);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending custom email:', error);
        throw error;
    }
}

/**
 * Send password reset email
 * @param {string} customerEmail - Customer email address
 * @param {string} customerName - Customer name
 * @param {string} resetUrl - Password reset URL
 * @returns {Promise}
 */
async function sendPasswordResetEmail(customerEmail, customerName, resetUrl) {
    try {
        const skipped = ensureEmailConfigured('Password reset email');
        if (skipped) return skipped;
        const emailHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; }
                    .button { background: #2563eb; color: white; padding: 12px 20px; border-radius: 6px; text-decoration: none; display: inline-block; margin-top: 16px; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Obnova hesla</h1>
                    </div>
                    <div class="content">
                        <p>Dobry den ${customerName || ''},</p>
                        <p>Obdrzeli jsme zadost o obnovu hesla. Kliknete na tlacitko niz pro nastaveni noveho hesla.</p>
                        <p>
                            <a href="${resetUrl}" class="button">Nastavit nove heslo</a>
                        </p>
                        <p>Pokud jste o obnovu hesla nezadali vy, muzete tento e-mail ignorovat.</p>
                    </div>
                    <div class="footer">
                        <p>© 2026 EzFix. Vsechna prava vyhrazena.</p>
                        <p>Toto je automaticky e-mail. Neodpovidejte na tuto zpravu.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const mailOptions = {
            from: emailUser || 'ezfix.podpora@gmail.com',
            to: customerEmail,
            subject: 'Obnova hesla',
            html: emailHTML
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Password reset email sent:', info.response);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw error;
    }
}

module.exports = {
    sendOrderConfirmationEmail,
    sendOrderStatusEmail,
    sendNewOrderNotificationEmail,
    sendCustomEmail,
    sendPasswordResetEmail
};
