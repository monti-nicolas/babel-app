# 📚 Book Tracker

A home RFID-powered reading tracker app built with a Raspberry Pi + PN532 NFC reader. Family members scan their personal RFID tag to log in, then register books they've read, earn points, collect animal badges, and write reviews.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Vite + Tailwind CSS |
| Backend | Node.js + TypeScript + Express |
| Database | SQLite via better-sqlite3 |
| Auth | JWT (1 day sessions) + Resend (email confirmation) |
| RFID Scanner | Python + Adafruit CircuitPython PN532 |
| Book Data | Open Library API |
| Animations | Lottie (badges) + canvas-confetti |
| Charts | Recharts |
| Process Manager | PM2 (Raspberry Pi deployment) |

## Project Structure

```
book-tracker/
├── scanner/        # Python RFID reader (runs on Raspberry Pi)
├── backend/        # Node.js + Express REST API
└── frontend/       # React SPA
```

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.9+
- Raspberry Pi 4 with PN532 NFC module (for RFID features)

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Fill in your .env values
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Scanner (Raspberry Pi only)

```bash
cd scanner
pip3 install -r requirements.txt
python3 scanner.py
```

## Deployment (Raspberry Pi)

```bash
# Clone repo on Pi
git clone <your-repo-url>

# Install PM2 globally
npm install -g pm2

# Start backend
cd backend && npm install && npm run build
pm2 start dist/index.js --name book-tracker-backend

# Start scanner
pm2 start scanner/scanner.py --interpreter python3 --name book-tracker-scanner

# Save PM2 process list
pm2 save
pm2 startup
```

## Environment Variables

See `backend/.env.example` for all required variables.
