import { Router, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../db/database'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { calculatePoints } from '../services/points'
import { checkAndAwardBadge } from '../services/badges'
import { getUserTotalPoints } from '../services/points'
import { searchBooks } from '../services/openLibrary'

const router = Router()

// -------------------------
// GET /api/books/search?q=...
// Search Open Library for books
// -------------------------
router.get('/search', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const query = req.query.q as string

  if (!query || query.trim().length < 2) {
    res.status(400).json({ error: 'Search query must be at least 2 characters' })
    return
  }

  try {
    const books = await searchBooks(query.trim())
    res.json({ books })
  } catch (err) {
    console.error('Open Library search error:', err)
    res.status(502).json({ error: 'Book search service unavailable' })
  }
})

// -------------------------
// GET /api/books
// Get all books registered by the logged-in user
// -------------------------
router.get('/', requireAuth, (req: AuthRequest, res: Response): void => {
  const books = db.prepare(`
    SELECT
      b.id,
      b.title,
      b.author,
      b.cover_url     as coverUrl,
      b.page_count    as pageCount,
      b.genre,
      b.open_library_key as openLibraryKey,
      b.registered_at as registeredAt,
      COALESCE(pl.total_points, 0) as pointsEarned
    FROM books b
    LEFT JOIN points_ledger pl ON pl.book_id = b.id
    WHERE b.user_id = ?
    ORDER BY b.registered_at DESC
  `).all(req.userId)

  res.json({ books })
})

// -------------------------
// POST /api/books
// Register a new book
// -------------------------
router.post('/', requireAuth, (req: AuthRequest, res: Response): void => {
  const { title, author, coverUrl, pageCount, genre, openLibraryKey } = req.body

  if (!title || !author) {
    res.status(400).json({ error: 'Title and author are required' })
    return
  }

  // Get points total BEFORE adding the book (needed for badge comparison)
  const pointsBefore = getUserTotalPoints(req.userId!)

  const bookId = uuidv4()

  db.prepare(`
    INSERT INTO books (id, user_id, title, author, cover_url, page_count, genre, open_library_key)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    bookId,
    req.userId,
    title.trim(),
    author.trim(),
    coverUrl || null,
    pageCount || null,
    genre || null,
    openLibraryKey || null
  )

  // Calculate points for this registration
  const points = calculatePoints(req.userId!)

  // Record in points ledger
  db.prepare(`
    INSERT INTO points_ledger (id, user_id, book_id, base_points, bonus_points, bonus_reason, total_points)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(),
    req.userId,
    bookId,
    points.basePoints,
    points.bonusPoints,
    points.bonusReason,
    points.totalPoints
  )

  // Check if a new badge was earned
  const badgeResult = checkAndAwardBadge(req.userId!, pointsBefore)

  res.status(201).json({
    message: 'Book registered successfully',
    book: {
      id: bookId,
      title,
      author,
      coverUrl: coverUrl || null,
      pageCount: pageCount || null,
      genre: genre || null,
    },
    points: {
      basePoints: points.basePoints,
      bonusPoints: points.bonusPoints,
      totalPoints: points.totalPoints,
      descriptions: points.descriptions,
    },
    badge: badgeResult,
  })
})

// -------------------------
// DELETE /api/books/:id
// Remove a registered book
// -------------------------
router.delete('/:id', requireAuth, (req: AuthRequest, res: Response): void => {
  const book = db.prepare(`
    SELECT id FROM books WHERE id = ? AND user_id = ?
  `).get(req.params.id, req.userId)

  if (!book) {
    res.status(404).json({ error: 'Book not found' })
    return
  }

  // Run deletion + badge recalculation in a single transaction so the
  // database is never left in an inconsistent state.
  const deleteAndRecalculate = db.transaction(() => {
    // Delete the book — cascades to points_ledger and reviews via FK
    db.prepare('DELETE FROM books WHERE id = ?').run(req.params.id)

    // Recalculate the user's total points after the deletion
    const result = db.prepare(`
      SELECT COALESCE(SUM(total_points), 0) as total
      FROM points_ledger
      WHERE user_id = ?
    `).get(req.userId) as { total: number }

    const newTotal = result.total

    // Remove any earned badges the user no longer qualifies for
    db.prepare(`
      DELETE FROM user_badges
      WHERE user_id = ?
        AND badge_id IN (
          SELECT id FROM badges WHERE points_required > ?
        )
    `).run(req.userId, newTotal)
  })

  deleteAndRecalculate()

  res.json({ message: 'Book removed successfully' })
})

export default router
