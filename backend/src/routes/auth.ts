import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import db from '../db/database'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/email'

const router = Router()

// -------------------------
// POST /api/auth/signup
// -------------------------
router.post('/signup', async (req: Request, res: Response): Promise<void> => {
  const { email, username, password } = req.body

  if (!email || !username || !password) {
    res.status(400).json({ error: 'Email, username and password are required' })
    return
  }

  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' })
    return
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (existing) {
    res.status(409).json({ error: 'An account with this email already exists' })
    return
  }

  const hashedPassword = await bcrypt.hash(password, 12)
  const userId = uuidv4()

  // TODO: Set is_verified = 0 and re-enable email verification below
  // once a verified sending domain is configured in Resend.
  // For now all accounts are auto-verified on signup.
  db.prepare(`
    INSERT INTO users (id, email, username, password, is_verified)
    VALUES (?, ?, ?, ?, 1)
  `).run(userId, email.toLowerCase().trim(), username.trim(), hashedPassword)

  // TODO: EMAIL VERIFICATION — disabled until sending domain is configured
  // Uncomment this block and set is_verified = 0 above to re-enable.
  //
  // const emailToken = uuidv4()
  // const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  // db.prepare(`
  //   INSERT INTO email_tokens (id, user_id, token, expires_at)
  //   VALUES (?, ?, ?, ?)
  // `).run(uuidv4(), userId, emailToken, expiresAt)
  // try {
  //   await sendVerificationEmail(email, username, emailToken)
  // } catch (err) {
  //   console.error('Failed to send verification email:', err)
  // }

  // Award starter badge (level 1) immediately on signup
  const starterBadge = db.prepare('SELECT id FROM badges WHERE level = 1').get() as { id: string }
  if (starterBadge) {
    db.prepare(`
      INSERT INTO user_badges (id, user_id, badge_id)
      VALUES (?, ?, ?)
    `).run(uuidv4(), userId, starterBadge.id)
  }

  // TODO: Use different messages based on whether email verification is enabled or not.
  // For example, 'Account created. Please check your email to confirm your address.'
  res.status(201).json({
    message: 'Account created successfully. You can now sign in.',
  })
})

// -------------------------
// POST /api/auth/verify-email
// -------------------------
router.post('/verify-email', (req: Request, res: Response): void => {
  const { token } = req.body

  if (!token) {
    res.status(400).json({ error: 'Token is required' })
    return
  }

  const record = db.prepare(`
    SELECT * FROM email_tokens
    WHERE token = ? AND used = 0
  `).get(token) as any

  if (!record) {
    res.status(400).json({ error: 'Invalid or already used verification token' })
    return
  }

  if (new Date(record.expires_at) < new Date()) {
    res.status(400).json({ error: 'Verification token has expired' })
    return
  }

  db.prepare('UPDATE users SET is_verified = 1 WHERE id = ?').run(record.user_id)
  db.prepare('UPDATE email_tokens SET used = 1 WHERE id = ?').run(record.id)

  res.json({ message: 'Email verified successfully. You can now log in.' })
})

// -------------------------
// POST /api/auth/login
// -------------------------
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' })
    return
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim()) as any

  if (!user) {
    res.status(401).json({ error: 'Invalid email or password' })
    return
  }

  const passwordMatch = await bcrypt.compare(password, user.password)
  if (!passwordMatch) {
    res.status(401).json({ error: 'Invalid email or password' })
    return
  }

  if (!user.is_verified) {
    res.status(403).json({ error: 'Please verify your email before logging in' })
    return
  }

  const getJwtSecret = (): string => {
    const secret = process.env.JWT_SECRET
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is required')
    }
    return secret
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' } as any
  )

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      avatarId: user.avatar_id,
      backgroundId: user.background_id,
    },
  })
})

// -------------------------
// POST /api/auth/forgot-password
// -------------------------
router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body

  if (!email) {
    res.status(400).json({ error: 'Email is required' })
    return
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim()) as any

  // Always return success to prevent email enumeration
  if (!user) {
    res.json({ message: 'If an account exists for this email, a reset link has been sent.' })
    return
  }

  const token = uuidv4()
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour

  db.prepare(`
    INSERT INTO password_reset_tokens (id, user_id, token, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(uuidv4(), user.id, token, expiresAt)

  try {
    await sendPasswordResetEmail(email, user.username, token)
  } catch (err) {
    console.error('Failed to send password reset email:', err)
  }

  res.json({ message: 'If an account exists for this email, a reset link has been sent.' })
})

// -------------------------
// POST /api/auth/reset-password
// -------------------------
router.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
  const { token, password } = req.body

  if (!token || !password) {
    res.status(400).json({ error: 'Token and new password are required' })
    return
  }

  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' })
    return
  }

  const record = db.prepare(`
    SELECT * FROM password_reset_tokens
    WHERE token = ? AND used = 0
  `).get(token) as any

  if (!record) {
    res.status(400).json({ error: 'Invalid or already used reset token' })
    return
  }

  if (new Date(record.expires_at) < new Date()) {
    res.status(400).json({ error: 'Reset token has expired' })
    return
  }

  const hashedPassword = await bcrypt.hash(password, 12)
  db.prepare('UPDATE users SET password = ?, updated_at = datetime(\'now\') WHERE id = ?')
    .run(hashedPassword, record.user_id)
  db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE id = ?').run(record.id)

  res.json({ message: 'Password reset successfully. You can now log in.' })
})

// -------------------------
// DELETE /api/auth/account
// -------------------------
router.delete('/account', requireAuth, (req: AuthRequest, res: Response): void => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.userId)
  res.json({ message: 'Account deleted successfully' })
})

// -------------------------
// GET /api/auth/me
// -------------------------
router.get('/me', requireAuth, (req: AuthRequest, res: Response): void => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId) as any

  if (!user) {
    res.status(404).json({ error: 'User not found' })
    return
  }

  res.json({
    id: user.id,
    email: user.email,
    username: user.username,
    avatarId: user.avatar_id,
    backgroundId: user.background_id,
    createdAt: user.created_at,
  })
})

export default router
