import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import http from 'http'
import path from 'path'
import fs from 'fs'
import { WebSocketServer, WebSocket } from 'ws'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { initDb } from './db/database'
import db from './db/database'
import authRoutes from './routes/auth'
import rfidRoutes from './routes/rfid'
import bookRoutes from './routes/books'
import reviewRoutes from './routes/reviews'
import userRoutes from './routes/users'

dotenv.config()

const app = express()
const server = http.createServer(app)
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())

initDb()

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/auth', authRoutes)
app.use('/api/rfid', rfidRoutes)
app.use('/api/books', bookRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/users', userRoutes)

// ─── Production: serve built frontend ────────────────────────────────────────
// Only activates when frontend/dist exists (i.e. after `npm run build`).
// During local dev (npm run dev) dist won't exist so this is safely skipped.
const distPath = path.join(__dirname, '../../frontend/dist')
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))
  // Catch-all: return index.html for any non-API route so React Router works
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
  console.log('Serving frontend from', distPath)
}

const wss = new WebSocketServer({ server, path: '/ws' })
const waitingClients = new Map<string, WebSocket>()

wss.on('connection', (ws) => {
  const clientId = uuidv4()

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString())
      if (data.type === 'WAITING_FOR_SCAN') {
        waitingClients.set(clientId, ws)
      }
    } catch {
      // Ignore malformed messages
    }
  })

  ws.on('close', () => {
    waitingClients.delete(clientId)
  })
})

export function broadcastScanEvent(uid: string) {
  if (waitingClients.size === 0) return

  const result = db.prepare(`
    SELECT users.id, users.email, users.username, users.avatar_id, users.background_id
    FROM rfid_tags
    JOIN users ON users.id = rfid_tags.user_id
    WHERE rfid_tags.uid = ?
  `).get(uid) as any

  if (!result) return
  
  const getJwtSecret = (): string => {
    const secret = process.env.JWT_SECRET
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is required')
    }
    return secret
  }

  const token = jwt.sign(
    { userId: result.id, email: result.email },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' } as any
  )

  const payload = JSON.stringify({
    type: 'SCAN_LOGIN',
    token,
    user: {
      id: result.id,
      email: result.email,
      username: result.username,
      avatarId: result.avatar_id,
      backgroundId: result.background_id,
    },
  })

  for (const [id, client] of waitingClients.entries()) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload)
    } else {
      waitingClients.delete(id)
    }
  }
}

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export default app
