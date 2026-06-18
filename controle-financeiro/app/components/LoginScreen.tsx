'use client'
import { useState } from 'react'

export default function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    })
    setLoading(false)
    if (res.ok) {
      localStorage.setItem('cf-auth', '1')
      onLogin()
    } else {
      setError('Senha incorreta')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: '20px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '360px',
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '32px',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <div style={{
            width: '36px', height: '36px', background: 'var(--orange)',
            borderRadius: '8px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: 'white', fontFamily: "'IBM Plex Mono', monospace",
            fontWeight: 600, fontSize: '14px',
          }}>A</div>
          <div>
            <div style={{ fontSize: '10px', fontFamily: "'IBM Plex Mono', monospace", color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Acta Robotics
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
              Controle Financeiro
            </div>
          </div>
        </div>

        <form onSubmit={submit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '10px', fontFamily: "'IBM Plex Mono', monospace", color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
              Senha de acesso
            </label>
            <input
              type="password"
              value={pw}
              onChange={e => setPw(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'var(--bg3)',
                border: `1px solid ${error ? 'var(--red)' : 'var(--border)'}`,
                borderRadius: '8px',
                color: 'var(--text)',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {error && (
              <p style={{ fontSize: '12px', color: 'var(--red)', marginTop: '6px' }}>{error}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || !pw}
            style={{
              width: '100%',
              padding: '10px',
              background: 'var(--orange)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              fontWeight: 600,
              cursor: loading || !pw ? 'not-allowed' : 'pointer',
              opacity: loading || !pw ? 0.5 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            {loading ? 'Verificando...' : 'Entrar →'}
          </button>
        </form>
      </div>
    </div>
  )
}
