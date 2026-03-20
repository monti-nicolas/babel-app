// User
export interface User {
  id: string
  email: string
  username: string
  avatarId: string
  backgroundId: string
  createdAt: string
}

// RFID
export interface RfidTag {
  id: string
  uid: string
  label: string
  createdAt: string
}

// Book
export interface Book {
  id: string
  title: string
  author: string
  coverUrl?: string
  pageCount?: number
  genre?: string
  openLibraryKey?: string
  registeredAt: string
}

// Review
export interface Review {
  id: string
  bookId: string
  bookTitle: string
  bookAuthor: string
  content: string
  rating: number
  createdAt: string
  updatedAt: string
}

// Points
export interface PointsBreakdown {
  base: number
  weeklyBonus: number
  total: number
  description: string[]
}

// Badge
export interface Badge {
  level: number
  name: string
  animal: string
  emoji: string
  pointsRequired: number
  description: string
  tagline: string
}

// API responses
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface ScanEvent {
  uid: string
  scannedAt: string
}
