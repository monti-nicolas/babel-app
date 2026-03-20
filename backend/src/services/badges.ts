import db from '../db/database'
import { getUserTotalPoints } from './points'

export interface BadgeResult {
  newBadge: Badge | null
  currentBadge: Badge
  totalPoints: number
  nextBadge: Badge | null
  pointsToNext: number | null
}

export interface Badge {
  id: string
  level: number
  name: string
  animal: string
  emoji: string
  pointsRequired: number
  description: string
  tagline: string
}

function mapBadge(row: any): Badge {
  return {
    id: row.id,
    level: row.level,
    name: row.name,
    animal: row.animal,
    emoji: row.emoji,
    pointsRequired: row.points_required,
    description: row.description,
    tagline: row.tagline,
  }
}

export function getAllBadges(): Badge[] {
  const rows = db.prepare('SELECT * FROM badges ORDER BY level ASC').all()
  return rows.map(mapBadge)
}

export function getCurrentBadge(totalPoints: number): Badge {
  const row = db.prepare(`
    SELECT * FROM badges
    WHERE points_required <= ?
    ORDER BY points_required DESC
    LIMIT 1
  `).get(totalPoints)

  // Fallback to level 1 if no badge found
  if (!row) {
    const first = db.prepare('SELECT * FROM badges ORDER BY level ASC LIMIT 1').get()
    return mapBadge(first)
  }

  return mapBadge(row)
}

export function getNextBadge(totalPoints: number): Badge | null {
  const row = db.prepare(`
    SELECT * FROM badges
    WHERE points_required > ?
    ORDER BY points_required ASC
    LIMIT 1
  `).get(totalPoints)

  return row ? mapBadge(row) : null
}

// Called after a book is registered. Returns new badge if one was just earned.
export function checkAndAwardBadge(userId: string, pointsBeforeBook: number): BadgeResult {
  const totalPoints = getUserTotalPoints(userId)
  const currentBadge = getCurrentBadge(totalPoints)
  const previousBadge = getCurrentBadge(pointsBeforeBook)
  const nextBadge = getNextBadge(totalPoints)
  const pointsToNext = nextBadge ? nextBadge.pointsRequired - totalPoints : null

  // Determine if a new badge was just earned
  const newBadge = currentBadge.level > previousBadge.level ? currentBadge : null

  if (newBadge) {
    // Record badge in user_badges if not already there
    const existing = db.prepare(`
      SELECT id FROM user_badges WHERE user_id = ? AND badge_id = ?
    `).get(userId, newBadge.id)

    if (!existing) {
      const { v4: uuidv4 } = require('uuid')
      db.prepare(`
        INSERT INTO user_badges (id, user_id, badge_id)
        VALUES (?, ?, ?)
      `).run(uuidv4(), userId, newBadge.id)
    }
  }

  return {
    newBadge,
    currentBadge,
    totalPoints,
    nextBadge,
    pointsToNext,
  }
}
