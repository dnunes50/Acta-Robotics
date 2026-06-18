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
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm p-8 rounded-2xl border" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold mono"
               style={{ background: 'var(--orange)' }}>A</div>
          <div>
            <div className="text-xs font-medium mono uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
              Acta Robotics
            </div>
            <div className="text-sm font-semibold">Controle Financeiro</div>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs mono uppercase tracking-wider mb-1.5" style={{ color: 'var(--muted)' }}>
              Senha de acesso
            </label>
            <input
              type="password"
              value={pw}
              onChange={e => setPw(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={{
                background: 'var(--bg3)',
                border: `1px solid ${error ? 'var(--red)' : 'var(--border)'}`,
                color: 'var(--text)',
              }}
            />
            {error && <p className="text-xs mt-1.5" style={{ color: 'var(--red)' }}>{error}</p>}
          </div>
          <button
            type="submit"
            disabled={loading || !pw}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-40"
            style={{ background: 'var(--orange)' }}
          >
            {loading ? 'Verificando...' : 'Entrar →'}
          </button>
        </form>
      </div>
    </div>
  )
}
