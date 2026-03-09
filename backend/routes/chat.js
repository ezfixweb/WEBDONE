/**
 * Chat Routes
 * Public chat widget + admin inbox/reply endpoints
 */

const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { db } = require('../config/database');
const { verifyToken, verifyOrderManager } = require('../middleware/auth');

function buildAiReply(userText = '') {
    const text = String(userText || '').toLowerCase();

    if (/(email|mail|kontakt)/.test(text)) {
        return 'Kontaktujte nas na podpora@ezfix.cz. Radi pomuzeme.';
    }
    if (/(telefon|phone|volat|call)/.test(text)) {
        return 'Telefon na majitele: +420 732 434 201.';
    }
    if (/(cena|price|kolik)/.test(text)) {
        return 'Napis nam typ zarizeni a zavadu, pripravime orientacni cenu.';
    }
    if (/(oprava|repair|servis|service)/.test(text)) {
        return 'Popiste prosim zarizeni a problem. Nasi technici odpovi co nejdrive.';
    }
    return 'Dekuji za zpravu. Tym EzFix vam odpovi co nejdrive.';
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

        res.json({
            success: true,
            sessionId: ensuredId
        });
    } catch (err) {
        console.error('Create chat session error:', err);
        res.status(500).json({ success: false, message: 'Failed to create session', error: err.message });
    }
});

router.get('/messages/:sessionId', async (req, res) => {
    try {
        const sessionId = String(req.params.sessionId || '').trim();
        if (!sessionId) {
            return res.status(400).json({ success: false, message: 'Session ID is required' });
        }

        const session = await db.getAsync('SELECT id FROM chat_sessions WHERE id = ?', [sessionId]);
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
             SET is_read_user = TRUE
             WHERE session_id = ? AND sender_type = 'admin' AND is_read_user = FALSE`,
            [sessionId]
        );

        res.json({ success: true, messages });
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

        const session = await db.getAsync('SELECT id FROM chat_sessions WHERE id = ?', [sessionId]);
        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        await db.runAsync(
            `INSERT INTO chat_messages (session_id, sender_type, sender_name, message, is_read_admin, is_read_user)
             VALUES (?, 'user', ?, ?, FALSE, TRUE)`,
            [sessionId, senderName || 'Visitor', message]
        );

        const aiReply = buildAiReply(message);
        await db.runAsync(
            `INSERT INTO chat_messages (session_id, sender_type, sender_name, message, is_read_admin, is_read_user)
             VALUES (?, 'bot', 'EzFix AI', ?, FALSE, TRUE)`,
            [sessionId, aiReply]
        );

        await db.runAsync(
            `UPDATE chat_sessions
             SET status = 'open', updated_at = CURRENT_TIMESTAMP, last_message_at = CURRENT_TIMESTAMP
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

        res.json({ success: true, messages, aiReply });
    } catch (err) {
        console.error('Send chat message error:', err);
        res.status(500).json({ success: false, message: 'Failed to send message', error: err.message });
    }
});

router.get('/admin/sessions', verifyToken, verifyOrderManager, async (req, res) => {
    try {
        const sessions = await db.allAsync(
            `SELECT
                s.id,
                s.customer_name,
                s.customer_email,
                s.help_topic,
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

        res.json({ success: true, sessions });
    } catch (err) {
        console.error('Get admin chat sessions error:', err);
        res.status(500).json({ success: false, message: 'Failed to load chat sessions', error: err.message });
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

        res.json({ success: true, session, messages });
    } catch (err) {
        console.error('Get admin chat messages error:', err);
        res.status(500).json({ success: false, message: 'Failed to load chat thread', error: err.message });
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
             SET status = 'open', updated_at = CURRENT_TIMESTAMP, last_message_at = CURRENT_TIMESTAMP
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

module.exports = router;
