import { Router, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../db/database'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()

// Lazy import to avoid circular dependency
function broadcast(uid: string) {
  try {
    const { broadcastScanEvent } = require('../index')
    broadcastScanEvent(uid)
  } catch {
    // index not yet loaded — ignore
  }
}

// -------------------------
// GET /api/rfid/tags
// -------------------------
router.get('/tags', requireAuth, (req: AuthRequest, res: Response): void => {
  const tags = db.prepare(`
    SELECT id, uid, label, created_at as createdAt
    FROM rfid_tags
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(req.userId)

  res.json({ tags })
})

// -------------------------
// POST /api/rfid/tags
// -------------------------
router.post('/tags', requireAuth, (req: AuthRequest, res: Response): void => {
  const { uid, label } = req.body

  if (!uid) {
    res.status(400).json({ error: 'Tag UID is required' })
    return
  }

  const existing = db.prepare('SELECT id, user_id FROM rfid_tags WHERE uid = ?').get(uid) as any

  if (existing) {
    if (existing.user_id === req.userId) {
      res.status(409).json({ error: 'This tag is already linked to your account' })
    } else {
      res.status(409).json({ error: 'This tag is already linked to another account' })
    }
    return
  }

  const tagId = uuidv4()
  db.prepare(`
    INSERT INTO rfid_tags (id, user_id, uid, label)
    VALUES (?, ?, ?, ?)
  `).run(tagId, req.userId, uid, label || 'My Tag')

  db.prepare('DELETE FROM scan_events WHERE uid = ?').run(uid)

  res.status(201).json({
    message: 'Tag linked successfully',
    tag: { id: tagId, uid, label: label || 'My Tag' },
  })
})

// -------------------------
// DELETE /api/rfid/tags/:id
// -------------------------
router.delete('/tags/:id', requireAuth, (req: AuthRequest, res: Response): void => {
  const tag = db.prepare(`
    SELECT id FROM rfid_tags WHERE id = ? AND user_id = ?
  `).get(req.params.id, req.userId)

  if (!tag) {
    res.status(404).json({ error: 'Tag not found' })
    return
  }

  db.prepare('DELETE FROM rfid_tags WHERE id = ?').run(req.params.id)
  res.json({ message: 'Tag removed successfully' })
})

// -------------------------
// POST /api/rfid/scan
// Called by the Python scanner on the Pi.
// Stores scan event regardless of whether tag is registered —
// registered tags trigger WebSocket login, unregistered tags
// are available via /pending-raw for the registration flow.
// -------------------------
router.post('/scan', (req: Request, res: Response): void => {
  const { uid } = req.body

  if (!uid) {
    res.status(400).json({ error: 'UID is required' })
    return
  }

  // Store scan event
  db.prepare(`
    INSERT INTO scan_events (id, uid) VALUES (?, ?)
  `).run(uuidv4(), uid)

  // Clean up old scan events (older than 30 seconds)
  db.prepare(`
    DELETE FROM scan_events
    WHERE created_at < datetime('now', '-30 seconds')
  `).run()

  // Check if this tag belongs to a registered user — if so broadcast login
  const tag = db.prepare(`SELECT user_id FROM rfid_tags WHERE uid = ?`).get(uid)
  if (tag) {
    broadcast(uid)
  }

  res.json({ message: 'Scan received' })
})

// -------------------------
// GET /api/rfid/pending-raw
// Called by Account page when waiting to register a new tag.
// Returns the UID of the most recent scan not yet linked to any account.
// -------------------------
router.get('/pending-raw', requireAuth, (req: AuthRequest, res: Response): void => {
  const event = db.prepare(`
    SELECT scan_events.id as event_id, scan_events.uid
    FROM scan_events
    LEFT JOIN rfid_tags ON rfid_tags.uid = scan_events.uid
    WHERE rfid_tags.uid IS NULL
    ORDER BY scan_events.created_at DESC
    LIMIT 1
  `).get() as any

  if (!event) {
    res.json({ uid: null })
    return
  }

  db.prepare('DELETE FROM scan_events WHERE id = ?').run(event.event_id)
  res.json({ uid: event.uid })
})

// -------------------------
// GET /api/rfid/pending
// Polling fallback for WebSocket login — returns user for latest scan.
// -------------------------
router.get('/pending', (req: Request, res: Response): void => {
  const event = db.prepare(`
    SELECT scan_events.uid, scan_events.id as event_id, users.id, users.email,
           users.username, users.avatar_id, users.background_id
    FROM scan_events
    JOIN rfid_tags ON rfid_tags.uid = scan_events.uid
    JOIN users ON users.id = rfid_tags.user_id
    ORDER BY scan_events.created_at DESC
    LIMIT 1
  `).get() as any

  if (!event) {
    res.json({ scan: null })
    return
  }

  db.prepare('DELETE FROM scan_events WHERE id = ?').run(event.event_id)

  const token = require('jsonwebtoken').sign(
    { userId: event.id, email: event.email },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  )

  res.json({
    scan: {
      token,
      user: {
        id: event.id,
        email: event.email,
        username: event.username,
        avatarId: event.avatar_id,
        backgroundId: event.background_id,
      },
    },
  })
})

export default router
