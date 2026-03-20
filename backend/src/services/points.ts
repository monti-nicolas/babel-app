import db from '../db/database'

export interface PointsResult {
  basePoints: number
  bonusPoints: number
  bonusReason: string | null
  totalPoints: number
  descriptions: string[]
}

export function calculatePoints(userId: string): PointsResult {
  // Base points for registering a book
  const basePoints = 1
  const descriptions: string[] = ['+1pt for registering a new book']

  // Check how many books registered this calendar week (Mon–Sun)
  const booksThisWeek = db.prepare(`
    SELECT COUNT(*) as count
    FROM books
    WHERE user_id = ?
      AND registered_at >= datetime('now', 'weekday 0', '-7 days')
      AND registered_at < datetime('now', 'weekday 0', '+1 days')
  `).get(userId) as { count: number }

  // Bonus applies when this is the 2nd or more book in the same week
  const bonusPoints = booksThisWeek.count >= 1 ? 1 : 0
  const bonusReason = bonusPoints > 0 ? 'weekly_streak' : null

  if (bonusPoints > 0) {
    descriptions.push('+1pt bonus for registering multiple books this week')
  }

  return {
    basePoints,
    bonusPoints,
    bonusReason,
    totalPoints: basePoints + bonusPoints,
    descriptions,
  }
}

export function getUserTotalPoints(userId: string): number {
  const result = db.prepare(`
    SELECT COALESCE(SUM(total_points), 0) as total
    FROM points_ledger
    WHERE user_id = ?
  `).get(userId) as { total: number }

  return result.total
}
