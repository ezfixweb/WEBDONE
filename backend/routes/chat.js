/**
 * Chat Routes
 * Public chat widget + admin inbox/reply endpoints
 */

const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { db } = require('../config/database');
const { verifyToken, verifyOrderManager } = require('../middleware/auth');

const CHAT_AI_CONFIG_KEY = 'chat_ai_config_v1';
const DEFAULT_CHAT_AI_CONFIG = {
    email: {
        keywords: ['email', 'mail', 'kontakt'],
        reply: 'Muzete nas kontaktovat na podpora@ezfix.cz. Pokud chcete, napiste sem i typ zarizeni a problem a nas tym se vam ozve co nejdriv.'
    },
    phone: {
        keywords: ['telefon', 'phone', 'volat', 'call'],
        reply: 'Telefon na majitele: +420 732 434 201. Muzete take pokracovat tady v chatu a nas tym vam odpovi co nejdrive.'
    },
    price: {
        keywords: ['cena', 'price', 'kolik'],
        reply: 'Pro orientacni cenu napiste: typ zarizeni, model a zavadu. Nas tym vam pripravi odhad a ozve se co nejdriv.'
    },
    repair: {
        keywords: ['oprava', 'repair', 'servis', 'service'],
        reply: 'Popiste prosim zarizeni, problem a od kdy trva. Nasi technici se vam ozvou co nejdriv.'
    },
    fallbackReply: 'Dekujeme za zpravu. Pro rychlejsi pomoc muzete doplnit typ zarizeni, model a popis problemu. Tym EzFix se vam ozve co nejdriv.'
};

let chatAiConfigCache = null;
let chatAiConfigCacheAt = 0;

function normalizeKeywordList(input) {
    const source = Array.isArray(input) ? input : [];
    return [...new Set(source
        .map((item) => String(item || '').trim().toLowerCase())
        .filter(Boolean))]
        .slice(0, 30);
}

function normalizeReplyText(value, fallback) {
    const text = String(value || '').trim();
    if (!text) return fallback;
    return text.slice(0, 1200);
}

function normalizeChatAiConfig(rawConfig = {}) {
    const source = rawConfig && typeof rawConfig === 'object' ? rawConfig : {};
    return {
        email: {
            keywords: normalizeKeywordList(source.email?.keywords || DEFAULT_CHAT_AI_CONFIG.email.keywords),
            reply: normalizeReplyText(source.email?.reply, DEFAULT_CHAT_AI_CONFIG.email.reply)
        },
        phone: {
            keywords: normalizeKeywordList(source.phone?.keywords || DEFAULT_CHAT_AI_CONFIG.phone.keywords),
            reply: normalizeReplyText(source.phone?.reply, DEFAULT_CHAT_AI_CONFIG.phone.reply)
        },
        price: {
            keywords: normalizeKeywordList(source.price?.keywords || DEFAULT_CHAT_AI_CONFIG.price.keywords),
            reply: normalizeReplyText(source.price?.reply, DEFAULT_CHAT_AI_CONFIG.price.reply)
        },
        repair: {
            keywords: normalizeKeywordList(source.repair?.keywords || DEFAULT_CHAT_AI_CONFIG.repair.keywords),
            reply: normalizeReplyText(source.repair?.reply, DEFAULT_CHAT_AI_CONFIG.repair.reply)
        },
        fallbackReply: normalizeReplyText(source.fallbackReply, DEFAULT_CHAT_AI_CONFIG.fallbackReply)
    };
}

