'use client'
import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { parseBudget, parseExtrato } from '@/lib/excel'
import { X } from 'lucide-react'

interface Props {
  onClose: () => void
  onImported: () => void
  classMap: Record<string, any>
}

export default function ImportModal({ onClose, onImported, classMap }: Props) {
  const [budgetStatus, setBudgetStatus] = useState<string>('')
  const [extratoStatus, setExtratoStatus] = useState<string>('')
  const [loading, setLoading] = useState<string>('')
  const [error, setError] = useState<string>('')

  async function handleBudget(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading('budget')
    setError('')
    try {
      const buf = await file.arrayBuffer()
      const { rows, classMap: cm } = parseBudget(buf)
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'budget', rows, classMap: cm }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error)
      setBudgetStatus(`✓ ${file.name} — ${rows.length} linhas`)
      onImported()
    } catch (e: any) {
      setError('Erro ao importar budget: ' + e.message)
    } finally {
      setLoading('')
      e.target.value = ''
    }
  }

  async function handleExtrato(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading('extrato')
    setError('')
    try {
      const buf = await file.arrayBuffer()
      const rows = parseExtrato(buf, classMap)
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'extrato', rows }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error)
      setExtratoStatus(`✓ ${file.name} — ${rows.length} lançamentos`)
      onImported()
    } catch (e: any) {
      setError('Erro ao importar extrato: ' + e.message)
    } finally {
      setLoading('')
      e.target.value = ''
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,.75)' }}
         onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-xl rounded-2xl p-7 relative"
           style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded"
                style={{ color: 'var(--muted)' }}>
          <X size={18} />
        </button>

        <h2 className="text-base font-semibold mb-5">📥 Importar Dados</h2>

        {error && (
          <div className="mb-4 px-3 py-2 rounded-lg text-sm" style={{ background: 'rgba(231,76,60,.1)', color: 'var(--red)', border: '1px solid rgba(231,76,60,.2)' }}>
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {/* Budget */}
          <div className="rounded-xl p-5 text-center" style={{
            background: 'var(--bg3)',
            border: `1px ${budgetStatus ? 'solid' : 'dashed'} ${budgetStatus ? 'rgba(46,204,113,.4)' : 'rgba(255,255,255,.12)'}`,
          }}>
            <div className="text-3xl mb-2">📋</div>
            <div className="text-xs mono uppercase tracking-wider mb-1" style={{ color: 'var(--muted)' }}>Budget · Obrigatório</div>
            <div className="text-sm font-semibold mb-1">Planilha de Budget</div>
            <div className="text-xs mb-3" style={{ color: 'var(--muted)' }}>Extrato Financeiro — linhas Previsto</div>
            {budgetStatus && <div className="text-xs mono mb-2" style={{ color: 'var(--green)' }}>{budgetStatus}</div>}
            <label className="inline-block px-4 py-1.5 rounded-lg text-xs font-semibold text-white cursor-pointer"
                   style={{ background: loading === 'budget' ? '#999' : 'var(--orange)' }}>
              {loading === 'budget' ? 'Processando...' : 'Selecionar'}
              <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleBudget} disabled={loading === 'budget'} />
            </label>
          </div>

          {/* Extrato */}
          <div className="rounded-xl p-5 text-center" style={{
            background: 'var(--bg3)',
            border: `1px ${extratoStatus ? 'solid' : 'dashed'} ${extratoStatus ? 'rgba(46,204,113,.4)' : 'rgba(255,255,255,.12)'}`,
          }}>
            <div className="text-3xl mb-2">💳</div>
            <div className="text-xs mono uppercase tracking-wider mb-1" style={{ color: 'var(--muted)' }}>Extrato · Opcional</div>
            <div className="text-sm font-semibold mb-1">Extrato de Despesas</div>
            <div className="text-xs mb-3" style={{ color: 'var(--muted)' }}>Exportação do sistema — coluna Observações</div>
            {extratoStatus && <div className="text-xs mono mb-2" style={{ color: 'var(--green)' }}>{extratoStatus}</div>}
            <label className="inline-block px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                   style={{ background: 'rgba(255,255,255,.08)', color: 'var(--text)', border: '1px solid var(--border)' }}>
              {loading === 'extrato' ? 'Processando...' : 'Selecionar'}
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleExtrato} disabled={loading === 'extrato'} />
            </label>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 rounded-lg text-sm font-semibold text-white"
                  style={{ background: 'var(--orange)' }}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
