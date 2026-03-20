import { Router, Response } from 'express'
import db from '../db/database'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { getAllBadges, getCurrentBadge, getNextBadge } from '../services/badges'
import { getUserTotalPoints } from '../services/points'

const router = Router()

// -------------------------
// PATCH /api/users/username
// -------------------------
router.patch('/username', requireAuth, (req: AuthRequest, res: Response): void => {
  const { username } = req.body

  if (!username || username.trim().length < 2) {
    res.status(400).json({ error: 'Username must be at least 2 characters' })
    return
  }

  db.prepare(`
    UPDATE users SET username = ?, updated_at = datetime('now') WHERE id = ?
  `).run(username.trim(), req.userId)

  res.json({ message: 'Username updated', username: username.trim() })
})

// -------------------------
// PATCH /api/users/avatar
// -------------------------
router.patch('/avatar', requireAuth, (req: AuthRequest, res: Response): void => {
  const { avatarId } = req.body

  if (!avatarId) {
    res.status(400).json({ error: 'Avatar ID is required' })
    return
  }

  db.prepare(`
    UPDATE users SET avatar_id = ?, updated_at = datetime('now') WHERE id = ?
  `).run(avatarId, req.userId)

  res.json({ message: 'Avatar updated', avatarId })
})

// -------------------------
// PATCH /api/users/background
// -------------------------
router.patch('/background', requireAuth, (req: AuthRequest, res: Response): void => {
  const { backgroundId } = req.body

  if (!backgroundId) {
    res.status(400).json({ error: 'Background ID is required' })
    return
  }

  db.prepare(`
    UPDATE users SET background_id = ?, updated_at = datetime('now') WHERE id = ?
  `).run(backgroundId, req.userId)

  res.json({ message: 'Background updated', backgroundId })
})

// -------------------------
// GET /api/users/stats
// Dashboard summary stats for the logged-in user
// -------------------------
router.get('/stats', requireAuth, (req: AuthRequest, res: Response): void => {
  const totalBooks = (db.prepare(`
    SELECT COUNT(*) as count FROM books WHERE user_id = ?
  `).get(req.userId) as any).count

  const totalReviews = (db.prepare(`
    SELECT COUNT(*) as count FROM reviews WHERE user_id = ?
  `).get(req.userId) as any).count

  const totalPoints = getUserTotalPoints(req.userId!)
  const currentBadge = getCurrentBadge(totalPoints)
  const nextBadge = getNextBadge(totalPoints)

  // 3 most recent books
  const recentBooks = db.prepare(`
    SELECT id, title, author, cover_url as coverUrl, registered_at as registeredAt
    FROM books WHERE user_id = ?
    ORDER BY registered_at DESC LIMIT 3
  `).all(req.userId)

  // 3 most recent reviews
  const recentReviews = db.prepare(`
    SELECT r.id, r.content, r.rating, r.updated_at as updatedAt,
           b.title as bookTitle, b.author as bookAuthor, b.cover_url as bookCoverUrl
    FROM reviews r
    JOIN books b ON b.id = r.book_id
    WHERE r.user_id = ?
    ORDER BY r.updated_at DESC LIMIT 3
  `).all(req.userId)

  res.json({
    totalBooks,
    totalReviews,
    totalPoints,
    currentBadge,
    nextBadge,
    pointsToNext: nextBadge ? nextBadge.pointsRequired - totalPoints : null,
    recentBooks,
    recentReviews,
  })
})

// -------------------------
// GET /api/users/badges
// Full badge journey for the logged-in user
// -------------------------
router.get('/badges', requireAuth, (req: AuthRequest, res: Response): void => {
  const totalPoints = getUserTotalPoints(req.userId!)
  const allBadges = getAllBadges()
  const currentBadge = getCurrentBadge(totalPoints)

  // Which badges has the user earned?
  const earnedRows = db.prepare(`
    SELECT badge_id, earned_at FROM user_badges WHERE user_id = ?
  `).all(req.userId) as any[]

  const earnedMap = new Map(earnedRows.map(r => [r.badge_id, r.earned_at]))

  const journey = allBadges.map(badge => ({
    ...badge,
    earned: earnedMap.has(badge.id),
    earnedAt: earnedMap.get(badge.id) || null,
    isCurrent: badge.level === currentBadge.level,
    booksNeeded: Math.ceil(badge.pointsRequired),
  }))

  res.json({ journey, totalPoints, currentBadgeLevel: currentBadge.level })
})

export default router