function normalizeForMatch(value) {
    return String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

async function getChatAiConfig(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && chatAiConfigCache && (now - chatAiConfigCacheAt) < 15000) {
        return chatAiConfigCache;
    }

    try {
        const row = await db.getAsync('SELECT data FROM catalog WHERE key = ?', [CHAT_AI_CONFIG_KEY]);
        if (!row || !row.data) {
            chatAiConfigCache = normalizeChatAiConfig(DEFAULT_CHAT_AI_CONFIG);
            chatAiConfigCacheAt = now;
            return chatAiConfigCache;
        }

        let parsed = null;
        try {
            parsed = JSON.parse(row.data);
        } catch {
            parsed = null;
        }

        chatAiConfigCache = normalizeChatAiConfig(parsed || DEFAULT_CHAT_AI_CONFIG);
        chatAiConfigCacheAt = now;
        return chatAiConfigCache;
    } catch (err) {
        console.error('Load chat AI config error:', err);
        chatAiConfigCache = normalizeChatAiConfig(DEFAULT_CHAT_AI_CONFIG);
        chatAiConfigCacheAt = now;
        return chatAiConfigCache;
    }
}

async function buildAiReply(userText = '') {
    const text = normalizeForMatch(userText);
    const config = await getChatAiConfig();

    const groups = [
        config.email,
        config.phone,
        config.price,
        config.repair
    ];

    for (const group of groups) {
        const keywords = Array.isArray(group?.keywords) ? group.keywords : [];
        if (keywords.some((keyword) => text.includes(normalizeForMatch(keyword)))) {
            return {
                reply: group.reply || config.fallbackReply || DEFAULT_CHAT_AI_CONFIG.fallbackReply,
                matched: true
            };
        }
    }

    return {
        reply: config.fallbackReply || DEFAULT_CHAT_AI_CONFIG.fallbackReply,
        matched: false
    };
}

function isTypingFresh(timestampValue) {
    if (!timestampValue) return false;
    const ts = new Date(timestampValue).getTime();
    if (!Number.isFinite(ts)) return false;
    return (Date.now() - ts) <= 10000;
}

function buildTypingState(session = {}) {
    const userName = String(session.typing_user_name || '').trim();
    const adminName = String(session.typing_admin_name || '').trim();

    return {
        userName,
        adminName,
        userActive: Boolean(userName && isTypingFresh(session.typing_user_at)),
        adminActive: Boolean(adminName && isTypingFresh(session.typing_admin_at))
    };
}

