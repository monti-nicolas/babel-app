import { Router, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../db/database'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()

// -------------------------
// GET /api/reviews
// Get all reviews by the logged-in user
// -------------------------
router.get('/', requireAuth, (req: AuthRequest, res: Response): void => {
  const reviews = db.prepare(`
    SELECT
      r.id,
      r.book_id       as bookId,
      b.title         as bookTitle,
      b.author        as bookAuthor,
      b.cover_url     as bookCoverUrl,
      r.content,
      r.rating,
      r.created_at    as createdAt,
      r.updated_at    as updatedAt
    FROM reviews r
    JOIN books b ON b.id = r.book_id
    WHERE r.user_id = ?
    ORDER BY r.updated_at DESC
  `).all(req.userId)

  res.json({ reviews })
})

// -------------------------
// POST /api/reviews
// Write a new review for a registered book
// -------------------------
router.post('/', requireAuth, (req: AuthRequest, res: Response): void => {
  const { bookId, content, rating } = req.body

  if (!bookId || !content || !rating) {
    res.status(400).json({ error: 'Book, content and rating are required' })
    return
  }

  if (rating < 1 || rating > 5 || !Number.isInteger(Number(rating))) {
    res.status(400).json({ error: 'Rating must be a whole number between 1 and 5' })
    return
  }

  // Verify the book belongs to this user
  const book = db.prepare(`
    SELECT id FROM books WHERE id = ? AND user_id = ?
  `).get(bookId, req.userId)

  if (!book) {
    res.status(404).json({ error: 'Book not found in your reading history' })
    return
  }

  // One review per book
  const existing = db.prepare(`
    SELECT id FROM reviews WHERE book_id = ? AND user_id = ?
  `).get(bookId, req.userId)

  if (existing) {
    res.status(409).json({ error: 'You have already written a review for this book' })
    return
  }

  const reviewId = uuidv4()

  db.prepare(`
    INSERT INTO reviews (id, user_id, book_id, content, rating)
    VALUES (?, ?, ?, ?, ?)
  `).run(reviewId, req.userId, bookId, content.trim(), Number(rating))

  res.status(201).json({ message: 'Review saved', reviewId })
})

// -------------------------
// PUT /api/reviews/:id
// Edit an existing review
// -------------------------
router.put('/:id', requireAuth, (req: AuthRequest, res: Response): void => {
  const { content, rating } = req.body

  if (!content || !rating) {
    res.status(400).json({ error: 'Content and rating are required' })
    return
  }

  if (rating < 1 || rating > 5 || !Number.isInteger(Number(rating))) {
    res.status(400).json({ error: 'Rating must be a whole number between 1 and 5' })
    return
  }

  const review = db.prepare(`
    SELECT id FROM reviews WHERE id = ? AND user_id = ?
  `).get(req.params.id, req.userId)

  if (!review) {
    res.status(404).json({ error: 'Review not found' })
    return
  }

  db.prepare(`
    UPDATE reviews
    SET content = ?, rating = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(content.trim(), Number(rating), req.params.id)

  res.json({ message: 'Review updated' })
})

// -------------------------
// DELETE /api/reviews/:id
// -------------------------
router.delete('/:id', requireAuth, (req: AuthRequest, res: Response): void => {
  const review = db.prepare(`
    SELECT id FROM reviews WHERE id = ? AND user_id = ?
  `).get(req.params.id, req.userId)

  if (!review) {
    res.status(404).json({ error: 'Review not found' })
    return
  }

  db.prepare('DELETE FROM reviews WHERE id = ?').run(req.params.id)
  res.json({ message: 'Review deleted' })
})

export default router
