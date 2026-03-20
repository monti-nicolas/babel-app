import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import babelLogo from '../assets/babel-logo.png'

const AVATARS: Record<string, string> = {
  avatar_1: '🦊', avatar_2: '🐱', avatar_3: '🐺',
  avatar_4: '🦉', avatar_5: '🐉', avatar_6: '🐝',
  avatar_7: '🦅', avatar_8: '🦁', avatar_9: '🐭', avatar_10: '🥚',
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [iWantOpen, setIWantOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const iWantRef = useRef<HTMLDivElement>(null)

  // Close dropdowns on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
      if (iWantRef.current && !iWantRef.current.contains(e.target as Node)) setIWantOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const isActive = (path: string) => location.pathname === path

  const navLink = (path: string, label: string, closeMenu?: 'iWant' | 'profile') => (
    <button
      onClick={() => {
        navigate(path)
        if (closeMenu === 'iWant') setIWantOpen(false)
        if (closeMenu === 'profile') setMenuOpen(false)
      }}
      style={{
        color: isActive(path) ? 'var(--parchment)' : 'var(--ash-soft)',
        fontFamily: 'var(--font-body)',
        fontSize: '0.875rem',
        fontWeight: 500,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '8px 14px',
        borderRadius: 'var(--radius-sm)',
        transition: 'color var(--transition), background var(--transition)',
        display: 'block',
        width: '100%',
        textAlign: 'left',
        userSelect: 'none',
      }}
      onMouseEnter={e => {
        if (!isActive(path)) (e.currentTarget as HTMLElement).style.color = 'var(--white)'
        ;(e.currentTarget as HTMLElement).style.background = 'var(--glow)'
      }}
      onMouseLeave={e => {
        if (!isActive(path)) (e.currentTarget as HTMLElement).style.color = 'var(--ash-soft)'
        ;(e.currentTarget as HTMLElement).style.background = 'transparent'
      }}
    >
      {label}
    </button>
  )

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(13,15,20,0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border)',
      padding: '0 24px',
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      userSelect: 'none',
    }}>

      {/* Logo — babel.png image */}
      <button
        onClick={() => navigate('/dashboard')}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          padding: 0,
        }}
      >
        <img
          src={babelLogo}
          alt="Babel"
          style={{
            height: '36px',
            width: 'auto',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      </button>

      {/* Centre nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>

        {/* I want to... */}
        <div ref={iWantRef} style={{ position: 'relative' }}>
          <button
            onClick={() => { setIWantOpen(v => !v); setMenuOpen(false) }}
            style={{
              background: iWantOpen ? 'var(--glow)' : 'none',
              border: '1px solid',
              borderColor: iWantOpen ? 'var(--border)' : 'transparent',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--ash-soft)',
              fontFamily: 'var(--font-body)',
              fontSize: '1.5rem',
              fontWeight: 500,
              cursor: 'pointer',
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all var(--transition)',
              userSelect: 'none',
            }}
          >
            I want to…
            <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>▼</span>
          </button>

          {iWantOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--ink-soft)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '8px',
              minWidth: '200px',
              boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
              animation: 'fadeIn 0.15s ease both',
            }}>
              {navLink('/register-book', 'Register a book', 'iWant')}
              {navLink('/history', 'See my reading history', 'iWant')}
              {navLink('/badges', 'See my badges', 'iWant')}
              {navLink('/reviews', 'Write a review', 'iWant')}
            </div>
          )}
        </div>
      </div>

      {/* Right — avatar + account menu */}
      <div ref={menuRef} style={{ position: 'relative' }}>
        <button
          onClick={() => { setMenuOpen(v => !v); setIWantOpen(false) }}
          style={{
            background: menuOpen ? 'var(--glow)' : 'var(--ink-muted)',
            border: '1px solid var(--border)',
            borderRadius: '50px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 12px 4px 4px',
            transition: 'all var(--transition)',
            userSelect: 'none',
          }}
        >
          <div style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: 'var(--ink)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
          }}>
            {AVATARS[user?.avatarId || 'avatar_1']}
          </div>
          <span style={{ color: 'var(--white)', fontSize: '0.85rem', fontWeight: 500 }}>
            {user?.username}
          </span>
          <span style={{ fontSize: '0.65rem', color: 'var(--ash)', opacity: 0.7 }}>▼</span>
        </button>

        {menuOpen && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            background: 'var(--ink-soft)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '8px',
            minWidth: '180px',
            boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
            animation: 'fadeIn 0.15s ease both',
          }}>
            {navLink('/dashboard', '🏠 Home', 'profile')}
            {navLink('/account', '⚙️ Account', 'profile')}
            <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />
            <button
              onClick={() => { logout(); navigate('/') }}
              style={{
                color: '#e57373',
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
                fontWeight: 500,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px 14px',
                borderRadius: 'var(--radius-sm)',
                transition: 'background var(--transition)',
                display: 'block',
                width: '100%',
                textAlign: 'left',
                userSelect: 'none',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(229,115,115,0.1)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              🚪 Sign out
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