async function ensureSession(sessionId, visitorId, name, email, helpTopic) {
    if (sessionId) {
        const existing = await db.getAsync('SELECT id FROM chat_sessions WHERE id = ?', [sessionId]);
        if (existing) {
            await db.runAsync(
                `UPDATE chat_sessions
                 SET customer_name = COALESCE(NULLIF(?, ''), customer_name),
                     customer_email = COALESCE(NULLIF(?, ''), customer_email),
                     help_topic = COALESCE(NULLIF(?, ''), help_topic),
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [name || '', email || '', helpTopic || '', sessionId]
            );
            return sessionId;
        }
    }

    const newId = crypto.randomUUID();
    await db.runAsync(
        `INSERT INTO chat_sessions (id, visitor_id, customer_name, customer_email, help_topic, status)
         VALUES (?, ?, ?, ?, ?, 'open')`,
        [newId, visitorId || null, name || null, email || null, helpTopic || null]
    );

    return newId;
}

router.post('/session', async (req, res) => {
    try {
        const sessionId = String(req.body?.sessionId || '').trim();
        const visitorId = String(req.body?.visitorId || '').trim();
        const name = String(req.body?.name || '').trim();
        const email = String(req.body?.email || '').trim().toLowerCase();
        const helpTopic = String(req.body?.helpTopic || '').trim();

        const ensuredId = await ensureSession(sessionId, visitorId, name, email, helpTopic);
        const session = await db.getAsync('SELECT * FROM chat_sessions WHERE id = ?', [ensuredId]);

        res.json({
            success: true,
            sessionId: ensuredId,
            session
        });
    } catch (err) {
        console.error('Create chat session error:', err);
        res.status(500).json({ success: false, message: 'Failed to create session', error: err.message });
    }
});

router.get('/messages/:sessionId', async (req, res) => {
    try {
        const sessionId = String(req.params.sessionId || '').trim();
        const markReadUser = String(req.query?.markReadUser || '1') !== '0';
        if (!sessionId) {
            return res.status(400).json({ success: false, message: 'Session ID is required' });
        }

        const session = await db.getAsync(
            `SELECT id, customer_name, customer_email, help_topic, assigned_admin_name, status,
                    typing_user_name, typing_user_at, typing_admin_name, typing_admin_at
             FROM chat_sessions
             WHERE id = ?`,
            [sessionId]
        );
        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        const messages = await db.allAsync(
            `SELECT id, sender_type, sender_name, message, created_at
             FROM chat_messages
             WHERE session_id = ?
             ORDER BY created_at ASC`,
            [sessionId]
        );

        let unreadUserCount = 0;
        if (markReadUser) {
            await db.runAsync(
                `UPDATE chat_messages
                 SET is_read_user = TRUE
                 WHERE session_id = ? AND sender_type = 'admin' AND is_read_user = FALSE`,
                [sessionId]
            );
        } else {
            const unreadRow = await db.getAsync(
                `SELECT COUNT(*)::int AS unread_count
                 FROM chat_messages
                 WHERE session_id = ?
                   AND sender_type = 'admin'
                   AND is_read_user = FALSE`,
                [sessionId]
            );
            unreadUserCount = Number(unreadRow?.unread_count || 0);
        }

        res.json({
            success: true,
            session: { ...session, typing: buildTypingState(session) },
            messages,
            unreadUserCount
        });
    } catch (err) {
        console.error('Get chat messages error:', err);
        res.status(500).json({ success: false, message: 'Failed to load messages', error: err.message });
    }
});

router.post('/messages/:sessionId', async (req, res) => {
    try {
        const sessionId = String(req.params.sessionId || '').trim();
        const message = String(req.body?.message || '').trim();
        const senderName = String(req.body?.senderName || 'Visitor').trim();

        if (!sessionId || !message) {
            return res.status(400).json({ success: false, message: 'Session ID and message are required' });
        }

        const session = await db.getAsync(
            `SELECT id, customer_name, customer_email, help_topic, assigned_admin_name, status,
                    typing_user_name, typing_user_at, typing_admin_name, typing_admin_at
             FROM chat_sessions
             WHERE id = ?`,
            [sessionId]
        );
        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        const sessionStatus = String(session.status || '').toLowerCase();
        if (sessionStatus === 'closed') {
            return res.status(409).json({ success: false, message: 'Chat session is closed' });
        }

        if (sessionStatus === 'awaiting_rating') {
            const isRatingMessage = /^hodnocení admina\s+.+:\s*[1-5]\/5$/i.test(message);
            if (!isRatingMessage) {
                return res.status(409).json({ success: false, message: 'Chat is waiting for rating' });
            }
        }

        // Prevent accidental duplicate submits (double Enter/click/retry) from creating repeated AI responses.
        const duplicateWindowSeconds = Number(process.env.CHAT_DUPLICATE_WINDOW_SECONDS || 8);
        const latestUserMessage = await db.getAsync(
            `SELECT id, message, created_at
             FROM chat_messages
             WHERE session_id = ? AND sender_type = 'user'
             ORDER BY created_at DESC
             LIMIT 1`,
            [sessionId]
        );

        const latestCreatedAt = latestUserMessage && latestUserMessage.created_at
            ? new Date(latestUserMessage.created_at).getTime()
            : 0;
        const duplicateWindowMs = Number.isFinite(duplicateWindowSeconds) ? Math.max(1000, duplicateWindowSeconds * 1000) : 8000;
        const isDuplicateUserMessage = Boolean(
            latestUserMessage &&
            String(latestUserMessage.message || '').trim() === message &&
            latestCreatedAt &&
            (Date.now() - latestCreatedAt) <= duplicateWindowMs
        );

        if (isDuplicateUserMessage) {
            const updatedSession = await db.getAsync(
                `SELECT id, customer_name, customer_email, help_topic, assigned_admin_name, status,
                        typing_user_name, typing_user_at, typing_admin_name, typing_admin_at
                 FROM chat_sessions
                 WHERE id = ?`,
                [sessionId]
            );

            const messages = await db.allAsync(
                `SELECT id, sender_type, sender_name, message, created_at
                 FROM chat_messages
                 WHERE session_id = ?
                 ORDER BY created_at ASC`,
                [sessionId]
            );

            const replySession = updatedSession || session;
            return res.json({ success: true, messages, duplicate: true, session: { ...replySession, typing: buildTypingState(replySession) } });
        }

        const userMessageCountRow = await db.getAsync(
            `SELECT COUNT(*)::int AS total
             FROM chat_messages
             WHERE session_id = ? AND sender_type = 'user'`,
            [sessionId]
        );
        const previousUserMessageCount = Number(userMessageCountRow?.total || 0);

        await db.runAsync(
            `INSERT INTO chat_messages (session_id, sender_type, sender_name, message, is_read_admin, is_read_user)
             VALUES (?, 'user', ?, ?, FALSE, TRUE)`,
            [sessionId, senderName || 'Visitor', message]
        );

        const aiDecision = await buildAiReply(message);
        const shouldInsertAiReply = Boolean(aiDecision?.matched) || previousUserMessageCount === 0;
        const aiReply = shouldInsertAiReply ? String(aiDecision?.reply || '') : null;
        if (aiReply) {
            await db.runAsync(
                `INSERT INTO chat_messages (session_id, sender_type, sender_name, message, is_read_admin, is_read_user)
                 VALUES (?, 'bot', 'EzFix AI', ?, FALSE, TRUE)`,
                [sessionId, aiReply]
            );
        }

        await db.runAsync(
            `UPDATE chat_sessions
             SET status = 'open',
                 typing_user_name = NULL,
                 typing_user_at = NULL,
                 updated_at = CURRENT_TIMESTAMP,
                 last_message_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [sessionId]
        );

        if (sessionStatus === 'awaiting_rating') {
            await db.runAsync(
                `UPDATE chat_sessions
                 SET status = 'awaiting_rating',
                     updated_at = CURRENT_TIMESTAMP,
                     last_message_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [sessionId]
            );
        }

        const updatedSession = await db.getAsync(
            `SELECT id, customer_name, customer_email, help_topic, assigned_admin_name, status,
                    typing_user_name, typing_user_at, typing_admin_name, typing_admin_at
             FROM chat_sessions
             WHERE id = ?`,
            [sessionId]
        );

        const messages = await db.allAsync(
            `SELECT id, sender_type, sender_name, message, created_at
             FROM chat_messages
             WHERE session_id = ?
             ORDER BY created_at ASC`,
            [sessionId]
        );

        const replySession = updatedSession || session;
        res.json({ success: true, messages, aiReply, session: { ...replySession, typing: buildTypingState(replySession) } });
    } catch (err) {
        console.error('Send chat message error:', err);
        res.status(500).json({ success: false, message: 'Failed to send message', error: err.message });
    }
});

router.post('/typing/:sessionId', async (req, res) => {
    try {
        const sessionId = String(req.params.sessionId || '').trim();
        const isTyping = Boolean(req.body?.isTyping);
        const senderName = String(req.body?.name || 'Visitor').trim() || 'Visitor';

        if (!sessionId) {
            return res.status(400).json({ success: false, message: 'Session ID is required' });
        }

        const session = await db.getAsync('SELECT id, status FROM chat_sessions WHERE id = ?', [sessionId]);
        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        if (String(session.status || '').toLowerCase() === 'closed') {
            return res.status(409).json({ success: false, message: 'Chat session is closed' });
        }

        await db.runAsync(
            `UPDATE chat_sessions
             SET typing_user_name = ?,
                 typing_user_at = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [isTyping ? senderName : null, isTyping ? new Date().toISOString() : null, sessionId]
        );

        res.json({ success: true });
    } catch (err) {
        console.error('User typing status error:', err);
        res.status(500).json({ success: false, message: 'Failed to update typing status', error: err.message });
    }
});

router.get('/admin/sessions', verifyToken, verifyOrderManager, async (req, res) => {
    try {
        let sessions = [];
        try {
            sessions = await db.allAsync(
                `SELECT
                    s.id,
                    s.customer_name,
                    s.customer_email,
                    s.help_topic,
                    s.assigned_admin_id,
                    s.assigned_admin_name,
                    s.status,
                    s.last_message_at,
                    s.created_at,
                    lm.sender_type AS last_sender_type,
                    lm.message AS last_message,
                    COALESCE(unread.unread_count, 0) AS unread_count
                 FROM chat_sessions s
                 LEFT JOIN LATERAL (
                    SELECT sender_type, message
                    FROM chat_messages cm
                    WHERE cm.session_id = s.id
                    ORDER BY cm.created_at DESC
                    LIMIT 1
                 ) lm ON TRUE
                 LEFT JOIN LATERAL (
                    SELECT COUNT(*)::int AS unread_count
                    FROM chat_messages cm2
                    WHERE cm2.session_id = s.id
                      AND cm2.is_read_admin = FALSE
                      AND cm2.sender_type IN ('user', 'bot')
                 ) unread ON TRUE
                 ORDER BY s.last_message_at DESC, s.created_at DESC`
            );
        } catch (sessionErr) {
            console.error('Admin chat sessions primary query failed, using fallback:', sessionErr);
            sessions = await db.allAsync(
                `SELECT
                    s.id,
                    s.customer_name,
                    s.customer_email,
                    s.help_topic,
                    s.assigned_admin_id,
                    s.assigned_admin_name,
                    s.status,
                    s.last_message_at,
                    s.created_at,
                    NULL::TEXT AS last_sender_type,
                    NULL::TEXT AS last_message,
                    0::int AS unread_count
                 FROM chat_sessions s
                 ORDER BY s.last_message_at DESC, s.created_at DESC`
            );
        }

        let admins = [];
        try {
            admins = await db.allAsync(
                `SELECT username
                 FROM (
                    SELECT DISTINCT username
                    FROM users
                    WHERE role IN ('worker', 'manager', 'owner')
                      AND username IS NOT NULL
                      AND TRIM(username) <> ''
                 ) admins
                 ORDER BY LOWER(username) ASC, username ASC`
            );
        } catch (adminsErr) {
            console.error('Admin chat admins query failed, returning empty admin list:', adminsErr);
            admins = [];
        }

        res.json({
            success: true,
            sessions,
            admins: (admins || []).map((item) => item.username)
        });
    } catch (err) {
        console.error('Get admin chat sessions error:', err);
        res.status(500).json({ success: false, message: 'Failed to load chat sessions', error: err.message });
    }
});

router.get('/admin/ai-config', verifyToken, verifyOrderManager, async (req, res) => {
    try {
        const config = await getChatAiConfig(true);
        res.json({ success: true, config });
    } catch (err) {
        console.error('Get chat AI config error:', err);
        res.status(500).json({ success: false, message: 'Failed to load chat AI config', error: err.message });
    }
});

router.put('/admin/ai-config', verifyToken, verifyOrderManager, async (req, res) => {
    try {
        const incoming = (req.body && typeof req.body === 'object' && req.body.config)
            ? req.body.config
            : req.body;
        const normalizedConfig = normalizeChatAiConfig(incoming || {});

        await db.runAsync(
            `INSERT INTO catalog (key, data, updated_at)
             VALUES (?, ?, CURRENT_TIMESTAMP)
             ON CONFLICT (key)
             DO UPDATE SET data = EXCLUDED.data, updated_at = CURRENT_TIMESTAMP`,
            [CHAT_AI_CONFIG_KEY, JSON.stringify(normalizedConfig)]
        );

        chatAiConfigCache = normalizedConfig;
        chatAiConfigCacheAt = Date.now();

        res.json({ success: true, message: 'Chat AI config saved', config: normalizedConfig });
    } catch (err) {
        console.error('Save chat AI config error:', err);
        res.status(500).json({ success: false, message: 'Failed to save chat AI config', error: err.message });
    }
});

router.get('/admin/sessions/:sessionId/messages', verifyToken, verifyOrderManager, async (req, res) => {
    try {
        const sessionId = String(req.params.sessionId || '').trim();
        const session = await db.getAsync('SELECT * FROM chat_sessions WHERE id = ?', [sessionId]);

        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        const messages = await db.allAsync(
            `SELECT id, sender_type, sender_name, message, created_at
             FROM chat_messages
             WHERE session_id = ?
             ORDER BY created_at ASC`,
            [sessionId]
        );

        await db.runAsync(
            `UPDATE chat_messages
             SET is_read_admin = TRUE
             WHERE session_id = ?
               AND sender_type IN ('user', 'bot')
               AND is_read_admin = FALSE`,
            [sessionId]
        );

        res.json({ success: true, session: { ...session, typing: buildTypingState(session) }, messages });
    } catch (err) {
        console.error('Get admin chat messages error:', err);
        res.status(500).json({ success: false, message: 'Failed to load chat thread', error: err.message });
    }
});

router.post('/admin/sessions/:sessionId/take', verifyToken, verifyOrderManager, async (req, res) => {
    try {
        const sessionId = String(req.params.sessionId || '').trim();
        if (!sessionId) {
            return res.status(400).json({ success: false, message: 'Session ID is required' });
        }

        const session = await db.getAsync('SELECT * FROM chat_sessions WHERE id = ?', [sessionId]);
        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        const currentAdmin = String(req.user?.username || 'Admin').trim();
        if (session.assigned_admin_name && session.assigned_admin_name !== currentAdmin) {
            return res.status(409).json({
                success: false,
                message: `Chat is already taken by ${session.assigned_admin_name}`
            });
        }

        await db.runAsync(
            `UPDATE chat_sessions
             SET assigned_admin_id = ?,
                 assigned_admin_name = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [req.user?.id || null, currentAdmin, sessionId]
        );

        await db.runAsync(
            `INSERT INTO chat_messages (session_id, sender_type, sender_name, message, is_read_admin, is_read_user)
             VALUES (?, 'admin', ?, ?, TRUE, FALSE)`,
            [sessionId, currentAdmin, `Dobrý den, chat převzal admin ${currentAdmin}. Odpovím vám co nejdříve.`]
        );

        const updatedSession = await db.getAsync('SELECT * FROM chat_sessions WHERE id = ?', [sessionId]);
        res.json({ success: true, session: updatedSession });
    } catch (err) {
        console.error('Take chat session error:', err);
        res.status(500).json({ success: false, message: 'Failed to take chat session', error: err.message });
    }
});

router.post('/admin/sessions/:sessionId/reply', verifyToken, verifyOrderManager, async (req, res) => {
    try {
        const sessionId = String(req.params.sessionId || '').trim();
        const message = String(req.body?.message || '').trim();

        if (!sessionId || !message) {
            return res.status(400).json({ success: false, message: 'Session ID and message are required' });
        }

        const session = await db.getAsync('SELECT id FROM chat_sessions WHERE id = ?', [sessionId]);
        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        await db.runAsync(
            `INSERT INTO chat_messages (session_id, sender_type, sender_name, message, is_read_admin, is_read_user)
             VALUES (?, 'admin', ?, ?, TRUE, FALSE)`,
            [sessionId, req.user.username || 'Admin', message]
        );

        await db.runAsync(
            `UPDATE chat_sessions
             SET status = 'open',
                 typing_admin_name = NULL,
                 typing_admin_at = NULL,
                 updated_at = CURRENT_TIMESTAMP,
                 last_message_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [sessionId]
        );

        const messages = await db.allAsync(
            `SELECT id, sender_type, sender_name, message, created_at
             FROM chat_messages
             WHERE session_id = ?
             ORDER BY created_at ASC`,
            [sessionId]
        );

        res.json({ success: true, messages });
    } catch (err) {
        console.error('Admin reply chat error:', err);
        res.status(500).json({ success: false, message: 'Failed to send reply', error: err.message });
    }
});

router.post('/admin/sessions/:sessionId/typing', verifyToken, verifyOrderManager, async (req, res) => {
    try {
        const sessionId = String(req.params.sessionId || '').trim();
        const isTyping = Boolean(req.body?.isTyping);

        if (!sessionId) {
            return res.status(400).json({ success: false, message: 'Session ID is required' });
        }

        const session = await db.getAsync('SELECT id, status FROM chat_sessions WHERE id = ?', [sessionId]);
        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        if (String(session.status || '').toLowerCase() === 'closed') {
            return res.status(409).json({ success: false, message: 'Chat session is closed' });
        }

        const adminName = String(req.user?.username || 'Admin').trim() || 'Admin';
        await db.runAsync(
            `UPDATE chat_sessions
             SET typing_admin_name = ?,
                 typing_admin_at = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [isTyping ? adminName : null, isTyping ? new Date().toISOString() : null, sessionId]
        );

        res.json({ success: true });
    } catch (err) {
        console.error('Admin typing status error:', err);
        res.status(500).json({ success: false, message: 'Failed to update typing status', error: err.message });
    }
});

router.post('/admin/sessions/:sessionId/close', verifyToken, verifyOrderManager, async (req, res) => {
    try {
        const sessionId = String(req.params.sessionId || '').trim();
        if (!sessionId) {
            return res.status(400).json({ success: false, message: 'Session ID is required' });
        }

        const session = await db.getAsync('SELECT * FROM chat_sessions WHERE id = ?', [sessionId]);
        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        const currentAdmin = String(req.user?.username || 'Admin').trim();
        const assignedAdmin = String(session.assigned_admin_name || '').trim();
        if (assignedAdmin && assignedAdmin !== currentAdmin) {
            return res.status(409).json({ success: false, message: `Chat is taken by ${assignedAdmin}` });
        }

        const existingStatus = String(session.status || '').toLowerCase();
        if (existingStatus === 'awaiting_rating' || existingStatus === 'closed') {
            await db.runAsync(
                `DELETE FROM chat_sessions
                 WHERE id = ?`,
                [sessionId]
            );

            return res.json({ success: true, message: 'Chat permanently deleted', phase: 'final' });
        }

        const closingText = `Chat byl ukončen administrátorem ${currentAdmin}. Děkujeme za kontakt.`;
        const ratingToken = `__RATE_ADMIN__:${currentAdmin}`;

        await db.runAsync(
            `INSERT INTO chat_messages (session_id, sender_type, sender_name, message, is_read_admin, is_read_user)
             VALUES (?, 'admin', ?, ?, TRUE, FALSE)`,
            [sessionId, currentAdmin, closingText]
        );

        await db.runAsync(
            `INSERT INTO chat_messages (session_id, sender_type, sender_name, message, is_read_admin, is_read_user)
             VALUES (?, 'admin', ?, ?, TRUE, FALSE)`,
            [sessionId, currentAdmin, ratingToken]
        );

        await db.runAsync(
            `UPDATE chat_sessions
             SET status = 'awaiting_rating',
                 typing_user_name = NULL,
                 typing_user_at = NULL,
                 typing_admin_name = NULL,
                 typing_admin_at = NULL,
                 updated_at = CURRENT_TIMESTAMP,
                 last_message_at = CURRENT_TIMESTAMP,
                 assigned_admin_id = COALESCE(assigned_admin_id, ?),
                 assigned_admin_name = COALESCE(NULLIF(assigned_admin_name, ''), ?)
             WHERE id = ?`,
            [req.user?.id || null, currentAdmin, sessionId]
        );

        res.json({ success: true, message: 'Chat closed for user, waiting for rating', phase: 'awaiting_rating' });
    } catch (err) {
        console.error('Close chat session error:', err);
        res.status(500).json({ success: false, message: 'Failed to close chat session', error: err.message });
    }
});

module.exports = router;
