import Database, { Database as DatabaseType } from 'better-sqlite3'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

const DB_PATH = process.env.DB_PATH || './babel.db'

const db: DatabaseType = new Database(path.resolve(DB_PATH))

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

export function initDb() {
  db.exec(`

    -- -------------------------
    -- USERS
    -- -------------------------
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      email       TEXT UNIQUE NOT NULL,
      username    TEXT NOT NULL,
      password    TEXT NOT NULL,
      avatar_id   TEXT NOT NULL DEFAULT 'avatar_1',
      background_id TEXT NOT NULL DEFAULT 'bg_1',
      is_verified INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- -------------------------
    -- EMAIL VERIFICATION TOKENS
    -- -------------------------
    CREATE TABLE IF NOT EXISTS email_tokens (
      id         TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL,
      token      TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      used       INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- -------------------------
    -- PASSWORD RESET TOKENS
    -- -------------------------
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id         TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL,
      token      TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      used       INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- -------------------------
    -- RFID TAGS
    -- -------------------------
    CREATE TABLE IF NOT EXISTS rfid_tags (
      id         TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL,
      uid        TEXT UNIQUE NOT NULL,
      label      TEXT NOT NULL DEFAULT 'My Tag',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- -------------------------
    -- BOOKS
    -- -------------------------
    CREATE TABLE IF NOT EXISTS books (
      id                TEXT PRIMARY KEY,
      user_id           TEXT NOT NULL,
      title             TEXT NOT NULL,
      author            TEXT NOT NULL,
      cover_url         TEXT,
      page_count        INTEGER,
      genre             TEXT,
      open_library_key  TEXT,
      registered_at     TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- -------------------------
    -- REVIEWS
    -- -------------------------
    CREATE TABLE IF NOT EXISTS reviews (
      id         TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL,
      book_id    TEXT NOT NULL UNIQUE,
      content    TEXT NOT NULL,
      rating     INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
    );

    -- -------------------------
    -- POINTS LEDGER
    -- Each row is one points event tied to a book registration.
    -- We keep a ledger rather than a single total so we can always
    -- show a full breakdown to the user.
    -- -------------------------
    CREATE TABLE IF NOT EXISTS points_ledger (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL,
      book_id     TEXT NOT NULL,
      base_points INTEGER NOT NULL DEFAULT 1,
      bonus_points INTEGER NOT NULL DEFAULT 0,
      bonus_reason TEXT,
      total_points INTEGER NOT NULL,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
    );

    -- -------------------------
    -- BADGES
    -- Static definition of all 10 badge levels.
    -- -------------------------
    CREATE TABLE IF NOT EXISTS badges (
      id               TEXT PRIMARY KEY,
      level            INTEGER UNIQUE NOT NULL,
      name             TEXT NOT NULL,
      animal           TEXT NOT NULL,
      emoji            TEXT NOT NULL,
      points_required  INTEGER NOT NULL,
      description      TEXT NOT NULL,
      tagline          TEXT NOT NULL
    );

    -- -------------------------
    -- USER BADGES
    -- Records when a user earned each badge.
    -- -------------------------
    CREATE TABLE IF NOT EXISTS user_badges (
      id         TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL,
      badge_id   TEXT NOT NULL,
      earned_at  TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (user_id, badge_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE
    );

    -- -------------------------
    -- SCAN EVENTS
    -- Temporary store for RFID scan events.
    -- The WebSocket flow reads from here and cleans up after use.
    -- -------------------------
    CREATE TABLE IF NOT EXISTS scan_events (
      id         TEXT PRIMARY KEY,
      uid        TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

  `)

  seedBadges()
  console.log('Database initialised successfully')
}

function seedBadges() {
  const count = db.prepare('SELECT COUNT(*) as count FROM badges').get() as { count: number }
  if (count.count > 0) return

  const insert = db.prepare(`
    INSERT INTO badges (id, level, name, animal, emoji, points_required, description, tagline)
    VALUES (@id, @level, @name, @animal, @emoji, @points_required, @description, @tagline)
  `)

  const badges = [
    {
      id: 'badge_1',
      level: 1,
      name: 'Hatchling',
      animal: 'Egg',
      emoji: '🥚',
      points_required: 0,
      description: 'Every reader starts somewhere. Welcome to Babel!',
      tagline: 'Shh... something is about to hatch.'
    },
    {
      id: 'badge_2',
      level: 2,
      name: 'Tiny Paws',
      animal: 'Mouse',
      emoji: '🐭',
      points_required: 2,
      description: 'You\'ve read your first books and your tiny paws are turning pages fast.',
      tagline: 'Big adventures come in small packages.'
    },
    {
      id: 'badge_3',
      level: 3,
      name: 'Curious Cub',
      animal: 'Kitten',
      emoji: '🐱',
      points_required: 5,
      description: 'Curiosity didn\'t hurt this cat — it gave them more books to read.',
      tagline: 'Looking forward to putting my paws on the next chapter...'
    },
    {
      id: 'badge_4',
      level: 4,
      name: 'Busy Bee',
      animal: 'Bee',
      emoji: '🐝',
      points_required: 10,
      description: 'Buzzing from book to book, collecting stories like nectar.',
      tagline: 'So many books, so little time — better get buzzing!'
    },
    {
      id: 'badge_5',
      level: 5,
      name: 'Clever Fox',
      animal: 'Fox',
      emoji: '🦊',
      points_required: 18,
      description: 'Quick-witted and always one step ahead, just like the stories you devour.',
      tagline: 'I\'ve read enough books to outsmart anyone.'
    },
    {
      id: 'badge_6',
      level: 6,
      name: 'Wise Owl',
      animal: 'Owl',
      emoji: '🦉',
      points_required: 30,
      description: 'Your wisdom grows with every page. The night is young and so is your library.',
      tagline: 'Knowledge is my superpower. What\'s yours?'
    },
    {
      id: 'badge_7',
      level: 7,
      name: 'Swift Falcon',
      animal: 'Falcon',
      emoji: '🦅',
      points_required: 45,
      description: 'You soar through books with speed and precision. Nothing escapes your eye.',
      tagline: 'Reading at the speed of flight.'
    },
    {
      id: 'badge_8',
      level: 8,
      name: 'Mighty Wolf',
      animal: 'Wolf',
      emoji: '🐺',
      points_required: 65,
      description: 'You read in packs or alone — either way, you always finish the hunt.',
      tagline: 'The wolf doesn\'t lose sleep over the opinions of unread books.'
    },
    {
      id: 'badge_9',
      level: 9,
      name: 'Noble Lion',
      animal: 'Lion',
      emoji: '🦁',
      points_required: 90,
      description: 'Regal, powerful, and well-read. The library is your kingdom.',
      tagline: 'I don\'t just read stories. I live them.'
    },
    {
      id: 'badge_10',
      level: 10,
      name: 'Legendary Dragon',
      animal: 'Dragon',
      emoji: '🐉',
      points_required: 120,
      description: 'You have conquered Babel itself. Legendary reader, infinite stories await.',
      tagline: 'They said read 100 books. I said hold my bookmark.'
    },
  ]

  const seedAll = db.transaction(() => {
    for (const badge of badges) {
      insert.run(badge)
    }
  })

  seedAll()
  console.log('Badges seeded successfully')
}

export default db
